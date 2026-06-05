"""
scorer.py — AdSense Sentinel
Scores each cached page against 9 signals. Writes cache/page_scores.json.
info_gain score is a placeholder (0.5 neutral) until duplicates.py runs.
"""

import json
import re
from pathlib import Path
from urllib.parse import urlparse

import yaml
from bs4 import BeautifulSoup
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
CACHE_RAW = ROOT_DIR / "cache" / "raw"
CACHE_RENDERED = ROOT_DIR / "cache" / "rendered"
URL_MAP_PATH = ROOT_DIR / "cache" / "url_map.json"
SCORES_PATH = ROOT_DIR / "cache" / "page_scores.json"
CONFIG_PATH = SCRIPT_DIR / "config.yaml"
SITE_DIR = ROOT_DIR / "_site"  # source of truth for committed HTML


def url_to_site_path(url: str) -> Path:
    """Map a calcphi.com URL to its committed _site/ HTML file."""
    rel = url.replace("https://www.calcphi.com", "").lstrip("/")
    if rel.endswith(".html"):
        return SITE_DIR / rel
    return SITE_DIR / rel / "index.html"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def strip_boilerplate(soup: BeautifulSoup, strip_selectors: list) -> BeautifulSoup:
    for sel in strip_selectors:
        for node in soup.select(sel):
            node.decompose()
    return soup


def word_count(text: str) -> int:
    return len(text.split())


def extract_main_text(html: str, strip_selectors: list) -> str:
    soup = BeautifulSoup(html, "lxml")
    strip_boilerplate(soup, strip_selectors)
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    if main is None:
        return ""
    return main.get_text(" ", strip=True)


def extract_meta(html: str) -> tuple:
    soup = BeautifulSoup(html, "lxml")
    title = soup.title.get_text(strip=True) if soup.title else ""
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag.get("content", "").strip() if desc_tag else ""
    return title, desc


# ---------------------------------------------------------------------------
# Signal scorers
# ---------------------------------------------------------------------------

def score_word_count(text: str, cfg: dict) -> dict:
    wc = word_count(text)
    passed = wc >= cfg["thresholds"]["min_word_count"]
    issues, fixes = [], []
    if not passed:
        issues.append(f"word_count={wc} (< {cfg['thresholds']['min_word_count']})")
        fixes.append(
            f"Expand main content to at least {cfg['thresholds']['min_word_count']} words "
            "with unique worked examples and explanation."
        )
    return {"signal": "word_count", "value": wc, "passed": passed, "issues": issues, "fixes": fixes}


def score_editorial_depth(html: str, cfg: dict) -> dict:
    eb = cfg["editorial_blocks"]
    soup = BeautifulSoup(html, "lxml")
    text_lower = soup.get_text(" ", strip=True).lower()
    missing = []

    if not soup.find(["h1", "h2"]):
        missing.append("intro heading (h1/h2)")

    if not any(p in text_lower for p in eb["example_patterns"]):
        missing.append("worked example (real-world scenario)")

    if not any(p in text_lower for p in eb["methodology_patterns"]):
        missing.append("methodology/formula explanation")

    faq_items = soup.select(".faq-item")
    if len(faq_items) < eb["faq_min_items"]:
        faq_headings = [h for h in soup.find_all(["h3", "h4"]) if "?" in h.get_text()]
        if len(faq_headings) < eb["faq_min_items"]:
            missing.append(f"FAQ with >= {eb['faq_min_items']} questions")

    if not any(p in text_lower for p in eb["usage_patterns"]):
        missing.append("how-to-use / next steps guidance")

    passed = len(missing) < 2
    issues = [f"Missing editorial blocks: {', '.join(missing)}"] if missing else []
    fixes = [f"Add missing section(s): {', '.join(missing)}."] if missing else []
    return {
        "signal": "editorial_depth",
        "value": 5 - len(missing),
        "passed": passed,
        "issues": issues,
        "fixes": fixes,
    }


def score_eeat(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    issues, fixes = [], []

    has_author = bool(
        soup.select(
            ".author, .article-author, [rel='author'], "
            ".author-bio-card, .article-dateline"
        )
    ) or bool(re.search(r"by\s+[A-Z][a-z]+\s+[A-Z][a-z]+", soup.get_text()))
    if not has_author:
        issues.append("No named author byline detected (YMYL page requires E-E-A-T)")
        fixes.append("Add named author with credentials and bio link.")

    has_date = bool(soup.select(".article-dateline, time, [datetime]")) or bool(
        re.search(
            r"(?:updated|published|last\s+updated)|\d{4}-\d{2}-\d{2}|"
            r"\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}",
            soup.get_text(),
            re.IGNORECASE,
        )
    )
    if not has_date:
        issues.append("No last-updated date found")
        fixes.append("Add a visible 'Last updated: DD Month YYYY' dateline.")

    reg_domains = [
        "sebi.gov.in", "rbi.org.in", "ato.gov.au", "gov.au",
        "moneysmart.gov.au", "irs.gov", "gov.in", "india.gov.in",
    ]
    links = [a.get("href", "") for a in soup.find_all("a", href=True)]
    has_source = any(any(d in href for d in reg_domains) for href in links)
    if not has_source:
        issues.append("No regulatory/government source cited (YMYL requirement)")
        fixes.append(
            "Add at least one citation linking to a relevant regulatory source "
            "(ATO, SEBI, RBI, etc.)."
        )

    passed = len(issues) == 0
    return {
        "signal": "eeat",
        "value": 3 - len(issues),
        "passed": passed,
        "issues": issues,
        "fixes": fixes,
    }


def score_js_dependency(raw_html: str, rendered_html: str, strip_selectors: list) -> dict:
    raw_wc = word_count(extract_main_text(raw_html, strip_selectors))
    rendered_wc = word_count(extract_main_text(rendered_html, strip_selectors))
    ratio = raw_wc / rendered_wc if rendered_wc > 0 else 0
    passed = ratio >= 0.5
    issues, fixes = [], []
    if not passed:
        issues.append(
            f"JS-dependent: raw={raw_wc} words vs rendered={rendered_wc} "
            f"(ratio={ratio:.2f} < 0.50)"
        )
        fixes.append(
            "Ensure main content (text, FAQ, formula) is server-rendered in static HTML, "
            "not JS-injected."
        )
    return {
        "signal": "js_dependency",
        "value": round(ratio, 3),
        "passed": passed,
        "issues": issues,
        "fixes": fixes,
    }


def score_placeholder(text: str, cfg: dict) -> dict:
    wc = word_count(text)
    text_lower = text.lower()
    triggered = [s for s in cfg["placeholder_signals"] if s in text_lower]
    is_placeholder = wc < 100 or bool(triggered)
    issues, fixes = [], []
    if wc < 100:
        issues.append(f"Page has only {wc} words — likely a stub or placeholder")
        fixes.append("Develop full page content or redirect/noindex until complete.")
    if triggered:
        issues.append(f"Placeholder text detected: {triggered}")
        fixes.append("Remove placeholder text and publish complete content.")
    return {
        "signal": "not_placeholder",
        "value": not is_placeholder,
        "passed": not is_placeholder,
        "issues": issues,
        "fixes": fixes,
    }


def score_meta_unique(title: str, description: str, seen_titles: set, seen_descs: set) -> dict:
    issues, fixes = [], []
    if title and title in seen_titles:
        issues.append(f"Duplicate title tag: '{title[:80]}'")
        fixes.append("Write a unique, page-specific title tag.")
    if description and description in seen_descs:
        issues.append(f"Duplicate meta description: '{description[:80]}'")
        fixes.append("Write a unique meta description specific to this page's content.")
    passed = len(issues) == 0
    return {
        "signal": "meta_unique",
        "value": passed,
        "passed": passed,
        "issues": issues,
        "fixes": fixes,
    }


def score_internal_links(html: str, base_url: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    for sel in ["nav", "footer", ".breadcrumb", "[aria-label='breadcrumb']"]:
        for node in soup.select(sel):
            node.decompose()
    parsed_base = urlparse(base_url)
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    links = []
    if main:
        links = [
            a.get("href", "")
            for a in main.find_all("a", href=True)
            if parsed_base.netloc in a.get("href", "")
            or a.get("href", "").startswith("/")
        ]
    count = len(links)
    passed = count >= 3
    issues, fixes = [], []
    if not passed:
        issues.append(f"Only {count} in-content internal link(s) (need >= 3)")
        fixes.append(
            "Add at least 3 contextual internal links to related calculators or blog articles."
        )
    return {
        "signal": "internal_links",
        "value": count,
        "passed": passed,
        "issues": issues,
        "fixes": fixes,
    }


def score_layout_readiness(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    issues, fixes = [], []
    if main is None:
        issues.append("No <main> or <article> element found")
        fixes.append("Wrap page content in a semantic <main> element.")
        return {
            "signal": "layout_readiness",
            "value": False,
            "passed": False,
            "issues": issues,
            "fixes": fixes,
        }
    main_text_snippet = main.get_text(" ", strip=True)[:100]
    html_len = len(html)
    main_pos = html.find(main_text_snippet) if main_text_snippet else 0
    ratio = main_pos / html_len if html_len > 0 else 1
    passed = ratio < 0.75
    if not passed:
        issues.append("Main content appears very late in the HTML (possible below-fold issue)")
        fixes.append(
            "Move primary content higher in the document to ensure it appears above ad placements."
        )
    return {
        "signal": "layout_readiness",
        "value": round(ratio, 3),
        "passed": passed,
        "issues": issues,
        "fixes": fixes,
    }


# ---------------------------------------------------------------------------
# Aggregate score
# ---------------------------------------------------------------------------

def compute_score(signals: list, weights: dict) -> int:
    signal_map = {s["signal"]: s for s in signals}
    total = 0
    for signal_name, weight in weights.items():
        sig = signal_map.get(signal_name)
        if sig and sig["passed"]:
            total += weight
    return total


def score_page(url: str, slug: str, cfg: dict, seen_titles: set, seen_descs: set) -> dict:
    raw_path = ROOT_DIR / "cache" / "raw" / f"{slug}.html"
    rendered_path = ROOT_DIR / "cache" / "rendered" / f"{slug}.html"
    site_path = url_to_site_path(url)

    # Source of truth: _site/ (committed HTML, stable, reflects all applied fixes).
    # Using _site/ for BOTH raw and rendered makes every scoring signal deterministic —
    # scores change only when _site/ changes via a git commit, not when the crawler runs.
    #
    # js_dependency with _site/ as rendered: ratio = raw_wc / _site_wc = 1.0 (always
    # passes). This is correct for a statically-built site — if substantial prose is in
    # _site/, that prose is indexable without JS.
    #
    # Fallback chain: _site/ → cache/raw/ (covers deleted/redirected URLs).
    if site_path.exists():
        raw_html = site_path.read_text(encoding="utf-8", errors="replace")
        rendered_html = raw_html  # same source → deterministic, crawler-independent
    elif raw_path.exists():
        raw_html = raw_path.read_text(encoding="utf-8", errors="replace")
        rendered_html = (
            rendered_path.read_text(encoding="utf-8", errors="replace")
            if rendered_path.exists()
            else raw_html
        )
    else:
        return {
            "url": url, "slug": slug, "error": "no source (not in _site/ or cache/raw/)",
            "score": 0, "status": "ERROR", "signals": [], "issues": [], "fixes": [],
        }
    strip_sels = cfg["strip_selectors"]
    rendered_text = extract_main_text(rendered_html, strip_sels)
    title, desc = extract_meta(rendered_html)

    signals = [
        score_word_count(rendered_text, cfg),
        # info_gain: neutral placeholder until duplicates.py fills it in
        {
            "signal": "info_gain", "value": 0.5, "passed": True,
            "issues": [], "fixes": [], "_placeholder": True,
        },
        score_editorial_depth(rendered_html, cfg),
        score_eeat(rendered_html),
        score_js_dependency(raw_html, rendered_html, strip_sels),
        score_meta_unique(title, desc, seen_titles, seen_descs),
        score_placeholder(rendered_text, cfg),
        score_internal_links(rendered_html, cfg["site"]["base_url"]),
        score_layout_readiness(rendered_html),
    ]

    if title:
        seen_titles.add(title)
    if desc:
        seen_descs.add(desc)

    score = compute_score(signals, cfg["scoring_weights"])

    placeholder_sig = next((s for s in signals if s["signal"] == "not_placeholder"), None)
    is_placeholder = bool(placeholder_sig and not placeholder_sig["passed"])
    is_js_dep = not next((s["passed"] for s in signals if s["signal"] == "js_dependency"), True)

    status = "FAIL" if (score < 70 or is_placeholder) else "PASS"

    all_issues = [i for s in signals for i in s.get("issues", [])]
    all_fixes = [f for s in signals for f in s.get("fixes", [])]

    return {
        "url": url,
        "slug": slug,
        "title": title,
        "score": score,
        "status": status,
        "word_count": next((s["value"] for s in signals if s["signal"] == "word_count"), 0),
        "is_placeholder": is_placeholder,
        "is_js_dependent": is_js_dep,
        "has_author": next((s["passed"] for s in signals if s["signal"] == "eeat"), False),
        "signals": signals,
        "issues": all_issues,
        "fixes": all_fixes,
    }


def run_scorer():
    cfg = load_config()
    with open(URL_MAP_PATH) as f:
        url_map: dict = json.load(f)

    seen_titles: set = set()
    seen_descs: set = set()
    results = []

    for url, slug in tqdm(url_map.items(), desc="Scoring"):
        result = score_page(url, slug, cfg, seen_titles, seen_descs)
        results.append(result)

    SCORES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SCORES_PATH, "w") as f:
        json.dump(results, f, indent=2)

    passed = sum(1 for r in results if r.get("status") == "PASS")
    print(f"Scoring complete: {passed}/{len(results)} PASS  →  {SCORES_PATH}")
    return results


if __name__ == "__main__":
    run_scorer()
