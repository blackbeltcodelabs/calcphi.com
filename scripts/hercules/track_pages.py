"""
track_pages.py — Hercules Post-Fix Page Tracker
================================================
Checks all unresolved pages in tracked.json via URL Inspection API.
Run daily after a fix to monitor progress until pages are confirmed indexed.

Usage:
  python3 scripts/hercules/track_pages.py
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

WAR_ROOM  = Path("/Users/rahulbhattacharya/Desktop/war-room")
OUT_DIR   = WAR_ROOM / "data" / "hercules"
TRACKED_F = OUT_DIR / "tracked.json"
SITE_URL  = os.environ.get("GSC_SITE_URL", "https://www.calcphi.com/")


def build_service():
    import google.auth
    from googleapiclient.discovery import build
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return build("searchconsole", "v1", credentials=creds)


def inspect_url(service, url_path: str) -> dict:
    full_url = SITE_URL.rstrip("/") + url_path
    try:
        result = service.urlInspection().index().inspect(body={
            "inspectionUrl": full_url,
            "siteUrl": SITE_URL,
        }).execute()
        idx   = result.get("inspectionResult", {}).get("indexStatusResult", {})
        state = idx.get("coverageState", "UNKNOWN")
        return {
            "state":       state,
            "crawled":     bool(idx.get("lastCrawlTime")),
            "lastCrawled": idx.get("lastCrawlTime", "")[:10] if idx.get("lastCrawlTime") else None,
        }
    except Exception as e:
        return {"state": "UNKNOWN", "crawled": False, "error": str(e)}


def main():
    adc_path = Path.home() / ".config" / "gcloud" / "application_default_credentials.json"
    if not adc_path.exists():
        print("❌  No Application Default Credentials found.")
        print("    Run: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform")
        sys.exit(1)

    if not TRACKED_F.exists():
        print("⚠  tracked.json not found — nothing to track.")
        sys.exit(0)

    tracked = json.loads(TRACKED_F.read_text())
    active  = [t for t in tracked if not t.get("resolved")]

    if not active:
        print("✓  All tracked pages are resolved.")
        sys.exit(0)

    service = build_service()
    now     = datetime.now(timezone.utc).isoformat()

    print(f"\n{'═'*60}")
    print(f"  Hercules Page Tracker — {len(active)} pages being monitored")
    print(f"{'═'*60}\n")

    resolved_count = 0
    for t in tracked:
        if t.get("resolved"):
            continue

        result = inspect_url(service, t["url"])
        new_state = result["state"]
        t["currentState"] = new_state

        check_entry = {
            "checkedAt": now,
            "state":     new_state,
            "crawled":   result["crawled"],
        }

        if new_state == "SUBMITTED_AND_INDEXED":
            t["resolved"] = True
            check_entry["note"] = "✅ Page confirmed indexed by Google"
            resolved_count += 1
            print(f"  ✅ RESOLVED: {t['url']}")
        else:
            days_since = (datetime.now(timezone.utc) - datetime.fromisoformat(t["fixAppliedAt"].replace("Z", "+00:00"))).days
            if days_since >= 14 and not result["crawled"]:
                check_entry["note"] = f"⚠ Not yet crawled after {days_since} days — consider re-requesting indexing"
            print(f"  ○  {t['url']}  [{new_state}]  crawled={result['crawled']}")

        t["checkHistory"].append(check_entry)
        time.sleep(0.5)

    TRACKED_F.write_text(json.dumps(tracked, indent=2, ensure_ascii=False))
    print(f"\n  Updated tracked.json")
    print(f"  Resolved this run: {resolved_count}")
    print(f"  Still monitoring:  {len(active) - resolved_count}")
    print(f"\n{'═'*60}\n")


if __name__ == "__main__":
    main()
