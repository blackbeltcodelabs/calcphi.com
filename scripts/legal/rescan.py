"""
rescan.py — Legal Room Page Rescanner
======================================
Re-audits a single page from _site/ against its known issue and updates the
verdict in war-room/data/legal/issues.json + summary.json.

Uses rule-based checks (pattern matching) for speed — not a full LLM audit.
Checks are specific to the issue type already recorded for each URL.

Usage:
  python3 scripts/legal/rescan.py /australia/blog/australia-income-tax-brackets-2026/
  python3 scripts/legal/rescan.py /australia/income-tax-calculator/
  python3 scripts/legal/rescan.py --all          # rescan every page in issues.json
  python3 scripts/legal/rescan.py --show         # print current verdicts, no changes

After running, copy updated data to the war room:
  cp /Users/rahulbhattacharya/calcphi.com-1/reports/legal/rescan_report.json \\
     /Users/rahulbhattacharya/Desktop/war-room/data/legal/rescan_report.json
  cd /Users/rahulbhattacharya/Desktop/war-room
  git add data/legal/ && git commit -m "Legal: rescan results" && git push
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

ROOT_DIR   = Path(__file__).parent.parent.parent
SITE_DIR   = ROOT_DIR / "_site"
WAR_ROOM   = Path("/Users/rahulbhattacharya/Desktop/war-room")
ISSUES_PATH = WAR_ROOM / "data" / "legal" / "issues.json"
SUMMARY_PATH = WAR_ROOM / "data" / "legal" / "summary.json"
REPORT_DIR  = ROOT_DIR / "reports" / "legal"

# ── Check functions (rule-based, per issue type) ───────────────────────────────

_REG_DOMAINS = [
    "asic.gov.au", "moneysmart.gov.au", "nhfic.gov.au", "ato.gov.au",
    "irdai.gov.in", "sebi.gov.in", "rbi.org.in", "incometax.gov.in",
    "pfrda.org.in",
]

_ASIC_PHRASES = [
    "general in nature and does not take into account your personal",
    "general advice warning",
    "asic",
    "licensed financial adviser",
]

_IRDAI_PHRASES = [
    "irdai.gov.in",
    "insurance regulatory and development authority",
    "irdai-registered",
]

_PFRDA_PHRASES = [
    "pfrda",
    "pfrda-registered",
    "pension fund regulatory",
]


def url_to_site_path(url: str) -> Path:
    rel = url.lstrip("/")
    if rel.endswith(".html"):
        return SITE_DIR / rel
    return SITE_DIR / rel / "index.html"


def get_main_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for sel in ["nav", "footer", "script", "style"]:
        for node in soup.select(sel):
            node.decompose()
    main = soup.select_one("main") or soup.body
    return main.get_text(" ", strip=True).lower() if main else ""


def get_main_html(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    main = soup.select_one("main") or soup.body
    return str(main).lower() if main else html.lower()


def check_has_asic_warning(html: str) -> bool:
    soup = BeautifulSoup(html, "lxml")
    main_html = str(soup.select_one("main") or soup.body).lower()
    return any(phrase in main_html for phrase in _ASIC_PHRASES)


def check_has_irdai(html: str) -> bool:
    main = get_main_html(html)
    return any(phrase in main for phrase in _IRDAI_PHRASES)


def check_has_pfrda(html: str) -> bool:
    main = get_main_html(html)
    return any(phrase in main for phrase in _PFRDA_PHRASES)


def check_tax_rates_correct(html: str) -> tuple:
    """
    For the AU income tax brackets blog:
    Pass = the MAIN table shows 15% (not 19%) for the $18,201-$45,000 bracket.
    The comparison table showing 19% historically is expected and does not fail.
    Returns (passed, detail).
    """
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    if not tables:
        return False, "No tax table found"

    # The first table should be the main bracket table
    first_table = tables[0]
    rows = first_table.find_all("tr")
    for row in rows:
        cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
        row_text = " ".join(cells).lower()
        if "18,201" in row_text and "45,000" in row_text:
            if "15%" in row_text:
                return True, "Main table shows 15% for $18,201–$45,000 ✓"
            elif "19%" in row_text:
                return False, "Main table still shows 19% for $18,201–$45,000 — update required"
            elif "16%" in row_text:
                return False, "Main table shows 16% — should be 15% for FY2026-27"
    return False, "Could not locate the $18,201–$45,000 bracket row in the first table"


def check_no_wrong_regulator(html: str, wrong: str, correct: str) -> tuple:
    """Check that 'wrong' regulator is not the primary/sole regulatory reference."""
    main = get_main_html(html)
    has_wrong = wrong.lower() in main
    has_correct = correct.lower() in main
    if has_correct:
        return True, f"Has {correct} reference ✓"
    if has_wrong and not has_correct:
        return False, f"Still references {wrong} without {correct}"
    return True, "No wrong-regulator reference found ✓"


def check_text_softened(html: str, hard_phrases: list) -> tuple:
    main = get_main_text(html)
    found = [p for p in hard_phrases if p.lower() in main]
    if found:
        return False, f"Still contains prescriptive phrases: {found[:2]}"
    return True, "Prescriptive language not found ✓"


# ── Issue-specific check dispatch ─────────────────────────────────────────────

ISSUE_CHECKS = {
    # AU calculator pages — need ASIC warning
    "/australia/income-tax-calculator/":        ("asic_warning", {}),
    "/australia/super-balance-calculator/":     ("asic_warning", {}),
    "/australia/salary-sacrifice-calculator/":  ("asic_warning", {}),
    "/australia/age-pension-calculator/":       ("asic_warning", {}),
    "/australia/capital-gains-tax-calculator/": ("asic_warning", {}),
    "/australia/stamp-duty-calculator/":        ("asic_warning", {}),
    "/australia/mortgage-calculator/":          ("asic_warning", {}),
    "/australia/":                              ("asic_warning", {}),

    # AU blog pages — need ASIC warning in article body
    "/australia/blog/super-contribution-caps-2026/":     ("asic_warning", {}),
    "/australia/blog/super-contribution-caps-2026-27/":  ("asic_warning", {}),

    # AU blog — tax rates
    "/australia/blog/australia-income-tax-brackets-2026/": ("tax_rates", {}),

    # IN insurance calculators — need IRDAI (not just SEBI)
    "/india/term-insurance-calculator/":   ("irdai", {}),
    "/india/health-insurance-calculator/": ("irdai", {}),
    "/india/ulip-calculator/":             ("irdai", {}),

    # IN NPS — PFRDA not SEBI
    "/india/nps-calculator/": ("pfrda", {}),

    # IN text-softening
    "/india/income-tax-calculator/": (
        "text_soft",
        {"hard": ["better for most salaried employees", "is better for most people"]},
    ),
    "/india/sip-calculator/": (
        "text_soft",
        {"hard": ["20% of take-home salary", "invest 20% of"]},
    ),
    "/india/capital-gains-calculator/": (
        "text_soft",
        {"hard": ["you must harvest", "you should sell"]},
    ),
    "/india/blog/old-vs-new-tax-regime/": (
        "text_soft",
        {"hard": ["new regime is clearly better", "you should choose the new regime", "stick with the old regime"]},
    ),
}


def run_check(url: str, html: str) -> tuple:
    """
    Run the appropriate rule-based check for a URL.
    Returns (passed: bool, detail: str).
    """
    check_key = ISSUE_CHECKS.get(url)
    if not check_key:
        # No known check — default to looking for ASIC or IRDAI presence
        return None, "No rule-based check registered for this URL — manual review needed"

    check_type, params = check_key

    if check_type == "asic_warning":
        ok = check_has_asic_warning(html)
        return ok, ("ASIC warning present ✓" if ok else "ASIC general advice warning missing ✗")

    if check_type == "tax_rates":
        return check_tax_rates_correct(html)

    if check_type == "irdai":
        ok = check_has_irdai(html)
        return ok, ("IRDAI reference present ✓" if ok else "IRDAI disclaimer still missing ✗")

    if check_type == "pfrda":
        ok = check_has_pfrda(html)
        return ok, ("PFRDA reference present ✓" if ok else "PFRDA reference still missing ✗")

    if check_type == "text_soft":
        hard_phrases = params.get("hard", [])
        return check_text_softened(html, hard_phrases)

    return None, f"Unknown check type: {check_type}"


# ── Per-page rescanner ────────────────────────────────────────────────────────

def rescan_url(url: str, issues: list) -> dict:
    matching = [i for i in issues if i["url"] == url]
    if not matching:
        return {"url": url, "status": "not_in_issues", "detail": "URL not found in issues.json"}

    path = url_to_site_path(url)
    if not path.exists():
        return {"url": url, "status": "file_missing", "detail": str(path)}

    html = path.read_text(encoding="utf-8", errors="replace")
    passed, detail = run_check(url, html)

    results = []
    for issue in matching:
        old_verdict = issue["verdict"]
        if passed is True:
            new_verdict = "green"
        elif passed is False:
            # Keep red/orange as-is; don't upgrade to green
            new_verdict = old_verdict
        else:
            new_verdict = old_verdict  # no check → no change

        changed = old_verdict != new_verdict
        if changed:
            issue["verdict"] = new_verdict
            issue["scan_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        results.append({
            "url": url,
            "old_verdict": old_verdict,
            "new_verdict": new_verdict,
            "changed": changed,
            "check_passed": passed,
            "detail": detail,
            "status": "rescanned",
        })

    return results[0] if len(results) == 1 else {"url": url, "results": results, "status": "multi"}


# ── Summary rebuild ───────────────────────────────────────────────────────────

def rebuild_summary(issues: list):
    summary = {
        "green": 0, "orange": 0, "red": 0,
        "lastScan": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "countries": {},
    }
    for issue in issues:
        v = issue.get("verdict", "orange")
        summary[v] = summary.get(v, 0) + 1
        c = issue.get("country", "unknown")
        if c not in summary["countries"]:
            summary["countries"][c] = {"green": 0, "orange": 0, "red": 0, "pagesScanned": 0}
        summary["countries"][c][v] = summary["countries"][c].get(v, 0) + 1
        summary["countries"][c]["pagesScanned"] = summary["countries"][c].get("pagesScanned", 0) + 1
    return summary


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Legal Room Page Rescanner")
    parser.add_argument("url", nargs="?", help="URL path to rescan (e.g. /australia/income-tax-calculator/)")
    parser.add_argument("--all", action="store_true", help="Rescan all URLs in issues.json")
    parser.add_argument("--show", action="store_true", help="Show current verdicts, no changes")
    args = parser.parse_args()

    if not ISSUES_PATH.exists():
        sys.exit(f"issues.json not found at {ISSUES_PATH}")

    issues = json.loads(ISSUES_PATH.read_text())

    if args.show:
        red    = [i for i in issues if i["verdict"] == "red"]
        orange = [i for i in issues if i["verdict"] == "orange"]
        green  = [i for i in issues if i["verdict"] == "green"]
        print(f"\nCurrent verdicts: Red={len(red)}  Orange={len(orange)}  Green={len(green)}\n")
        for v, lst in [("🔴 RED", red), ("🟠 ORANGE", orange), ("🟢 GREEN", green)]:
            if lst:
                print(f"{v}:")
                for i in lst:
                    print(f"  {i['url']}")
        return

    urls_to_scan = []
    if args.all:
        urls_to_scan = list({i["url"] for i in issues})
    elif args.url:
        urls_to_scan = [args.url if args.url.startswith("/") else "/" + args.url]
    else:
        parser.print_help()
        sys.exit(1)

    print(f"\n{'═'*60}")
    print(f"  Legal Rescanner — {len(urls_to_scan)} page(s)")
    print(f"{'═'*60}\n")

    results = []
    changed_count = 0
    for url in urls_to_scan:
        result = rescan_url(url, issues)
        results.append(result)
        icon = "✓" if result.get("check_passed") else ("✗" if result.get("check_passed") is False else "?")
        changed = " → " + result["new_verdict"].upper() if result.get("changed") else ""
        print(f"  {icon}  {url}")
        print(f"     {result.get('detail', '')}  [{result.get('old_verdict','?')}]{changed}")
        if result.get("changed"):
            changed_count += 1

    if changed_count:
        ISSUES_PATH.write_text(json.dumps(issues, indent=2, ensure_ascii=False))
        summary = rebuild_summary(issues)
        SUMMARY_PATH.write_text(json.dumps(summary, indent=2))
        print(f"\n  Updated {changed_count} verdict(s)")
        print(f"  Red={summary['red']}  Orange={summary['orange']}  Green={summary['green']}")
        print(f"  Written: {ISSUES_PATH}")
        print(f"  Written: {SUMMARY_PATH}")

        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        now = datetime.now(timezone.utc)
        report = {
            "run_at": now.isoformat(),
            "urls_scanned": len(urls_to_scan),
            "verdicts_changed": changed_count,
            "results": results,
        }
        out = REPORT_DIR / "rescan_report.json"
        out.write_text(json.dumps(report, indent=2, ensure_ascii=False))
        print(f"  Report: {out}")

        # Append to scan-log.jsonl so the war-room history table stays current
        scan_id = now.strftime("%Y-%m-%dT%H%M%SZ")
        scope_url = urls_to_scan[0] if len(urls_to_scan) == 1 else None
        country = "all"
        if scope_url:
            if "/india/" in scope_url:
                country = "india"
            elif "/australia/" in scope_url:
                country = "australia"
        log_entry = {
            "scanId": scan_id,
            "date": now.strftime("%Y-%m-%d"),
            "type": "rescan",
            "country": country,
            "url": scope_url,
            "pagesScanned": len(urls_to_scan),
            "red": summary["red"],
            "orange": summary["orange"],
            "green": summary["green"],
        }
        log_path = WAR_ROOM / "data" / "legal" / "scan-log.jsonl"
        if log_path.exists():
            with open(log_path, "a") as f:
                f.write(json.dumps(log_entry) + "\n")

        print(f"\n  Next — push to War Room:")
        print(f"    cp {out} /Users/rahulbhattacharya/Desktop/war-room/data/legal/rescan_report.json")
        print(f"    cd /Users/rahulbhattacharya/Desktop/war-room && git add data/legal/ && git commit -m 'Legal: rescan results' && git push")
    else:
        print("\n  No verdicts changed.")

    print(f"\n{'═'*60}\n")


if __name__ == "__main__":
    main()
