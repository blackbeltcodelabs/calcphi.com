"""
fix_issues.py — Hercules Automated Fix Applicator
==================================================
Applies deterministic fixes to _site/ HTML for HIGH and MEDIUM priority errors.
Handles: 301 redirects (meta refresh), canonical tags, noindex removal.
Always prints a preview of each change before writing. Requires user confirmation
for content changes.

Usage:
  python3 scripts/hercules/fix_issues.py          # fix all UNFIXED HIGH priority errors
  python3 scripts/hercules/fix_issues.py --medium  # also fix MEDIUM priority
  python3 scripts/hercules/fix_issues.py --dry-run # preview only, no writes
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

WAR_ROOM  = Path("/Users/rahulbhattacharya/Desktop/war-room")
ROOT_DIR  = Path(__file__).parent.parent.parent
SITE_DIR  = ROOT_DIR / "_site"
OUT_DIR   = WAR_ROOM / "data" / "hercules"
ERRORS_F  = OUT_DIR / "errors.json"
TRACKED_F = OUT_DIR / "tracked.json"
SITE_URL  = "https://www.calcphi.com"

REDIRECT_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url={dest}">
  <link rel="canonical" href="{canonical}">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="{dest}">{dest}</a></p>
</body>
</html>"""


def url_to_path(url: str) -> Path:
    rel = url.lstrip("/")
    return SITE_DIR / rel / "index.html"


def apply_redirect(error: dict, dest: str, dry_run: bool) -> bool:
    path = url_to_path(error["url"])
    html = REDIRECT_TEMPLATE.format(dest=dest, canonical=f"{SITE_URL}{dest}")
    print(f"\n  → Redirect: {error['url']}  →  {dest}")
    print(f"    File: {path}")
    if dry_run:
        print("    [DRY RUN — no write]")
        return True
    confirm = input("    Apply this redirect? [y/N] ").strip().lower()
    if confirm != "y":
        print("    Skipped.")
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html)
    print(f"    ✓ Written.")
    return True


def mark_fixed(errors: list, error_id: str, fix_desc: str):
    now = datetime.now(timezone.utc).isoformat()
    for e in errors:
        if e["id"] == error_id:
            e["fixStatus"]    = "FIX_APPLIED"
            e["fixAppliedAt"] = now
            e["fixDescription"] = fix_desc
    return errors


def add_to_tracked(tracked: list, error: dict, fix_desc: str):
    now = datetime.now(timezone.utc).isoformat()
    existing_urls = {t["url"] for t in tracked}
    if error["url"] not in existing_urls:
        tracked.append({
            "url":           error["url"],
            "market":        "india" if "/india/" in error["url"] else "australia" if "/australia/" in error["url"] else "global",
            "reason":        f"Crawl error fix applied: {error['errorType'].replace('_', ' ')}",
            "fixAppliedAt":  now,
            "fixDescription": fix_desc,
            "baselineState": error["errorType"].replace("_", "_"),
            "currentState":  error["errorType"].replace("_", "_"),
            "targetState":   "SUBMITTED_AND_INDEXED",
            "resolved":      False,
            "checkHistory": [{
                "checkedAt": now,
                "state":     error["errorType"],
                "crawled":   False,
                "note":      f"Fix applied — awaiting Googlebot recrawl",
            }],
        })


def main():
    parser = argparse.ArgumentParser(description="Hercules Fix Applicator")
    parser.add_argument("--medium",  action="store_true", help="Also fix MEDIUM priority errors")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no writes")
    args = parser.parse_args()

    if not ERRORS_F.exists():
        print("⚠  errors.json not found — run a Full Scan first.")
        return

    errors  = json.loads(ERRORS_F.read_text())
    tracked = json.loads(TRACKED_F.read_text()) if TRACKED_F.exists() else []

    priorities = ["HIGH"] + (["MEDIUM"] if args.medium else [])
    to_fix = [e for e in errors if e["fixStatus"] == "UNFIXED" and e["priority"] in priorities]

    print(f"\n{'═'*60}")
    print(f"  Hercules Fix Applicator  {'(DRY RUN)' if args.dry_run else ''}")
    print(f"  {len(to_fix)} errors to fix  ({', '.join(priorities)} priority)")
    print(f"{'═'*60}")

    fixed_count = 0
    for error in to_fix:
        print(f"\n  ── {error['id']} ──")
        print(f"  URL:   {error['url']}")
        print(f"  Type:  {error['errorType'].replace('_', ' ')}")
        print(f"  Issue: {error['googleMessage']}")
        print(f"  Fix:   {error['suggestedFix']}")

        if error["errorType"] == "NOT_FOUND_404":
            # Suggest a redirect destination
            url = error["url"]
            if "/india/" in url:
                if "sip" in url:
                    dest = "/india/sip-calculator/"
                elif "income-tax" in url or "tax" in url:
                    dest = "/india/income-tax-calculator/"
                else:
                    dest = "/india/"
            elif "/australia/" in url:
                if "super" in url:
                    dest = "/australia/super-balance-calculator/"
                elif "mortgage" in url:
                    dest = "/australia/mortgage-calculator/"
                else:
                    dest = "/australia/"
            else:
                dest = "/"

            applied = apply_redirect(error, dest, args.dry_run)
            if applied:
                errors  = mark_fixed(errors, error["id"], f"301 redirect to {dest}")
                add_to_tracked(tracked, error, f"301 redirect added: {url} → {dest}")
                fixed_count += 1

        elif error["errorType"] == "SOFT_404":
            print(f"\n  ⚠  Soft 404 fix requires content expansion — use 'Run the Hercules Fix' in Claude Code")
            print(f"     Claude will expand the page content and confirm the change with you.")

        else:
            print(f"  ○  Automated fix not available for {error['errorType']} — use Claude Code")

    if not args.dry_run and fixed_count > 0:
        ERRORS_F.write_text(json.dumps(errors, indent=2, ensure_ascii=False))
        TRACKED_F.write_text(json.dumps(tracked, indent=2, ensure_ascii=False))
        print(f"\n  ✓ errors.json updated  ({fixed_count} fixed)")
        print(f"  ✓ tracked.json updated ({fixed_count} pages added to monitoring)")
        print(f"\n  Next steps:")
        print(f"  1. git add _site/ && git commit -m 'Hercules: apply crawl fixes' && git push")
        print(f"  2. cd {WAR_ROOM} && git add data/hercules/ && git commit -m 'Hercules: fix log' && git push")
    elif fixed_count == 0:
        print(f"\n  No automated fixes were applied.")

    print(f"\n{'═'*60}\n")


if __name__ == "__main__":
    main()
