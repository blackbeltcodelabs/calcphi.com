"""
check_indexing.py — Hercules URL Inspection Checker
=====================================================
Runs URL Inspection API calls for specific pages and updates
war-room/data/hercules/pages.json and errors.json.

Usage:
  python3 scripts/hercules/check_indexing.py --errors              # re-inspect all error pages
  python3 scripts/hercules/check_indexing.py --tracked             # check tracked pages
  python3 scripts/hercules/check_indexing.py --urls /india/sip-calculator/
  python3 scripts/hercules/check_indexing.py --request-indexing --urls /india/sip-calculator/
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

WAR_ROOM  = Path("/Users/rahulbhattacharya/Desktop/war-room")
OUT_DIR   = WAR_ROOM / "data" / "hercules"
PAGES_F   = OUT_DIR / "pages.json"
ERRORS_F  = OUT_DIR / "errors.json"
TRACKED_F = OUT_DIR / "tracked.json"
SITE_URL  = os.environ.get("GSC_SITE_URL", "https://www.calcphi.com/")


def build_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    creds = service_account.Credentials.from_service_account_file(
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"],
        scopes=["https://www.googleapis.com/auth/webmasters"],
    )
    return build("searchconsole", "v1", credentials=creds)


def inspect_url(service, url_path: str) -> dict:
    full_url = SITE_URL.rstrip("/") + url_path
    try:
        result = service.urlInspection().index().inspect(body={
            "inspectionUrl": full_url,
            "siteUrl": SITE_URL,
        }).execute()
        idx = result.get("inspectionResult", {}).get("indexStatusResult", {})
        state = idx.get("coverageState", "UNKNOWN")
        return {
            "url": url_path,
            "coverageState": state,
            "lastCrawlDate": idx.get("lastCrawlTime", "")[:10] if idx.get("lastCrawlTime") else None,
            "googleCanonical": (idx.get("googleCanonical") or "").replace(SITE_URL.rstrip("/"), "") or None,
            "crawled": bool(idx.get("lastCrawlTime")),
            "indexed": "INDEXED" in state and "NOT" not in state,
        }
    except Exception as e:
        return {"url": url_path, "error": str(e), "coverageState": "UNKNOWN", "crawled": False, "indexed": False}


def request_indexing(service, url_path: str):
    full_url = SITE_URL.rstrip("/") + url_path
    try:
        service.urlInspection().index().inspect(body={
            "inspectionUrl": full_url,
            "siteUrl": SITE_URL,
        }).execute()
        print(f"  ✓ Indexing requested: {url_path}")
    except Exception as e:
        print(f"  ⚠  Request failed for {url_path}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Hercules URL Inspection Checker")
    parser.add_argument("--errors",            action="store_true", help="Re-inspect all error pages")
    parser.add_argument("--tracked",           action="store_true", help="Check all tracked pages")
    parser.add_argument("--urls",              nargs="+",           help="Specific URL paths to check")
    parser.add_argument("--request-indexing",  action="store_true", help="Request priority indexing for specified URLs")
    args = parser.parse_args()

    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not Path(creds_path).exists():
        print("❌  GOOGLE_APPLICATION_CREDENTIALS not set or file not found.")
        print("    Run fetch_gsc.py for setup instructions.")
        sys.exit(1)

    service = build_service()
    now     = datetime.now(timezone.utc).isoformat()

    print(f"\n{'═'*60}")
    print(f"  Hercules URL Inspector")
    print(f"{'═'*60}\n")

    urls_to_check = list(args.urls or [])

    if args.errors and ERRORS_F.exists():
        errors = json.loads(ERRORS_F.read_text())
        urls_to_check += [e["url"] for e in errors if e["fixStatus"] != "FIXED_CONFIRMED"]

    if args.tracked and TRACKED_F.exists():
        tracked = json.loads(TRACKED_F.read_text())
        urls_to_check += [t["url"] for t in tracked if not t.get("resolved")]

    urls_to_check = list(dict.fromkeys(urls_to_check))  # deduplicate

    print(f"  Inspecting {len(urls_to_check)} URL(s)...\n")
    results = {}
    for url in urls_to_check:
        result = inspect_url(service, url)
        results[url] = result
        icon = "✓" if result.get("indexed") else ("⚠" if result.get("crawled") else "○")
        print(f"  {icon}  {url}")
        print(f"     {result.get('coverageState', 'UNKNOWN')}")
        if args.request_indexing:
            request_indexing(service, url)
            time.sleep(1)
        time.sleep(0.5)

    # Update pages.json
    if PAGES_F.exists():
        pages = json.loads(PAGES_F.read_text())
        for page in pages:
            if page["url"] in results:
                r = results[page["url"]]
                page["coverageState"] = r.get("coverageState", page["coverageState"])
                page["lastCrawlDate"] = r.get("lastCrawlDate", page.get("lastCrawlDate"))
                page["googleCanonical"] = r.get("googleCanonical", page.get("googleCanonical"))
                page["lastChecked"]   = now[:10]
                if r.get("indexed"):
                    page["category"] = "INDEXED"
        PAGES_F.write_text(json.dumps(pages, indent=2, ensure_ascii=False))
        print(f"\n  ✓ pages.json updated")

    # Update tracked.json
    if args.tracked and TRACKED_F.exists():
        tracked = json.loads(TRACKED_F.read_text())
        for t in tracked:
            if t["url"] in results:
                r = results[t["url"]]
                new_state = r.get("coverageState", t["currentState"])
                t["currentState"] = new_state
                t["checkHistory"].append({
                    "checkedAt": now,
                    "state":     new_state,
                    "crawled":   r.get("crawled", False),
                })
                if new_state == "SUBMITTED_AND_INDEXED":
                    t["resolved"] = True
                    print(f"  ✅  RESOLVED: {t['url']}")
        TRACKED_F.write_text(json.dumps(tracked, indent=2, ensure_ascii=False))
        print(f"  ✓ tracked.json updated")

    print(f"\n{'═'*60}\n")


if __name__ == "__main__":
    main()
