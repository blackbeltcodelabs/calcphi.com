"""
duplicates.py — AdSense Sentinel
Embeds all rendered pages with sentence-transformers, clusters near-duplicates
(cosine similarity > threshold), updates page_scores.json with info_gain
signal and penalties, and writes cache/duplicate_clusters.json.

Smart clustering rules (all read from config.yaml):
  1. exclude_urls         — skip pages excluded from scoring entirely
  2. noindex pages        — skip pages with <meta name="robots" noindex>
  3. content_type_aware   — never cluster a blog URL against a calculator URL
  4. dup_family_zones     — pages in the same product family (e.g. all FD
                            calculators) are exempted from clustering with
                            each other, even if their text is very similar
"""

import json
from pathlib import Path

import numpy as np
import yaml
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
CACHE_RENDERED = ROOT_DIR / "cache" / "rendered"
SCORES_PATH = ROOT_DIR / "cache" / "page_scores.json"
CLUSTERS_PATH = ROOT_DIR / "cache" / "duplicate_clusters.json"
CONFIG_PATH = SCRIPT_DIR / "config.yaml"
SITE_DIR = ROOT_DIR / "_site"


def url_to_site_path(url: str) -> Path:
    rel = url.replace("https://www.calcphi.com", "").lstrip("/")
    if rel.endswith(".html"):
        return SITE_DIR / rel
    return SITE_DIR / rel / "index.html"

MODEL_NAME = "all-MiniLM-L6-v2"
MAX_CHARS = 8000  # truncate before embedding to keep memory reasonable


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def is_noindex(url: str) -> bool:
    """Return True if the page's _site/ HTML contains a noindex robots meta tag."""
    path = url_to_site_path(url)
    if not path.exists():
        return False
    try:
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="replace"), "lxml")
        for tag in soup.find_all("meta", attrs={"name": "robots"}):
            content = tag.get("content", "").lower()
            if "noindex" in content:
                return True
    except Exception:
        pass
    return False


def is_blog_url(url: str) -> bool:
    return "/blog/" in url


def is_calculator_url(url: str) -> bool:
    """Calculator pages: not a blog, not an author page, not a root/hub page."""
    if "/blog/" in url or "/authors/" in url:
        return False
    path = url.replace("https://www.calcphi.com", "").strip("/")
    segments = path.split("/")
    # e.g. india/sip-calculator or australia/income-tax-calculator
    return len(segments) == 2 and segments[1].endswith("-calculator")


def build_family_lookup(cfg: dict) -> dict:
    """Return url → zone_name mapping from dup_family_zones config."""
    lookup = {}
    for zone in cfg.get("dup_family_zones", []):
        name = zone.get("name", "")
        for url in zone.get("urls", []):
            lookup[url.rstrip("/")] = name
    return lookup


def should_cluster(url_a: str, url_b: str, family_lookup: dict, content_type_aware: bool) -> bool:
    """
    Return False if these two pages should be exempted from duplicate clustering:
      - cross-type: one is a blog, the other is a calculator
      - same family zone: both serve the same product subfamily
    """
    if content_type_aware:
        if is_blog_url(url_a) != is_blog_url(url_b):
            return False  # blog vs calculator — different content types

    key_a = url_a.rstrip("/")
    key_b = url_b.rstrip("/")
    zone_a = family_lookup.get(key_a)
    zone_b = family_lookup.get(key_b)
    if zone_a and zone_a == zone_b:
        return False  # same product family — exempted

    return True


def extract_main_text(html: str, strip_selectors: list) -> str:
    soup = BeautifulSoup(html, "lxml")
    for sel in strip_selectors:
        for node in soup.select(sel):
            node.decompose()
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    if main is None:
        return ""
    return main.get_text(" ", strip=True)[:MAX_CHARS]


def load_page_texts(scores: list, strip_selectors: list) -> dict:
    """
    Load main-content text for embedding.
    Prefer _site/ (committed HTML, stable) over cache/rendered/ (Playwright,
    includes calculator widget UI that inflates word counts and shifts similarity).
    Fall back to cache/rendered/ for pages not in _site/ (e.g. 404, /markets/).
    """
    texts = {}
    for page in tqdm(scores, desc="Loading rendered HTML"):
        slug = page.get("slug")
        url = page.get("url", "")
        if not slug:
            continue

        site_path = url_to_site_path(url)
        rendered_path = CACHE_RENDERED / f"{slug}.html"

        if site_path.exists():
            html = site_path.read_text(encoding="utf-8", errors="replace")
        elif rendered_path.exists():
            html = rendered_path.read_text(encoding="utf-8", errors="replace")
        else:
            texts[slug] = ""
            continue

        texts[slug] = extract_main_text(html, strip_selectors)
    return texts


def build_clusters(
    scores: list,
    embeddings: np.ndarray,
    threshold: float,
    family_lookup: dict,
    content_type_aware: bool,
) -> list:
    """
    Returns a list of clusters. Each cluster is a list of dicts with url + slug.
    Uses single-linkage union-find, but respects content-type and family-zone
    exemptions — pairs that match an exemption rule are never merged even if
    their cosine similarity exceeds the threshold.
    """
    n = len(scores)
    sim_matrix = cosine_similarity(embeddings)

    # Union-find for clustering
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        parent[find(x)] = find(y)

    for i in range(n):
        for j in range(i + 1, n):
            if sim_matrix[i][j] >= threshold:
                url_i = scores[i].get("url", "")
                url_j = scores[j].get("url", "")
                if should_cluster(url_i, url_j, family_lookup, content_type_aware):
                    union(i, j)

    # Group by root
    groups: dict = {}
    for i in range(n):
        root = find(i)
        groups.setdefault(root, []).append(i)

    # Only return groups with >= 2 members (actual duplicates)
    clusters = []
    for root, members in groups.items():
        if len(members) < 2:
            continue
        cluster_pages = []
        for idx in members:
            page = scores[idx]
            cluster_pages.append({
                "url": page.get("url", ""),
                "slug": page.get("slug", ""),
                "score": page.get("score", 0),
                "max_similarity": float(
                    max(sim_matrix[idx][j] for j in members if j != idx)
                ),
            })
        clusters.append(sorted(cluster_pages, key=lambda p: -p["max_similarity"]))

    return clusters


def run_duplicates():
    cfg = load_config()
    threshold = cfg["thresholds"]["max_dup_similarity"]
    max_dup_pct = cfg["thresholds"]["max_dup_pct_of_page"]
    strip_sels = cfg["strip_selectors"]
    info_gain_weight = cfg["scoring_weights"]["info_gain"]
    exclude_urls = set(cfg.get("exclude_urls", []))
    content_type_aware = cfg.get("content_type_aware_clustering", True)
    family_lookup = build_family_lookup(cfg)

    with open(SCORES_PATH) as f:
        scores: list = json.load(f)

    # Filter out excluded URLs and noindex pages — they should not participate
    # in duplicate detection at all.
    valid_scores = [
        p for p in scores
        if p.get("slug")
        and p.get("status") != "ERROR"
        and p.get("url", "") not in exclude_urls
        and not is_noindex(p.get("url", ""))
    ]
    print(
        f"Embedding {len(valid_scores)} pages with {MODEL_NAME} "
        f"({len(scores) - len(valid_scores)} excluded/noindex skipped)..."
    )

    texts_map = load_page_texts(valid_scores, strip_sels)
    texts = [texts_map.get(p["slug"], "") for p in valid_scores]

    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)

    print("Clustering near-duplicates...")
    clusters = build_clusters(
        valid_scores, embeddings, threshold, family_lookup, content_type_aware
    )

    # Build a lookup: slug -> list of duplicate URLs + max similarity
    slug_to_dups: dict = {}
    for cluster in clusters:
        for page in cluster:
            others = [p["url"] for p in cluster if p["url"] != page["url"]]
            slug_to_dups[page["slug"]] = {
                "duplicate_urls": others,
                "max_similarity": page["max_similarity"],
            }

    # Update page_scores: fill in info_gain signal and adjust score
    for page in scores:
        slug = page.get("slug")
        if slug not in slug_to_dups:
            # No duplicate — perfect info_gain
            info_gain_sig = {
                "signal": "info_gain",
                "value": 0.0,
                "passed": True,
                "issues": [],
                "fixes": [],
            }
            dup_pct = 0.0
        else:
            dup_info = slug_to_dups[slug]
            sim = dup_info["max_similarity"]
            dup_pct = sim  # treat max similarity as proxy for % duplicated
            passed = dup_pct <= max_dup_pct
            issues = []
            fixes = []
            if not passed:
                dupes = dup_info["duplicate_urls"][:3]
                issues.append(
                    f"{dup_pct:.0%} content similarity with: "
                    + ", ".join(dupes)
                    + " (scaled content risk)"
                )
                fixes.append(
                    "Merge duplicate pages or add substantial unique content: "
                    "different worked examples, market-specific data, or distinct editorial angle."
                )
            info_gain_sig = {
                "signal": "info_gain",
                "value": round(dup_pct, 3),
                "passed": passed,
                "issues": issues,
                "fixes": fixes,
            }

        # Replace placeholder info_gain signal in signals list
        for i, sig in enumerate(page.get("signals", [])):
            if sig.get("signal") == "info_gain":
                page["signals"][i] = info_gain_sig
                break

        # Deduct info_gain weight from score if failed
        if not info_gain_sig["passed"]:
            page["score"] = max(0, page["score"] - info_gain_weight)
            if page["score"] < 70:
                page["status"] = "FAIL"
            # Append issues/fixes
            page.setdefault("issues", []).extend(info_gain_sig["issues"])
            page.setdefault("fixes", []).extend(info_gain_sig["fixes"])

    with open(SCORES_PATH, "w") as f:
        json.dump(scores, f, indent=2)

    cluster_output = {
        "total_clusters": len(clusters),
        "threshold_used": threshold,
        "clusters": clusters,
    }
    CLUSTERS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CLUSTERS_PATH, "w") as f:
        json.dump(cluster_output, f, indent=2)

    print(
        f"Duplicate detection complete: {len(clusters)} cluster(s) found  →  {CLUSTERS_PATH}"
    )
    if clusters:
        print("  Top clusters (by size):")
        for c in sorted(clusters, key=lambda x: -len(x))[:5]:
            print(f"    {len(c)} pages — e.g. {c[0]['url']}")

    return clusters


if __name__ == "__main__":
    run_duplicates()
