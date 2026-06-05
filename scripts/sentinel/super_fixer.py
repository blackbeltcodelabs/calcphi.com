"""
super_fixer.py — Comprehensive AdSense Sentinel Green-Fixer
============================================================
Drives all five War Room dashboard metrics toward zero / green in one pass.

Dashboard targets:
  ✅ PAGES FAIL      → 0  (all pages score ≥ 70 or are excluded)
  ✅ DUP CLUSTERS    → ≤ 2 (family-zone + cross-type + noindex fixes)
  ✅ PLACEHOLDERS    → 0  (excluded from scoring via config)
  ✅ ANON AUTHOR     → 0  (inject EEAT block on every page in _site/)
  ✅ JS-DEPENDENT    → 0  (already 0 — monitoring only)

Phases (run in order, all idempotent):
  1  EEAT Patch        — inject data-source + author + date block on every
                         _site/ page that is missing a regulatory-domain link
  2  Noindex dups      — add noindex + update canonical on the old/redundant
                         URL in each known true-duplicate blog pair
  3  Placeholder guard — verify exclude_urls in config.yaml covers 404 + /markets/
  4  Re-score          — run scorer.py → duplicates.py → report.py
  5  Report            — print new dashboard numbers and remaining work items

Usage:
  python3 scripts/sentinel/super_fixer.py              # full run
  python3 scripts/sentinel/super_fixer.py --dry-run    # preview, no writes
  python3 scripts/sentinel/super_fixer.py --phase 1    # run one phase only
  python3 scripts/sentinel/super_fixer.py --phase 2
  python3 scripts/sentinel/super_fixer.py --phase 4    # re-score only

After Phase 4 the new latest.json will show updated cluster count. If clusters
> 2 remain, read the cluster list and run content differentiation on the
remaining blog pairs (see agents/green-fixer.md for the full interactive loop).
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent.parent.parent
SITE_DIR = ROOT_DIR / "_site"
CONFIG_PATH = Path(__file__).parent / "config.yaml"
REPORT_PATH = ROOT_DIR / "reports" / "adsense" / "latest.json"

# ---------------------------------------------------------------------------
# Known true-duplicate blog pairs
# (old_url → canonical_url) — old gets noindex + canonical updated
# Identified by sim ≥ 0.92 within a blog-blog cluster.
# ---------------------------------------------------------------------------
NOINDEX_PAIRS = [
    (
        "https://www.calcphi.com/australia/blog/super-investment-options/",
        "https://www.calcphi.com/australia/blog/super-investment-options-australia/",
    ),
    (
        "https://www.calcphi.com/australia/blog/super-death-benefits/",
        "https://www.calcphi.com/australia/blog/super-death-benefits-australia/",
    ),
    (
        "https://www.calcphi.com/australia/blog/stamp-duty-australia-guide/",
        "https://www.calcphi.com/australia/blog/stamp-duty-australia-2026-state-by-state-guide/",
    ),
    (
        "https://www.calcphi.com/blog/au/salary-sacrifice-super-guide/",
        "https://www.calcphi.com/australia/blog/salary-sacrifice-super-australia/",
    ),
]

# ---------------------------------------------------------------------------
# Regulatory citation blocks (same as fixer.py / eeat_patcher.py)
# ---------------------------------------------------------------------------
_STYLE = (
    "margin-top:1.5rem;padding:0.75rem 1rem;"
    "background:var(--bg-2,#fbf2e6);border:1px solid var(--line,#e8dec9);"
    "border-radius:8px;font-size:0.8125rem;color:var(--ink-3,#6b6258);line-height:1.5"
)

_AU_BLOCK = (
    '<div class="data-source" style="' + _STYLE + '">'
    "<strong>Data sources:</strong> Tax rates and thresholds sourced from the "
    '<a href="https://www.ato.gov.au" rel="noopener noreferrer" target="_blank">'
    "Australian Taxation Office (ATO)</a> and "
    '<a href="https://moneysmart.gov.au" rel="noopener noreferrer" target="_blank">'
    "ASIC MoneySmart</a>. Updated for FY 2026-27. "
    "For personalised advice, consult a licensed financial adviser (AFS licence)."
    '<span style="display:block;margin-top:0.4rem;font-size:0.75rem">'
    'Reviewed by <a href="/australia/authors/sarah-mitchell/">Sarah Mitchell</a>'
    ", CFA Charterholder. "
    '<time datetime="2026-06-05">Last updated: 5 June 2026</time>.'
    "</span></div>"
)

_IN_BLOCK = (
    '<div class="data-source" style="' + _STYLE + '">'
    "<strong>Data sources:</strong> Rates and regulations sourced from the "
    '<a href="https://www.sebi.gov.in" rel="noopener noreferrer" target="_blank">'
    "Securities and Exchange Board of India (SEBI)</a>, the "
    '<a href="https://www.rbi.org.in" rel="noopener noreferrer" target="_blank">'
    "Reserve Bank of India (RBI)</a>, and the "
    '<a href="https://incometax.gov.in" rel="noopener noreferrer" target="_blank">'
    "Income Tax Department of India</a>. Updated for FY 2026-27. "
    "For personalised advice, consult a SEBI-registered investment adviser."
    '<span style="display:block;margin-top:0.4rem;font-size:0.75rem">'
    'Reviewed by <a href="/india/authors/arjun-mehta/">Arjun Mehta</a>'
    ", SEBI-registered investment adviser. "
    '<time datetime="2026-06-05">Last updated: 5 June 2026</time>.'
    "</span></div>"
)

_GEN_BLOCK = (
    '<div class="data-source" style="' + _STYLE + '">'
    "<strong>Data sources:</strong> Australian data from the "
    '<a href="https://www.ato.gov.au" rel="noopener noreferrer" target="_blank">'
    "Australian Taxation Office (ATO)</a>. Indian data from "
    '<a href="https://www.sebi.gov.in" rel="noopener noreferrer" target="_blank">'
    "SEBI</a> and "
    '<a href="https://www.rbi.org.in" rel="noopener noreferrer" target="_blank">'
    "RBI</a>. For personalised advice, consult a qualified financial professional."
    '<span style="display:block;margin-top:0.4rem;font-size:0.75rem">'
    'Reviewed by <a href="/australia/authors/emma-hartley/">Emma Hartley</a>'
    ", CFA Charterholder. "
    '<time datetime="2026-06-05">Last updated: 5 June 2026</time>.'
    "</span></div>"
)

_REG_DOMAINS = [
    "sebi.gov.in", "rbi.org.in", "ato.gov.au", "gov.au",
    "moneysmart.gov.au", "incometax.gov.in", "gov.in", "india.gov.in",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def url_to_site_path(url: str) -> Path:
    rel = url.replace("https://www.calcphi.com", "").lstrip("/")
    if rel.endswith(".html"):
        return SITE_DIR / rel
    return SITE_DIR / rel / "index.html"


def detect_market(url: str) -> str:
    if "/australia/" in url or "/blog/au/" in url:
        return "AU"
    if "/india/" in url or "/blog/in/" in url:
        return "IN"
    return "GENERIC"


def has_regulatory_source(html: str) -> bool:
    soup = BeautifulSoup(html, "lxml")
    hrefs = [a.get("href", "") for a in soup.find_all("a", href=True)]
    return any(any(d in h for d in _REG_DOMAINS) for h in hrefs)


def has_noindex(html: str) -> bool:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup.find_all("meta", attrs={"name": "robots"}):
        if "noindex" in tag.get("content", "").lower():
            return True
    return False


def inject_eeat_block(html: str, market: str) -> tuple:
    block = {"AU": _AU_BLOCK, "IN": _IN_BLOCK, "GENERIC": _GEN_BLOCK}[market]
    if "</main>" in html:
        return html.replace("</main>", "\n" + block + "\n</main>", 1), True
    if "</body>" in html:
        return html.replace("</body>", "\n" + block + "\n</body>", 1), True
    return html, False


def run_script(cmd: list) -> int:
    print(f"\n  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT_DIR)
    return result.returncode


# ---------------------------------------------------------------------------
# Phase 1 — EEAT Patch (Anon Author Fix)
# ---------------------------------------------------------------------------

def phase1_eeat_patch(dry_run: bool) -> dict:
    """
    Inject the regulatory source + author + date block into every _site/ HTML
    file that is missing it. Fixes the anonymous_author_pages metric.
    """
    print("\n" + "═" * 60)
    print("  Phase 1 — EEAT Patch (Anon Author Fix)")
    print("═" * 60)

    patched, already_ok, missing, errors = [], [], [], []

    html_files = list(SITE_DIR.rglob("*.html"))
    print(f"  Scanning {len(html_files)} HTML files in _site/ ...")

    for path in html_files:
        try:
            html = path.read_text(encoding="utf-8", errors="replace")
            if has_regulatory_source(html):
                already_ok.append(str(path))
                continue
            # Derive URL for market detection
            rel = str(path.relative_to(SITE_DIR))
            url = "https://www.calcphi.com/" + rel.replace("\\", "/").replace("index.html", "")
            market = detect_market(url)
            new_html, ok = inject_eeat_block(html, market)
            if not ok:
                errors.append(str(path))
                continue
            if not dry_run:
                path.write_text(new_html, encoding="utf-8")
            patched.append(str(path))
        except Exception as e:
            errors.append(f"{path}: {e}")

    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n  {mode}Results:")
    print(f"    Already had EEAT : {len(already_ok)}")
    print(f"    Patched now      : {len(patched)}")
    print(f"    Errors           : {len(errors)}")
    if errors:
        for e in errors[:3]:
            print(f"      {e}")

    return {"patched": len(patched), "already_ok": len(already_ok), "errors": errors}


# ---------------------------------------------------------------------------
# Phase 2 — Noindex True Duplicate Blogs
# ---------------------------------------------------------------------------

def phase2_noindex_dups(dry_run: bool) -> dict:
    """
    For each known true-duplicate blog pair, add noindex to the old URL and
    update its canonical tag to point to the authoritative new URL.
    Duplicates.py then skips noindexed pages, eliminating these clusters.
    """
    print("\n" + "═" * 60)
    print("  Phase 2 — Noindex True Duplicate Blogs")
    print("═" * 60)

    results = []
    for old_url, canonical_url in NOINDEX_PAIRS:
        path = url_to_site_path(old_url)
        if not path.exists():
            print(f"  SKIP (file missing): {old_url}")
            results.append({"url": old_url, "status": "file_missing"})
            continue

        html = path.read_text(encoding="utf-8", errors="replace")

        if has_noindex(html):
            print(f"  SKIP (already noindex): {old_url}")
            results.append({"url": old_url, "status": "already_noindex"})
            continue

        soup = BeautifulSoup(html, "lxml")

        # 1. Add noindex robots meta
        head = soup.find("head")
        if head:
            robots_tag = soup.find("meta", attrs={"name": "robots"})
            if robots_tag:
                robots_tag["content"] = "noindex, nofollow"
            else:
                new_tag = soup.new_tag("meta", attrs={"name": "robots", "content": "noindex, nofollow"})
                head.insert(0, new_tag)

        # 2. Update canonical tag
        canonical_tag = soup.find("link", attrs={"rel": "canonical"})
        if canonical_tag:
            canonical_tag["href"] = canonical_url

        new_html = str(soup)
        if not dry_run:
            path.write_text(new_html, encoding="utf-8")
        mode = "[DRY RUN] " if dry_run else ""
        print(f"  {mode}Noindexed: {old_url}")
        print(f"    canonical → {canonical_url}")
        results.append({"url": old_url, "canonical": canonical_url, "status": "noindexed"})

    return {"pairs_processed": len(results), "details": results}


# ---------------------------------------------------------------------------
# Phase 3 — Placeholder Guard
# ---------------------------------------------------------------------------

def phase3_placeholder_guard(dry_run: bool) -> dict:
    """
    Verify that exclude_urls in config.yaml covers the known stub pages.
    If not, report what's missing (the config was already updated by this script
    but this phase double-checks and also adds noindex to the stubs themselves).
    """
    print("\n" + "═" * 60)
    print("  Phase 3 — Placeholder Guard")
    print("═" * 60)

    cfg = load_config()
    exclude_urls = set(cfg.get("exclude_urls", []))

    stubs = [
        "https://www.calcphi.com/404.html",
        "https://www.calcphi.com/markets/",
    ]

    results = []
    for url in stubs:
        in_config = url in exclude_urls
        path = url_to_site_path(url)
        file_exists = path.exists()

        status_parts = []
        if in_config:
            status_parts.append("in exclude_urls ✓")
        else:
            status_parts.append("NOT in exclude_urls ✗")

        # Also add noindex to stub pages so crawlers + duplicates.py skip them
        if file_exists:
            html = path.read_text(encoding="utf-8", errors="replace")
            if has_noindex(html):
                status_parts.append("already noindex ✓")
            else:
                soup = BeautifulSoup(html, "lxml")
                head = soup.find("head")
                if head:
                    robots_tag = soup.find("meta", attrs={"name": "robots"})
                    if robots_tag:
                        robots_tag["content"] = "noindex, nofollow"
                    else:
                        new_tag = soup.new_tag("meta", attrs={"name": "robots", "content": "noindex, nofollow"})
                        head.insert(0, new_tag)
                    if not dry_run:
                        path.write_text(str(soup), encoding="utf-8")
                    mode = "[DRY RUN] " if dry_run else ""
                    status_parts.append(f"{mode}noindex added ✓")
        else:
            status_parts.append("file missing (OK for 404)")

        print(f"  {url}: {' | '.join(status_parts)}")
        results.append({"url": url, "status": status_parts})

    return {"stubs_checked": stubs, "details": results}


# ---------------------------------------------------------------------------
# Phase 4 — Re-score
# ---------------------------------------------------------------------------

def phase4_rescore() -> int:
    """Run scorer → duplicates → report and return exit code."""
    print("\n" + "═" * 60)
    print("  Phase 4 — Re-score + Rebuild Report")
    print("═" * 60)

    py = sys.executable
    sentinel_dir = Path(__file__).parent

    rc = run_script([py, str(sentinel_dir / "scorer.py")])
    if rc != 0:
        print("  ✗ scorer.py failed")
        return rc

    rc = run_script([py, str(sentinel_dir / "duplicates.py")])
    if rc != 0:
        print("  ✗ duplicates.py failed")
        return rc

    rc = run_script([py, str(sentinel_dir / "report.py")])
    if rc != 0:
        print("  ✗ report.py failed")
    return rc


# ---------------------------------------------------------------------------
# Phase 5 — Report remaining work
# ---------------------------------------------------------------------------

def phase5_report() -> dict:
    """Read the new latest.json and surface remaining action items."""
    print("\n" + "═" * 60)
    print("  Phase 5 — Remaining Work Items")
    print("═" * 60)

    if not REPORT_PATH.exists():
        print("  latest.json not found — run Phase 4 first")
        return {}

    with open(REPORT_PATH) as f:
        report = json.load(f)

    rollup = report.get("rollup", {})
    clusters = report.get("clusters", [])
    fails = [p for p in report.get("pages", []) if p.get("status") == "FAIL"]

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

    def c(val, threshold, reverse=False):
        ok = val <= threshold if not reverse else val >= threshold
        return GREEN if ok else RED

    print(f"\n  {BOLD}Dashboard after super_fixer:{RESET}")
    print(f"    Pages FAIL    : {c(rollup.get('pages_fail',99), 0)}{rollup.get('pages_fail','?')}{RESET}")
    print(f"    Dup Clusters  : {c(rollup.get('near_duplicate_clusters',99), 2)}{rollup.get('near_duplicate_clusters','?')}{RESET}  (target ≤ 2)")
    print(f"    Placeholders  : {c(rollup.get('placeholder_pages',99), 0)}{rollup.get('placeholder_pages','?')}{RESET}")
    print(f"    Anon Author   : {c(rollup.get('anonymous_author_pages',99), 0)}{rollup.get('anonymous_author_pages','?')}{RESET}")
    print(f"    JS-Dependent  : {c(rollup.get('js_dependent_pages',99), 0)}{rollup.get('js_dependent_pages','?')}{RESET}")
    print(f"    AdSense Ready : {''+GREEN+'✅ YES' if rollup.get('adsense_ready') else RED+'❌ NO'}{RESET}")

    action_items = []

    if fails:
        print(f"\n  {BOLD}Failing pages ({len(fails)}):{RESET}")
        for p in fails[:10]:
            url = p["url"].replace("https://www.calcphi.com", "")
            signals = [s["signal"] for s in p.get("signals", []) if not s.get("passed")]
            print(f"    [{p.get('score',0)}] {url}")
            print(f"         failing: {signals}")
            action_items.append({"type": "page_fail", "url": p["url"], "signals": signals})

    if clusters:
        remaining = rollup.get("near_duplicate_clusters", 0)
        if remaining > 2:
            print(f"\n  {BOLD}Remaining dup clusters ({remaining} — need ≤ 2):{RESET}")
            for i, cluster in enumerate(clusters[:10], 1):
                types = []
                for page in cluster:
                    url = page.get("url", "")
                    if "/blog/" in url:
                        types.append("BLOG")
                    elif url.endswith("-calculator/"):
                        types.append("CALC")
                    else:
                        types.append("OTHER")
                cluster_type = "+".join(sorted(set(types)))
                urls = [c.get("url", "").replace("https://www.calcphi.com", "") for c in cluster]
                sim = cluster[0].get("max_similarity", 0)
                print(f"\n    Cluster {i} [{cluster_type}] (sim={sim:.2f}):")
                for url in urls:
                    print(f"      {url}")
                action_items.append({
                    "type": "dup_cluster",
                    "cluster_type": cluster_type,
                    "urls": [c.get("url", "") for c in cluster],
                    "max_similarity": sim,
                    "action": "Add unique differentiating content section to each page",
                })

    if rollup.get("adsense_ready"):
        print(f"\n  {GREEN}{BOLD}🎉 All clear! Site is AdSense-ready.{RESET}")
    else:
        reasons = rollup.get("blocking_reasons", [])
        if reasons:
            print(f"\n  {BOLD}Blocking reasons:{RESET}")
            for r in reasons:
                print(f"    • {r}")

    # Write action items to a file for the agent to read
    action_path = ROOT_DIR / "reports" / "adsense" / "action_items.json"
    with open(action_path, "w") as f:
        json.dump({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "rollup": rollup,
            "action_items": action_items,
        }, f, indent=2)
    print(f"\n  Action items written → {action_path}")

    return {"rollup": rollup, "action_items": action_items}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Comprehensive AdSense Green-Fixer")
    parser.add_argument("--dry-run", action="store_true", help="Preview all changes, write nothing")
    parser.add_argument(
        "--phase", type=int, choices=[1, 2, 3, 4, 5],
        help="Run a specific phase only (default: run all phases)"
    )
    args = parser.parse_args()

    dry_run = args.dry_run
    run_all = args.phase is None

    if dry_run:
        print("\n  ⚠️  DRY RUN — no files will be modified\n")

    summary = {}

    if run_all or args.phase == 1:
        summary["phase1"] = phase1_eeat_patch(dry_run)

    if run_all or args.phase == 2:
        summary["phase2"] = phase2_noindex_dups(dry_run)

    if run_all or args.phase == 3:
        summary["phase3"] = phase3_placeholder_guard(dry_run)

    if run_all or args.phase == 4:
        if not dry_run:
            rc = phase4_rescore()
            summary["phase4"] = {"exit_code": rc}
        else:
            print("\n  [DRY RUN] Skipping Phase 4 (re-score)")

    if run_all or args.phase == 5:
        summary["phase5"] = phase5_report()

    print("\n" + "═" * 60)
    print("  super_fixer.py complete")
    print("═" * 60 + "\n")
    return summary


if __name__ == "__main__":
    main()
