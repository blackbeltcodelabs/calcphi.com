"""
fetch_gsc.py — Hercules GSC Data Fetcher
==========================================
Fetches coverage, URL inspection, and search analytics from the
Google Search Console API and writes structured JSON to war-room/data/hercules/.

Requirements:
  pip install google-auth google-auth-httplib2 google-api-python-client requests

Environment:
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/gsc-service-account.json
  GSC_SITE_URL=https://www.calcphi.com/

Usage:
  python3 scripts/hercules/fetch_gsc.py --all        # full fetch
  python3 scripts/hercules/fetch_gsc.py --coverage   # coverage only
  python3 scripts/hercules/fetch_gsc.py --analytics  # search analytics only
  python3 scripts/hercules/fetch_gsc.py --inspect    # URL inspection only

Setup (one time):
  1. Go to https://console.cloud.google.com/
  2. Create a project, enable "Google Search Console API"
  3. Create a service account, download JSON key
  4. In GSC → Settings → Users & permissions → Add user (service account email, Full)
  5. export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
  6. export GSC_SITE_URL=https://www.calcphi.com/
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

WAR_ROOM = Path("/Users/rahulbhattacharya/Desktop/war-room")
ROOT_DIR = Path(__file__).parent.parent.parent
SITEMAP  = ROOT_DIR / "_site" / "sitemap.xml"
OUT_DIR  = WAR_ROOM / "data" / "hercules"
LOG_PATH = OUT_DIR / "scan-log.jsonl"

SITE_URL = os.environ.get("GSC_SITE_URL", "https://www.calcphi.com/")


def check_credentials():
    adc_path = Path.home() / ".config" / "gcloud" / "application_default_credentials.json"
    if not adc_path.exists():
        print("\n❌  No Application Default Credentials found.\n")
        print("Run this command first:")
        print("  gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform\n")
        sys.exit(1)


def build_service():
    import google.auth
    from googleapiclient.discovery import build

    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return build("searchconsole", "v1", credentials=creds)


def get_sitemap_urls() -> list:
    """Parse sitemap.xml and return all calcphi.com URLs."""
    if not SITEMAP.exists():
        print(f"⚠  Sitemap not found at {SITEMAP} — fetching from live site")
        import urllib.request
        try:
            with urllib.request.urlopen("https://www.calcphi.com/sitemap.xml", timeout=10) as r:
                content = r.read().decode()
        except Exception as e:
            print(f"❌  Could not fetch sitemap: {e}")
            return []
    else:
        content = SITEMAP.read_text()

    import re
    urls = re.findall(r"<loc>(https://www\.calcphi\.com[^<]*)</loc>", content)
    return [u for u in urls if not any(x in u for x in ["/sign-in", "/sign-up", "/_next", "/api/"])]


def fetch_url_inspection(service, url: str) -> dict:
    """Run URL Inspection API for a single URL."""
    try:
        result = service.urlInspection().index().inspect(body={
            "inspectionUrl": url,
            "siteUrl": SITE_URL,
        }).execute()
        r = result.get("inspectionResult", {})
        idx = r.get("indexStatusResult", {})
        return {
            "url": url.replace(SITE_URL.rstrip("/"), ""),
            "market": "india" if "/india/" in url else "australia" if "/australia/" in url else "global",
            "category": _map_category(idx.get("coverageState", "")),
            "coverageState": idx.get("coverageState", "UNKNOWN"),
            "lastCrawlDate": idx.get("lastCrawlTime", "")[:10] if idx.get("lastCrawlTime") else None,
            "googleCanonical": idx.get("googleCanonical", "").replace(SITE_URL.rstrip("/"), "") or None,
            "robotsTxtBlocked": idx.get("robotsTxtState", "") == "DISALLOWED",
            "indexingAllowed": idx.get("indexingState", "") != "INDEXING_BLOCKED_BY_META_TAG",
            "issues": _extract_issues(idx),
            "lastChecked": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }
    except Exception as e:
        return {
            "url": url.replace(SITE_URL.rstrip("/"), ""),
            "market": "india" if "/india/" in url else "australia" if "/australia/" in url else "global",
            "category": "UNKNOWN",
            "coverageState": "UNKNOWN",
            "lastCrawlDate": None,
            "googleCanonical": None,
            "robotsTxtBlocked": False,
            "indexingAllowed": True,
            "issues": [f"API error: {str(e)[:100]}"],
            "lastChecked": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }


def _map_category(state: str) -> str:
    s = state.lower()
    # Human-readable strings returned by URL Inspection API
    if "submitted and indexed" in s or ("indexed" in s and "not" not in s and "alternate" not in s and "duplicate" not in s):
        return "INDEXED"
    if any(x in s for x in ["not found", "404", "soft 404", "server error", "redirect error", "5xx"]):
        return "ERROR"
    if any(x in s for x in ["not indexed", "discovered", "crawled", "unknown to google", "unknown"]):
        return "NOT_INDEXED"
    if any(x in s for x in ["alternate", "duplicate", "blocked", "robots", "manual", "excluded"]):
        return "WARNING"
    return "NOT_INDEXED"  # safe default — better to investigate than to overclaim


def _extract_issues(idx: dict) -> list:
    issues = []
    state = idx.get("coverageState", "")
    if "DISCOVERED_CURRENTLY_NOT_INDEXED" in state:
        issues.append("Discovered but not yet crawled — add internal links or request indexing")
    elif "CRAWLED_CURRENTLY_NOT_INDEXED" in state:
        issues.append("Crawled but not indexed — content may be too thin or low E-E-A-T")
    elif "NOT_FOUND_404" in state:
        issues.append("Page returns 404 — add redirect or recreate content")
    elif "SOFT_404" in state:
        issues.append("Soft 404 — page returns 200 but content is too thin for Google to index")
    elif "ALTERNATE_PAGE" in state:
        google_canon = idx.get("googleCanonical", "")
        user_canon   = idx.get("userDeclaredCanonical", "")
        if google_canon and google_canon != user_canon:
            issues.append(f"Google selected different canonical: {google_canon}")
    elif "DUPLICATE_WITHOUT_CANONICAL" in state:
        issues.append("Duplicate detected without canonical tag — add canonical or differentiate content")
    if idx.get("robotsTxtState") == "DISALLOWED":
        issues.append("Blocked by robots.txt — check disallow rules")
    if idx.get("indexingState") == "INDEXING_BLOCKED_BY_META_TAG":
        issues.append("noindex meta tag detected — check if intentional")
    return issues


def fetch_search_analytics(service, days: int = 28) -> dict:
    """Fetch top queries from Search Analytics API."""
    end_date   = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)
    try:
        result = service.searchanalytics().query(
            siteUrl=SITE_URL,
            body={
                "startDate": str(start_date),
                "endDate":   str(end_date),
                "dimensions": ["query", "page"],
                "rowLimit": 150,
                "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}],
            },
        ).execute()

        rows = result.get("rows", [])
        queries = []
        totals  = {"clicks": 0, "impressions": 0}
        for row in rows:
            queries.append({
                "query":       row["keys"][0],
                "url":         row["keys"][1].replace(SITE_URL.rstrip("/"), ""),
                "clicks":      int(row.get("clicks", 0)),
                "impressions": int(row.get("impressions", 0)),
                "ctr":         round(row.get("ctr", 0), 4),
                "position":    round(row.get("position", 0), 1),
            })
            totals["clicks"]      += int(row.get("clicks", 0))
            totals["impressions"] += int(row.get("impressions", 0))

        avg_ctr      = totals["clicks"] / max(totals["impressions"], 1)
        avg_position = sum(r["position"] for r in queries) / max(len(queries), 1)

        return {
            "lastFetched": datetime.now(timezone.utc).isoformat(),
            "period":      f"last{days}days",
            "totals": {
                "clicks":      totals["clicks"],
                "impressions": totals["impressions"],
                "ctr":         round(avg_ctr, 4),
                "avgPosition": round(avg_position, 1),
            },
            "topQueries": queries,
        }
    except Exception as e:
        print(f"⚠  Search analytics error: {e}")
        return {}


def build_coverage(pages: list, sitemap_total: int) -> dict:
    from collections import Counter

    by_category = Counter(p["category"] for p in pages)
    by_state    = Counter(p["coverageState"] for p in pages)
    indexed     = by_category.get("INDEXED", 0)

    return {
        "lastFetched":  datetime.now(timezone.utc).isoformat(),
        "siteUrl":      SITE_URL,
        "sitemap":      {"submitted": sitemap_total, "indexed": indexed},
        "byCategory": {
            "INDEXED":     indexed,
            "NOT_INDEXED": by_category.get("NOT_INDEXED", 0),
            "ERROR":       by_category.get("ERROR", 0),
            "WARNING":     by_category.get("WARNING", 0),
        },
        "byState":     dict(by_state),
        "coveragePct": round(indexed / max(sitemap_total, 1) * 100, 1),
        "searchEngines": {
            "google": {"indexed": indexed, "lastChecked": datetime.now(timezone.utc).isoformat()},
            "bing":   {"indexed": 0, "lastChecked": ""},
            "yahoo":  {"indexed": 0, "lastChecked": ""},
        },
    }


def append_scan_log(pages: list, new_issues: int, resolved: int, scan_type: str = "full"):
    now     = datetime.now(timezone.utc)
    scan_id = now.strftime("%Y-%m-%dT%H%M%SZ")
    by_cat  = {cat: sum(1 for p in pages if p["category"] == cat) for cat in ["INDEXED", "NOT_INDEXED", "ERROR"]}
    entry   = {
        "scanId":         scan_id,
        "date":           now.strftime("%Y-%m-%d"),
        "type":           scan_type,
        "pagesChecked":   len(pages),
        "indexed":        by_cat["INDEXED"],
        "notIndexed":     by_cat["NOT_INDEXED"],
        "errors":         by_cat["ERROR"],
        "newIssues":      new_issues,
        "resolvedIssues": resolved,
        "source":         "gsc",
    }
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"  ✓ Scan log appended: {scan_id}")


def main():
    parser = argparse.ArgumentParser(description="Hercules GSC Data Fetcher")
    parser.add_argument("--all",       action="store_true", help="Full fetch (coverage + inspection + analytics)")
    parser.add_argument("--coverage",  action="store_true", help="Coverage + URL inspection only")
    parser.add_argument("--analytics", action="store_true", help="Search analytics only")
    parser.add_argument("--inspect",   action="store_true", help="URL inspection only")
    args = parser.parse_args()

    if not any([args.all, args.coverage, args.analytics, args.inspect]):
        parser.print_help()
        sys.exit(1)

    check_credentials()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    service = build_service()

    print(f"\n{'═'*60}")
    print(f"  Hercules GSC Fetcher  ·  {SITE_URL}")
    print(f"{'═'*60}\n")

    pages = []

    if args.all or args.coverage or args.inspect:
        urls = get_sitemap_urls()
        print(f"  Fetching URL inspection for {len(urls)} pages...")
        for i, url in enumerate(urls, 1):
            page = fetch_url_inspection(service, url)
            pages.append(page)
            cat = page["category"]
            print(f"  [{i:3}/{len(urls)}] {cat:12}  {page['url'][:60]}")
            time.sleep(0.5)  # GSC rate limit

        (OUT_DIR / "pages.json").write_text(json.dumps(pages, indent=2, ensure_ascii=False))
        print(f"\n  ✓ pages.json written ({len(pages)} pages)")

        coverage = build_coverage(pages, len(urls))
        (OUT_DIR / "coverage.json").write_text(json.dumps(coverage, indent=2))
        print(f"  ✓ coverage.json written")

    if args.all or args.analytics:
        print(f"\n  Fetching search analytics (last 28 days)...")
        perf = fetch_search_analytics(service)
        if perf:
            (OUT_DIR / "performance.json").write_text(json.dumps(perf, indent=2))
            print(f"  ✓ performance.json written ({len(perf.get('topQueries', []))} queries)")

    if pages:
        append_scan_log(pages, new_issues=0, resolved=0, scan_type="full" if args.all else "quick")

    print(f"\n  Next steps:")
    print(f"  1. cp data/hercules/ → already written to war-room directly")
    print(f"  2. cd {WAR_ROOM} && git add data/hercules/ && git commit -m 'Hercules: scan results' && git push")
    print(f"\n{'═'*60}\n")


if __name__ == "__main__":
    main()
