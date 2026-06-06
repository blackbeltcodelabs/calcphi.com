"""
fetch_bing.py — Hercules Bing Webmaster Fetcher
================================================
Fetches index counts from the Bing Webmaster API and updates
war-room/data/hercules/coverage.json.

Environment:
  BING_WEBMASTER_API_KEY=your-api-key

Setup:
  1. Go to https://www.bing.com/webmasters/
  2. Sign in and verify calcphi.com as a site
  3. Settings → API Access → Generate API Key
  4. export BING_WEBMASTER_API_KEY=your-key

Usage:
  python3 scripts/hercules/fetch_bing.py
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

WAR_ROOM    = Path("/Users/rahulbhattacharya/Desktop/war-room")
COVERAGE    = WAR_ROOM / "data" / "hercules" / "coverage.json"
SITE_URL    = "https://www.calcphi.com/"
BING_API    = "https://ssl.bing.com/webmaster/api.svc/json"


def check_credentials():
    key = os.environ.get("BING_WEBMASTER_API_KEY")
    if not key:
        print("\n⚠  BING_WEBMASTER_API_KEY not set — skipping Bing fetch.")
        print("  To enable: Settings → API Access in Bing Webmaster Tools")
        print("  then: export BING_WEBMASTER_API_KEY=your-key\n")
        return None
    return key


def get_bing_url_info(api_key: str, url: str) -> dict:
    params = {"apikey": api_key}
    body   = {"siteUrl": SITE_URL, "url": url}
    try:
        r = requests.post(f"{BING_API}/GetUrlInfo", params=params, json=body, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def get_crawl_stats(api_key: str) -> dict:
    params = {"apikey": api_key, "siteUrl": SITE_URL}
    try:
        r = requests.get(f"{BING_API}/GetCrawlStats", params=params, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def main():
    api_key = check_credentials()
    if not api_key:
        sys.exit(0)

    print(f"\n{'═'*60}")
    print(f"  Hercules Bing Fetcher  ·  {SITE_URL}")
    print(f"{'═'*60}\n")

    stats = get_crawl_stats(api_key)
    if "error" in stats:
        print(f"  ❌ Bing API error: {stats['error']}")
        sys.exit(1)

    # Bing returns crawl stats; index count is approximate
    # Use InCrawl count as proxy for indexed pages
    bing_indexed = stats.get("d", {}).get("InIndex", 0)
    yahoo_indexed = int(bing_indexed * 0.93)  # Yahoo uses Bing's index

    now = datetime.now(timezone.utc).isoformat()

    if COVERAGE.exists():
        coverage = json.loads(COVERAGE.read_text())
        coverage["searchEngines"]["bing"]  = {"indexed": bing_indexed,  "lastChecked": now}
        coverage["searchEngines"]["yahoo"] = {"indexed": yahoo_indexed, "lastChecked": now}
        COVERAGE.write_text(json.dumps(coverage, indent=2))
        print(f"  ✓ Bing indexed: {bing_indexed}")
        print(f"  ✓ Yahoo indexed (est.): {yahoo_indexed}")
        print(f"  ✓ coverage.json updated")
    else:
        print(f"  ⚠  coverage.json not found — run fetch_gsc.py first")

    print(f"\n{'═'*60}\n")


if __name__ == "__main__":
    main()
