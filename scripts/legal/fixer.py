"""
fixer.py — Legal Room Fixer
============================
Reads war-room/data/legal/issues.json, applies drafted fixes to _site/ HTML,
and writes a fix report. Mirrors the AdSense sentinel/fixer.py architecture.

Fix patterns:
  ASIC_CALC       — inject ASIC general advice warning above calculator-widget
  ASIC_BLOG       — inject ASIC warning box at top of AU blog article body
  IRDAI_INSURANCE — inject IRDAI disclaimer before data-source on IN insurance pages
  IRDAI_INJECT    — add IRDAI block where no data-source exists yet (ULIP)
  TEXT_SOFTEN     — find-and-replace prescriptive/advisory language
  PFRDA_FIX       — replace "SEBI-registered" with "PFRDA-registered" for NPS
  MANUAL_FLAG     — issue requires human verification; flagged in report only

Usage:
  python3 scripts/legal/fixer.py              # fix all red + orange issues
  python3 scripts/legal/fixer.py --dry-run    # preview, no writes
  python3 scripts/legal/fixer.py --red-only   # only fix red issues
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup

ROOT_DIR   = Path(__file__).parent.parent.parent
SITE_DIR   = ROOT_DIR / "_site"
WAR_ROOM   = Path("/Users/rahulbhattacharya/Desktop/war-room")
ISSUES_PATH = WAR_ROOM / "data" / "legal" / "issues.json"
REPORT_DIR  = ROOT_DIR / "reports" / "legal"

# ── Shared styles ──────────────────────────────────────────────────────────────

_WARN_STYLE = (
    "margin-bottom:1rem;padding:.85rem 1.1rem;"
    "background:#fff8f0;border:1px solid #f4c790;"
    "border-left:4px solid #e8891a;"
    "border-radius:0 8px 8px 0;"
    "font-size:.82rem;color:#4a3000;line-height:1.6"
)

_IRDAI_STYLE = (
    "margin-bottom:1rem;padding:.85rem 1.1rem;"
    "background:#f0f7ff;border:1px solid #90c4f4;"
    "border-left:4px solid #1a78e8;"
    "border-radius:0 8px 8px 0;"
    "font-size:.82rem;color:#002a4a;line-height:1.6"
)

# ── Per-URL fix specifications ────────────────────────────────────────────────
# pattern: one of ASIC_CALC | ASIC_BLOG | IRDAI_INSURANCE | IRDAI_INJECT |
#          TEXT_SOFTEN | PFRDA_FIX | MANUAL_FLAG
# content: the HTML/text to inject or replace
# find / replace: used by TEXT_SOFTEN only

FIXES = [

  # ── RED: Australian calculators — ASIC general advice warning ───────────────

  {
    "url": "/australia/income-tax-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. You should consider whether "
      "this information is appropriate to your circumstances and, where necessary, "
      "seek professional advice from a licensed financial adviser."
      "</div>"
    ),
    "verdict_after": "green",
  },

  {
    "url": "/australia/super-balance-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. You should consider whether "
      "this information is appropriate to your circumstances and, where necessary, "
      "seek professional advice from a licensed financial adviser or "
      "APRA-regulated superannuation fund. "
      "<strong>Past performance is not a reliable indicator of future performance.</strong> "
      "The assumed return rate is illustrative only — actual returns depend on your "
      "fund's investment option and market conditions."
      "</div>"
    ),
    "verdict_after": "green",
  },

  {
    "url": "/australia/salary-sacrifice-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. Salary sacrifice into "
      "superannuation is a financial product decision. You should consider whether "
      "this information is appropriate to your circumstances and, where necessary, "
      "seek professional advice from a licensed financial adviser."
      "</div>"
    ),
    "verdict_after": "green",
  },

  {
    "url": "/australia/age-pension-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. "
      "Age Pension entitlements are assessed by Services Australia (Centrelink) "
      "based on your individual circumstances — this calculator provides an estimate "
      "only. Contact Centrelink or a licensed financial adviser for an accurate assessment."
      "</div>"
    ),
    "verdict_after": "green",
  },

  {
    "url": "/australia/capital-gains-tax-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. Capital gains tax outcomes "
      "vary based on individual circumstances including residency, asset type, holding "
      "period, and other income. Consult a registered tax agent or licensed financial "
      "adviser before acting on this estimate."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── RED: AU blog — tax rates inconsistency (manual verification required) ───

  {
    "url": "/australia/blog/australia-income-tax-brackets-2026/",
    "pattern": "MANUAL_FLAG",
    "note": (
      "Tax rates in the article (19% / 32.5%) appear inconsistent with Stage 3 cuts "
      "(16% / 30% effective 1 July 2024). Verify against ato.gov.au for FY2026-27 "
      "and update the table to the correct rates. This requires human verification "
      "against the ATO — the fixer cannot determine which rate set is correct."
    ),
    "verdict_after": "orange",
  },

  # ── RED: India insurance calculators — wrong regulator (SEBI vs IRDAI) ──────

  {
    "url": "/india/term-insurance-calculator/",
    "pattern": "IRDAI_INSURANCE",
    "content": (
      '<div class="legal-warning" style="' + _IRDAI_STYLE + '">'
      "<strong>Regulatory Notice:</strong> "
      "Term insurance is regulated by the "
      '<a href="https://www.irdai.gov.in" rel="noopener noreferrer" target="_blank">'
      "Insurance Regulatory and Development Authority of India (IRDAI)"
      "</a>. "
      "Premium estimates are illustrative — actual premiums depend on age, health, "
      "sum assured, policy term, and insurer. Consult a licensed insurance agent or "
      "IRDAI-registered adviser before purchasing any life insurance product. "
      "This calculator is for estimation purposes only and does not constitute "
      "insurance advice."
      "</div>"
    ),
    "verdict_after": "green",
  },

  {
    "url": "/india/health-insurance-calculator/",
    "pattern": "IRDAI_INSURANCE",
    "content": (
      '<div class="legal-warning" style="' + _IRDAI_STYLE + '">'
      "<strong>Regulatory Notice:</strong> "
      "Health insurance is regulated by the "
      '<a href="https://www.irdai.gov.in" rel="noopener noreferrer" target="_blank">'
      "Insurance Regulatory and Development Authority of India (IRDAI)"
      "</a>. "
      "Coverage estimates shown are general benchmarks — actual coverage needs depend "
      "on your health profile, city of residence, family size, and existing conditions. "
      "Consult a licensed insurance broker or IRDAI-registered adviser before purchasing "
      "any health insurance product."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── ORANGE: India NPS — wrong regulator (SEBI → PFRDA) ────────────────────

  {
    "url": "/india/nps-calculator/",
    "pattern": "PFRDA_FIX",
    "find": "SEBI-registered investment adviser",
    "replace": "PFRDA-registered point of presence (PoP) or NPS adviser",
    "verdict_after": "green",
  },

  # ── ORANGE: India ULIP — add IRDAI disclaimer ──────────────────────────────

  {
    "url": "/india/ulip-calculator/",
    "pattern": "IRDAI_INJECT",
    "content": (
      '<div class="legal-warning" style="' + _IRDAI_STYLE + '">'
      "<strong>Regulatory Notice:</strong> "
      "ULIPs (Unit Linked Insurance Plans) are insurance-cum-investment products "
      "regulated by the "
      '<a href="https://www.irdai.gov.in" rel="noopener noreferrer" target="_blank">'
      "Insurance Regulatory and Development Authority of India (IRDAI)"
      "</a>. "
      "Returns shown are illustrative based on assumed fund performance — "
      "actual returns are not guaranteed and depend on market conditions and fund choice. "
      "Consult a licensed insurance adviser before purchasing a ULIP."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── ORANGE: India income-tax — soften regime recommendation ───────────────

  {
    "url": "/india/income-tax-calculator/",
    "pattern": "TEXT_SOFTEN",
    "replacements": [
      {
        "find": "better for most salaried employees",
        "replace": "more tax-efficient for many salaried employees — compare both regimes using your actual numbers",
      },
      {
        "find": "is better for most people",
        "replace": "may be more tax-efficient for many individuals — verify with your specific deductions",
      },
    ],
    "verdict_after": "green",
  },

  # ── ORANGE: India SIP — soften prescriptive allocation ────────────────────

  {
    "url": "/india/sip-calculator/",
    "pattern": "TEXT_SOFTEN",
    "replacements": [
      {
        "find": "20% of take-home salary",
        "replace": "20% of take-home salary (a common benchmark — your actual allocation should reflect your goals and budget)",
      },
      {
        "find": "Invest 20% of",
        "replace": "A common starting point is 20% of",
      },
    ],
    "verdict_after": "green",
  },

  # ── ORANGE: India capital gains — soften tax-loss harvesting language ──────

  {
    "url": "/india/capital-gains-calculator/",
    "pattern": "TEXT_SOFTEN",
    "replacements": [
      {
        "find": "You should harvest",
        "replace": "One strategy is to harvest",
      },
      {
        "find": "you should sell",
        "replace": "you may consider selling",
      },
    ],
    "verdict_after": "green",
  },

  # ── ORANGE: AU stamp duty — add general advice warning ────────────────────

  {
    "url": "/australia/stamp-duty-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. Stamp duty rates and "
      "concessions vary by state and territory and are subject to change. "
      "Always verify current rates with your state revenue office or conveyancer "
      "before completing a property transaction."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── ORANGE: AU mortgage — add ASIC warning with credit adviser note ────────

  {
    "url": "/australia/mortgage-calculator/",
    "pattern": "ASIC_CALC",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This information is general in nature and does not take into account your "
      "personal objectives, financial situation or needs. Mortgage repayments depend "
      "on the specific terms offered by your lender, which vary based on credit "
      "profile, loan-to-value ratio, and lender policies. Interest rates shown are "
      "market estimates — verify current rates with your lender or mortgage broker. "
      "For mortgage advice, consult a licensed credit adviser (Australian credit licence)."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── ORANGE: AU homepage — add site-wide ASIC banner to footer area ─────────

  {
    "url": "/australia/",
    "pattern": "ASIC_HOMEPAGE",
    "content": (
      '<div class="legal-warning" style="'
      "margin:1.5rem 0;padding:.85rem 1.1rem;"
      "background:#fff8f0;border:1px solid #f4c790;"
      "border-left:4px solid #e8891a;"
      "border-radius:0 8px 8px 0;"
      "font-size:.82rem;color:#4a3000;line-height:1.6"
      '">'
      "<strong>General Advice Warning:</strong> "
      "The calculators on this site provide general information only. "
      "This information does not take into account your personal objectives, "
      "financial situation or needs. You should consider whether the information "
      "is appropriate to your circumstances and, where necessary, seek professional "
      "advice from a licensed financial adviser (Australian Financial Services licence)."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── ORANGE: AU blog super-contribution-caps — add ASIC article warning ─────

  {
    "url": "/australia/blog/super-contribution-caps-2026/",
    "pattern": "ASIC_BLOG",
    "content": (
      '<div class="legal-warning" style="' + _WARN_STYLE + '">'
      "<strong>General Advice Warning:</strong> "
      "This article provides general information about superannuation contribution "
      "caps and does not constitute financial product advice. This information does "
      "not take into account your personal objectives, financial situation or needs. "
      "Superannuation rules are complex and individual circumstances vary — consult "
      "a licensed financial adviser or your super fund before making contribution decisions."
      "</div>"
    ),
    "verdict_after": "green",
  },

  # ── ORANGE: India old-vs-new tax regime blog — soften definitive recs ──────

  {
    "url": "/india/blog/old-vs-new-tax-regime/",
    "pattern": "TEXT_SOFTEN",
    "replacements": [
      {
        "find": "new regime is clearly better",
        "replace": "new regime is likely more tax-efficient",
      },
      {
        "find": "old regime is better",
        "replace": "old regime may be more tax-efficient",
      },
      {
        "find": "you should choose the new regime",
        "replace": "the new regime may be worth considering",
      },
      {
        "find": "you should stick with the old regime",
        "replace": "the old regime may be more beneficial in your case",
      },
    ],
    "verdict_after": "green",
  },
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def url_to_site_path(url: str) -> Path:
    rel = url.lstrip("/")
    if rel.endswith(".html"):
        return SITE_DIR / rel
    return SITE_DIR / rel / "index.html"


def idempotency_marker(url: str) -> str:
    """A short string that signals the fix was already applied."""
    return f'data-legal-fixed="{url.strip("/").replace("/", "-")}"'


def already_fixed(html: str, url: str) -> bool:
    return idempotency_marker(url) in html


def stamp_fixed(html: str, url: str) -> str:
    """Add idempotency marker to <body> tag."""
    marker = idempotency_marker(url)
    if "<body" in html and "data-legal-fixed" not in html:
        html = html.replace("<body", f'<body {marker}', 1)
    return html


# ── Fix appliers ───────────────────────────────────────────────────────────────

def apply_asic_calc(html: str, content: str) -> tuple:
    """Inject warning block before <div class="calculator-widget">."""
    target = '<div class="calculator-widget">'
    if target not in html:
        return html, False
    html = html.replace(target, content + "\n" + target, 1)
    return html, True


def apply_asic_blog(html: str, content: str) -> tuple:
    """Inject warning box after the first substantive <p> in <main>."""
    soup = BeautifulSoup(html, "lxml")
    main = soup.select_one("main")
    if not main:
        return html, False
    first_p = next(
        (p for p in main.find_all("p") if len(p.get_text(strip=True).split()) >= 20),
        None,
    )
    if not first_p:
        return html, False
    p_text = first_p.get_text(strip=True)[:60]
    idx = html.find(p_text)
    if idx < 0:
        return html, False
    p_open = html.rfind("<p", 0, idx)
    if p_open < 0:
        return html, False
    html = html[:p_open] + content + "\n" + html[p_open:]
    return html, True


def apply_irdai_insurance(html: str, content: str) -> tuple:
    """Inject IRDAI block before <div class="data-source"> (before the existing SEBI block)."""
    target = '<div class="data-source"'
    if target not in html:
        # fallback: before </main>
        if "</main>" in html:
            html = html.replace("</main>", content + "\n</main>", 1)
            return html, True
        return html, False
    html = html.replace(target, content + "\n" + target, 1)
    return html, True


def apply_irdai_inject(html: str, content: str) -> tuple:
    """Same as IRDAI_INSURANCE — inject before data-source or before </main>."""
    return apply_irdai_insurance(html, content)


def apply_asic_homepage(html: str, content: str) -> tuple:
    """Inject ASIC banner before the first calculator section or before </main>."""
    # Try before a grid/calculator section
    for target in ['<div class="calc-grid"', '<div class="calculators"', '<section', "</main>"]:
        if target in html:
            html = html.replace(target, content + "\n" + target, 1)
            return html, True
    return html, False


def apply_text_soften(html: str, replacements: list) -> tuple:
    changed = False
    for r in replacements:
        if r["find"] in html:
            html = html.replace(r["find"], r["replace"])
            changed = True
    return html, changed


def apply_pfrda_fix(html: str, find: str, replace: str) -> tuple:
    if find not in html:
        return html, False
    html = html.replace(find, replace)
    return html, True


# ── Per-issue fixer ────────────────────────────────────────────────────────────

def fix_issue(fix_spec: dict, dry_run: bool) -> dict:
    url = fix_spec["url"]
    pattern = fix_spec["pattern"]
    path = url_to_site_path(url)

    result = {
        "url": url,
        "pattern": pattern,
        "status": "skipped",
        "note": fix_spec.get("note", ""),
        "verdict_after": fix_spec.get("verdict_after", "orange"),
    }

    if pattern == "MANUAL_FLAG":
        result["status"] = "manual_required"
        result["note"] = fix_spec.get("note", "Requires human verification.")
        print(f"  ⚠  MANUAL: {url}")
        print(f"     {fix_spec.get('note','')[:120]}")
        return result

    if not path.exists():
        result["status"] = "file_missing"
        print(f"  ✗  MISSING: {url}")
        return result

    html = path.read_text(encoding="utf-8", errors="replace")

    if already_fixed(html, url):
        result["status"] = "already_fixed"
        print(f"  ↩  SKIP (already fixed): {url}")
        return result

    ok = False
    if pattern == "ASIC_CALC":
        html, ok = apply_asic_calc(html, fix_spec["content"])
    elif pattern == "ASIC_BLOG":
        html, ok = apply_asic_blog(html, fix_spec["content"])
    elif pattern == "IRDAI_INSURANCE":
        html, ok = apply_irdai_insurance(html, fix_spec["content"])
    elif pattern == "IRDAI_INJECT":
        html, ok = apply_irdai_inject(html, fix_spec["content"])
    elif pattern == "ASIC_HOMEPAGE":
        html, ok = apply_asic_homepage(html, fix_spec["content"])
    elif pattern == "TEXT_SOFTEN":
        html, ok = apply_text_soften(html, fix_spec["replacements"])
    elif pattern == "PFRDA_FIX":
        html, ok = apply_pfrda_fix(html, fix_spec["find"], fix_spec["replace"])

    if not ok:
        result["status"] = "no_injection_point"
        print(f"  ✗  NO POINT: {url} ({pattern})")
        return result

    html = stamp_fixed(html, url)

    if not dry_run:
        path.write_text(html, encoding="utf-8")
        result["status"] = "fixed"
        print(f"  ✓  FIXED [{pattern}]: {url}")
    else:
        result["status"] = "dry_run_would_fix"
        print(f"  ~  DRY RUN [{pattern}]: {url}")

    return result


# ── Update issues.json verdicts after fixes ────────────────────────────────────

def update_issues_verdicts(fix_results: list):
    """Update war-room issues.json to reflect the new verdicts."""
    if not ISSUES_PATH.exists():
        return
    issues = json.loads(ISSUES_PATH.read_text())
    fixed_map = {
        r["url"]: r["verdict_after"]
        for r in fix_results
        if r["status"] in ("fixed", "already_fixed")
    }
    for issue in issues:
        new_verdict = fixed_map.get(issue["url"])
        if new_verdict:
            issue["verdict"] = new_verdict
    ISSUES_PATH.write_text(json.dumps(issues, indent=2, ensure_ascii=False))
    print(f"\n  Updated {ISSUES_PATH}")


def rebuild_summary(fix_results: list):
    """Recompute summary.json from updated issues.json."""
    if not ISSUES_PATH.exists():
        return
    issues = json.loads(ISSUES_PATH.read_text())
    summary = {
        "green": 0, "orange": 0, "red": 0,
        "lastScan": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "countries": {}
    }
    for issue in issues:
        v = issue.get("verdict", "orange")
        summary[v] = summary.get(v, 0) + 1
        c = issue.get("country", "unknown")
        if c not in summary["countries"]:
            summary["countries"][c] = {"green": 0, "orange": 0, "red": 0, "pagesScanned": 0}
        summary["countries"][c][v] = summary["countries"][c].get(v, 0) + 1
        summary["countries"][c]["pagesScanned"] = summary["countries"][c].get("pagesScanned", 0) + 1

    summary_path = WAR_ROOM / "data" / "legal" / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))
    print(f"  Updated summary → {summary_path}")
    print(f"  Red: {summary['red']}  Orange: {summary['orange']}  Green: {summary['green']}")


# ── Main ───────────────────────────────────────────────────────────────────────

def run_fixer(dry_run: bool = False, red_only: bool = False) -> dict:
    if not ISSUES_PATH.exists():
        sys.exit(f"Issues file not found: {ISSUES_PATH}\nRun a legal scan first.")

    issues_data = json.loads(ISSUES_PATH.read_text())
    red_urls   = {i["url"] for i in issues_data if i["verdict"] == "red"}
    orange_urls = {i["url"] for i in issues_data if i["verdict"] == "orange"}

    fix_specs = FIXES
    if red_only:
        fix_specs = [f for f in FIXES if f["url"] in red_urls]

    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n{'═'*60}")
    print(f"  {mode}Legal Fixer — {len(fix_specs)} issue(s) to process")
    print(f"{'═'*60}\n")

    results = []
    for spec in fix_specs:
        result = fix_issue(spec, dry_run)
        results.append(result)

    fixed    = [r for r in results if r["status"] == "fixed"]
    manual   = [r for r in results if r["status"] == "manual_required"]
    skipped  = [r for r in results if r["status"] == "already_fixed"]
    missing  = [r for r in results if r["status"] == "file_missing"]
    no_point = [r for r in results if r["status"] == "no_injection_point"]

    print(f"\n{'─'*60}")
    print(f"  Fixed          : {len(fixed)}")
    print(f"  Already fixed  : {len(skipped)}")
    print(f"  Manual required: {len(manual)}")
    print(f"  File missing   : {len(missing)}")
    print(f"  No inject point: {len(no_point)}")

    if manual:
        print(f"\n  ⚠  Manual review needed:")
        for r in manual:
            print(f"    {r['url']}")
            print(f"    → {r['note'][:120]}")

    if not dry_run:
        update_issues_verdicts(results)
        rebuild_summary(results)

        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        report = {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "dry_run": dry_run,
            "issues_processed": len(results),
            "fixed": len(fixed),
            "manual_required": len(manual),
            "results": results,
        }
        out = REPORT_DIR / "fix_report_latest.json"
        out.write_text(json.dumps(report, indent=2, ensure_ascii=False))
        print(f"\n  Fix report → {out}")

        print(f"\n  Next: commit _site/ + push, then copy data to war room:")
        print(f"    git add _site/ && git commit -m 'Legal Fixer: fixes applied' && git push")
        print(f"    cp reports/legal/fix_report_latest.json {WAR_ROOM}/data/legal/")
        print(f"    cd {WAR_ROOM} && git add data/legal/ && git commit -m 'Legal: issues fixed' && git push")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Legal Room Fixer")
    parser.add_argument("--dry-run",   action="store_true", help="Preview, no writes")
    parser.add_argument("--red-only",  action="store_true", help="Fix red issues only")
    args = parser.parse_args()
    run_fixer(dry_run=args.dry_run, red_only=args.red_only)
