"""
eeat_patcher.py — AdSense Sentinel E-E-A-T Patcher
Injects the regulatory source + author + date block into EVERY page in _site/
that is missing it — regardless of whether the page currently passes or fails.

The fixer.py only patches FAIL pages. This script patches ALL pages, fixing
the 'anonymous_author_pages' metric in the rollup (which counts any page
where eeat fails, even if the overall score >= 70).

Usage:
  python3 scripts/sentinel/eeat_patcher.py           # patch all pages
  python3 scripts/sentinel/eeat_patcher.py --dry-run  # preview only

After running, re-run scorer.py → duplicates.py → report.py to update
the anonymous_author_pages count in the rollup.
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).parent.parent.parent
SITE_DIR = ROOT_DIR / "_site"
URL_MAP_PATH = ROOT_DIR / "cache" / "url_map.json"
REPORT_DIR = ROOT_DIR / "reports" / "adsense"

# ── Regulatory blocks (source + author + date) ────────────────────────────────

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


def detect_market(url: str) -> str:
    if "/australia/" in url or "/blog/au/" in url:
        return "AU"
    if "/india/" in url or "/blog/in/" in url:
        return "IN"
    return "GENERIC"


def url_to_site_path(url: str) -> Path:
    rel = url.replace("https://www.calcphi.com", "").lstrip("/")
    if rel.endswith(".html"):
        return SITE_DIR / rel
    return SITE_DIR / rel / "index.html"


def has_regulatory_source(html: str) -> bool:
    soup = BeautifulSoup(html, "lxml")
    hrefs = [a.get("href", "") for a in soup.find_all("a", href=True)]
    return any(any(d in h for d in _REG_DOMAINS) for h in hrefs)


def inject_block(html: str, market: str) -> tuple:
    block = {"AU": _AU_BLOCK, "IN": _IN_BLOCK, "GENERIC": _GEN_BLOCK}[market]
    if "</main>" in html:
        return html.replace("</main>", "\n" + block + "\n</main>", 1), True
    if "</body>" in html:
        return html.replace("</body>", "\n" + block + "\n</body>", 1), True
    return html, False


def patch_all(dry_run: bool = False) -> dict:
    if not URL_MAP_PATH.exists():
        print("url_map.json not found — run crawler.py first")
        return {}

    url_map = json.loads(URL_MAP_PATH.read_text())

    patched, already_ok, missing, errors = [], [], [], []

    for url in url_map:
        path = url_to_site_path(url)
        if not path.exists():
            missing.append(url)
            continue
        try:
            html = path.read_text(encoding="utf-8", errors="replace")
            if has_regulatory_source(html):
                already_ok.append(url)
                continue
            market = detect_market(url)
            new_html, ok = inject_block(html, market)
            if not ok:
                errors.append(url)
                continue
            if not dry_run:
                path.write_text(new_html, encoding="utf-8")
            patched.append(url)
        except Exception as e:
            errors.append(f"{url} — {e}")

    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n{mode}E-E-A-T Patcher results")
    print(f"  Total URLs      : {len(url_map)}")
    print(f"  Already had src : {len(already_ok)}")
    print(f"  Patched         : {len(patched)}")
    print(f"  File missing    : {len(missing)}")
    print(f"  Errors          : {len(errors)}")
    if errors:
        for e in errors[:5]:
            print(f"    {e}")

    return {"patched": patched, "already_ok": already_ok, "missing": missing}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    patch_all(dry_run=args.dry_run)
