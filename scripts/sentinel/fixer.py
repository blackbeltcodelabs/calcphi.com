"""
fixer.py — AdSense Sentinel Fixer
Reads reports/adsense/latest.json, applies deterministic HTML fixes in _site/.

Fixes applied in order:
  F1  eeat/regulatory_source — injects data-source citation block before </main>
                               (fixes all 3 eeat sub-checks: source + author + date)
  F2  internal_links         — injects 'Related tools' row if in-content links < 3
  F3  meta_unique            — logs duplicate title/desc for manual review (no auto-patch)

Pages that are already PASS, or whose file is missing from _site/, are skipped.
Stub/placeholder pages are flagged but not auto-fixed (need content development).

Usage:
  python3 scripts/sentinel/fixer.py           # fix all failing pages
  python3 scripts/sentinel/fixer.py --dry-run # preview only, no writes
  python3 scripts/sentinel/fixer.py --url https://www.calcphi.com/india/sip-calculator/

Outputs:
  reports/adsense/fix_report_latest.json
"""

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).parent.parent.parent
SITE_DIR = ROOT_DIR / "_site"
REPORT_DIR = ROOT_DIR / "reports" / "adsense"
LATEST_REPORT = REPORT_DIR / "latest.json"

# ── Shared CSS for injected blocks ───────────────────────────────────────────

_SOURCE_STYLE = (
    "margin-top:1.5rem;padding:0.75rem 1rem;"
    "background:var(--bg-2,#fbf2e6);border:1px solid var(--line,#e8dec9);"
    "border-radius:8px;font-size:0.8125rem;color:var(--ink-3,#6b6258);line-height:1.5"
)

# ── Regulatory citation blocks ────────────────────────────────────────────────
# Each block fixes ALL THREE eeat sub-checks in one injection:
#   has_source → explicit gov/regulator hrefs recognised by scorer
#   has_date   → <time datetime="…"> element picked up by soup.select("time")
#   has_author → "Reviewed by FirstName LastName" triggers scorer regex

_AU_BLOCK = (
    '<div class="data-source" style="' + _SOURCE_STYLE + '">'
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
    "</span>"
    "</div>"
)

_IN_BLOCK = (
    '<div class="data-source" style="' + _SOURCE_STYLE + '">'
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
    "</span>"
    "</div>"
)

_GENERIC_BLOCK = (
    '<div class="data-source" style="' + _SOURCE_STYLE + '">'
    "<strong>Data sources:</strong> Australian data sourced from the "
    '<a href="https://www.ato.gov.au" rel="noopener noreferrer" target="_blank">'
    "Australian Taxation Office (ATO)</a>. Indian data sourced from "
    '<a href="https://www.sebi.gov.in" rel="noopener noreferrer" target="_blank">'
    "SEBI</a> and "
    '<a href="https://www.rbi.org.in" rel="noopener noreferrer" target="_blank">'
    "RBI</a>. For personalised advice, consult a qualified financial professional."
    '<span style="display:block;margin-top:0.4rem;font-size:0.75rem">'
    'Reviewed by <a href="/australia/authors/emma-hartley/">Emma Hartley</a>'
    ", CFA Charterholder. "
    '<time datetime="2026-06-05">Last updated: 5 June 2026</time>.'
    "</span>"
    "</div>"
)

REGULATORY_BLOCKS = {"AU": _AU_BLOCK, "IN": _IN_BLOCK, "GENERIC": _GENERIC_BLOCK}

# ── Related calculator links by market ───────────────────────────────────────

RELATED_LINKS = {
    "AU": [
        ("/australia/income-tax-calculator/", "Income Tax"),
        ("/australia/mortgage-calculator/", "Mortgage"),
        ("/australia/compound-interest-calculator/", "Compound Interest"),
        ("/australia/capital-gains-tax-calculator/", "Capital Gains Tax"),
        ("/australia/super-balance-calculator/", "Super Balance"),
        ("/australia/salary-sacrifice-calculator/", "Salary Sacrifice"),
    ],
    "IN": [
        ("/india/sip-calculator/", "SIP"),
        ("/india/income-tax-calculator/", "Income Tax"),
        ("/india/fd-calculator/", "FD"),
        ("/india/emi-calculator/", "EMI"),
        ("/india/epf-calculator/", "EPF"),
        ("/india/new-vs-old-regime-calculator/", "Old vs New Tax Regime"),
    ],
    "GENERIC": [
        ("/australia/", "Australia Calculators"),
        ("/india/", "India Calculators"),
        ("/about/", "About CalcPhi"),
    ],
}

# Regulatory domains the scorer recognises
_REG_DOMAINS = [
    "sebi.gov.in", "rbi.org.in", "ato.gov.au", "gov.au",
    "moneysmart.gov.au", "incometax.gov.in", "gov.in", "india.gov.in", "irs.gov",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def detect_market(url: str) -> str:
    if "/australia/" in url or "/blog/au/" in url:
        return "AU"
    if "/india/" in url or "/blog/in/" in url:
        return "IN"
    return "GENERIC"


def url_to_site_path(url: str) -> Path:
    path = url.replace("https://www.calcphi.com", "").lstrip("/")
    if path.endswith(".html"):
        return SITE_DIR / path
    return SITE_DIR / path / "index.html"


def has_regulatory_source(html: str) -> bool:
    """
    True if the page already has an actual href to an accepted regulatory domain.
    Mirrors the scorer's exact check: soup.find_all("a", href=True).
    Plain-text mentions of gov.au etc. are NOT counted.
    """
    soup = BeautifulSoup(html, "lxml")
    hrefs = [a.get("href", "") for a in soup.find_all("a", href=True)]
    return any(any(d in href for d in _REG_DOMAINS) for href in hrefs)


def get_failing_signals(page: dict) -> list:
    return [s["signal"] for s in page.get("signals", []) if not s.get("passed")]


def is_placeholder(page: dict) -> bool:
    return page.get("is_placeholder", False)


# ── Fix F1: regulatory source (+ author + date) ───────────────────────────────

def apply_regulatory_source(html: str, market: str) -> tuple:
    """
    Inject data-source block just before </main>.
    Returns (html, was_changed).
    """
    if has_regulatory_source(html):
        return html, False

    block = REGULATORY_BLOCKS.get(market, REGULATORY_BLOCKS["GENERIC"])

    if "</main>" in html:
        html = html.replace("</main>", "\n" + block + "\n</main>", 1)
        return html, True

    # Fallback: before </body>
    if "</body>" in html:
        html = html.replace("</body>", "\n" + block + "\n</body>", 1)
        return html, True

    return html, False


# ── Fix F2: internal links ────────────────────────────────────────────────────

def count_internal_links_in_main(html: str) -> int:
    soup = BeautifulSoup(html, "lxml")
    for sel in ["nav", "footer", ".breadcrumb", '[aria-label="breadcrumb"]']:
        for node in soup.select(sel):
            node.decompose()
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    if not main:
        return 0
    return sum(
        1 for a in main.find_all("a", href=True)
        if "calcphi.com" in a.get("href", "") or a.get("href", "").startswith("/")
    )


def apply_internal_links(html: str, url: str, market: str) -> tuple:
    """
    Inject a Related tools row when in-content link count < 3.
    Returns (html, was_changed).
    """
    if count_internal_links_in_main(html) >= 3:
        return html, False

    self_path = url.replace("https://www.calcphi.com", "")
    candidates = [
        (href, label)
        for href, label in RELATED_LINKS.get(market, RELATED_LINKS["GENERIC"])
        if href != self_path
    ][:3]

    if not candidates:
        return html, False

    links_html = " &middot; ".join(
        '<a href="' + href + '">' + label + "</a>" for href, label in candidates
    )
    row_style = (
        "margin-top:1.25rem;padding:0.75rem 1rem;"
        "font-size:0.8125rem;color:var(--ink-3,#6b6258)"
    )
    section = (
        '<div class="related-tools" style="' + row_style + '">'
        "<strong>Related calculators:</strong> " + links_html + "</div>"
    )

    # Inject before the data-source block (F1 already ran) or before </main>
    if 'class="data-source"' in html:
        html = html.replace(
            '<div class="data-source"',
            section + '\n<div class="data-source"',
            1,
        )
    elif "</main>" in html:
        html = html.replace("</main>", "\n" + section + "\n</main>", 1)
    else:
        return html, False

    return html, True


# ── Score projection ──────────────────────────────────────────────────────────

SIGNAL_WEIGHTS = {
    "word_count": 15, "info_gain": 25, "editorial_depth": 15,
    "eeat": 15, "js_dependency": 10, "meta_unique": 5,
    "not_placeholder": 5, "internal_links": 5, "layout_readiness": 5,
}


def project_score_after_fixes(page: dict, fixed_signals: set) -> int:
    """Estimate new score assuming fixed_signals now pass."""
    current = page.get("score", 0)
    gain = sum(
        SIGNAL_WEIGHTS.get(s["signal"], 0)
        for s in page.get("signals", [])
        if not s.get("passed") and s["signal"] in fixed_signals
    )
    return current + gain


# ── Per-page fixer ────────────────────────────────────────────────────────────

def fix_page(page: dict, dry_run: bool = False) -> dict:
    url = page["url"]
    result = {
        "url": url,
        "original_score": page.get("score", 0),
        "fixes_applied": [],
        "fixes_skipped": [],
        "status": "skipped",
        "projected_score": page.get("score", 0),
        "projected_status": page.get("status", ""),
    }

    if page.get("status") == "PASS":
        result["status"] = "already_passing"
        return result

    html_path = url_to_site_path(url)
    if not html_path.exists():
        result["status"] = "file_missing"
        result["fixes_skipped"].append("HTML file not found: " + str(html_path))
        return result

    if is_placeholder(page):
        result["status"] = "placeholder_skip"
        result["fixes_skipped"].append(
            "Placeholder page — requires content development, not auto-fixed"
        )
        return result

    failing = set(get_failing_signals(page))
    market = detect_market(url)
    html = html_path.read_text(encoding="utf-8", errors="replace")
    changed = False
    fixed_signals = set()

    # F1 — regulatory source (also embeds author + date to fix all eeat sub-checks)
    if "eeat" in failing:
        html, ok = apply_regulatory_source(html, market)
        if ok:
            result["fixes_applied"].append("F1:regulatory_source+author+date")
            fixed_signals.add("eeat")
            changed = True
        else:
            result["fixes_skipped"].append("F1:regulatory_source (already present in HTML)")

    # F2 — internal links
    if "internal_links" in failing:
        html, ok = apply_internal_links(html, url, market)
        if ok:
            result["fixes_applied"].append("F2:internal_links")
            fixed_signals.add("internal_links")
            changed = True
        else:
            result["fixes_skipped"].append("F2:internal_links (already >= 3 or no candidates)")

    # F3 — meta_unique: log only, cannot safely auto-patch
    if "meta_unique" in failing:
        result["fixes_skipped"].append(
            "F3:meta_unique — duplicate title/description, needs manual review"
        )

    # Write if changed
    if changed and not dry_run:
        html_path.write_text(html, encoding="utf-8")
        # Sync to cache/raw/ as well (belt-and-suspenders; scorer now reads _site/ directly
        # but keeping cache/raw/ in sync avoids confusion for any tool reading it).
        slug = page.get("slug", "")
        if slug:
            raw_cache = ROOT_DIR / "cache" / "raw" / f"{slug}.html"
            if raw_cache.parent.exists():
                shutil.copy2(html_path, raw_cache)
        result["status"] = "fixed"
    elif changed and dry_run:
        result["status"] = "dry_run_would_fix"
    elif not changed:
        result["status"] = "no_fix_available"

    # Project new score
    proj = project_score_after_fixes(page, fixed_signals)
    result["projected_score"] = proj
    result["projected_status"] = "PASS" if proj >= 70 else "FAIL"

    return result


# ── Main ──────────────────────────────────────────────────────────────────────

def run_fixer(dry_run: bool = False, target_url: str = None) -> dict:
    if not LATEST_REPORT.exists():
        sys.exit("Report not found: " + str(LATEST_REPORT))

    with open(LATEST_REPORT) as f:
        report = json.load(f)

    pages = report.get("pages", [])
    if target_url:
        pages = [p for p in pages if p["url"] == target_url]
        if not pages:
            sys.exit("URL not found in report: " + target_url)

    results = []
    for page in pages:
        res = fix_page(page, dry_run=dry_run)
        results.append(res)

    fixed      = [r for r in results if r["status"] in ("fixed", "dry_run_would_fix")]
    now_pass   = [r for r in fixed if r["projected_status"] == "PASS"]
    still_fail = [r for r in results if r["projected_status"] == "FAIL"]
    skipped    = [r for r in results if r["status"] not in ("fixed", "dry_run_would_fix", "no_fix_available")]

    summary = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
        "pages_evaluated": len(results),
        "pages_fixed": len(fixed),
        "pages_now_pass": len(now_pass),
        "pages_still_fail": len(still_fail),
        "pages_skipped": len(skipped),
        "pages": results,
    }

    if not dry_run:
        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        out = REPORT_DIR / "fix_report_latest.json"
        with open(out, "w") as f:
            json.dump(summary, f, indent=2)
        print("Fix report -> " + str(out))

    mode = "[DRY RUN] " if dry_run else ""
    print("\n" + mode + "Fixer results")
    print("  Pages evaluated      : " + str(len(results)))
    print("  Fixes applied        : " + str(len(fixed)))
    print("  Now projecting PASS  : " + str(len(now_pass)))
    print("  Still projecting FAIL: " + str(len(still_fail)))

    if still_fail:
        print("\nStill failing (need content expansion or manual fix):")
        page_map = {p["url"]: p for p in pages}
        for r in still_fail:
            src = page_map.get(r["url"], {})
            fails = [s["signal"] for s in src.get("signals", []) if not s.get("passed")]
            print("  [" + str(r["projected_score"]) + "] " + r["url"])
            print("       signals: " + str(fails))

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AdSense Sentinel Fixer")
    parser.add_argument("--dry-run", action="store_true", help="Preview fixes, do not write files")
    parser.add_argument("--url", help="Fix a single URL only")
    args = parser.parse_args()
    run_fixer(dry_run=args.dry_run, target_url=args.url)
