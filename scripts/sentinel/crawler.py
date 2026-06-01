"""
crawler.py — AdSense Sentinel
Fetches raw HTML and Playwright-rendered HTML for every URL in the sitemap.
Caches results so incremental runs only fetch new/changed pages.
"""

import hashlib
import json
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
import yaml
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
CACHE_RAW = ROOT_DIR / "cache" / "raw"
CACHE_RENDERED = ROOT_DIR / "cache" / "rendered"
URL_MAP_PATH = ROOT_DIR / "cache" / "url_map.json"
CONFIG_PATH = SCRIPT_DIR / "config.yaml"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def url_slug(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


def get_sitemap_urls(sitemap_url: str) -> list[str]:
    resp = requests.get(sitemap_url, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml-xml")
    urls = [loc.get_text(strip=True) for loc in soup.find_all("loc")]
    # Follow nested sitemaps (sitemap index)
    expanded = []
    for url in urls:
        if url.endswith(".xml"):
            try:
                sub = requests.get(url, timeout=30)
                sub.raise_for_status()
                sub_soup = BeautifulSoup(sub.text, "lxml-xml")
                expanded.extend(
                    loc.get_text(strip=True) for loc in sub_soup.find_all("loc")
                )
            except Exception:
                pass
        else:
            expanded.append(url)
    return expanded


def fetch_raw(url: str) -> str:
    resp = requests.get(url, timeout=30, headers={"User-Agent": "AdSenseSentinel/1.0"})
    resp.raise_for_status()
    return resp.text


def fetch_rendered(url: str, page) -> str:
    page.goto(url, wait_until="networkidle", timeout=30000)
    return page.content()


def crawl():
    cfg = load_config()
    site_cfg = cfg["site"]
    delay = site_cfg["crawl_delay_seconds"]
    max_pages = site_cfg["max_pages"]

    CACHE_RAW.mkdir(parents=True, exist_ok=True)
    CACHE_RENDERED.mkdir(parents=True, exist_ok=True)

    print(f"Fetching sitemap: {site_cfg['sitemap']}")
    urls = get_sitemap_urls(site_cfg["sitemap"])
    urls = urls[:max_pages]
    print(f"Found {len(urls)} URLs (cap: {max_pages})")

    # Load existing url_map to enable incremental crawl
    if URL_MAP_PATH.exists():
        with open(URL_MAP_PATH) as f:
            url_map: dict = json.load(f)
    else:
        url_map = {}

    new_urls = [u for u in urls if u not in url_map]
    cached_urls = [u for u in urls if u in url_map]
    # Also skip if both cache files already exist
    skipped = []
    to_crawl = []
    for u in new_urls:
        slug = url_slug(u)
        if (CACHE_RAW / f"{slug}.html").exists() and (CACHE_RENDERED / f"{slug}.html").exists():
            url_map[u] = slug
            skipped.append(u)
        else:
            to_crawl.append(u)

    print(f"  Already cached: {len(cached_urls) + len(skipped)}")
    print(f"  To crawl: {len(to_crawl)}")

    if not to_crawl:
        print("Nothing new to crawl.")
        with open(URL_MAP_PATH, "w") as f:
            json.dump(url_map, f, indent=2)
        return url_map

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="AdSenseSentinel/1.0",
            java_script_enabled=True,
        )
        page = context.new_page()

        for url in tqdm(to_crawl, desc="Crawling"):
            slug = url_slug(url)
            raw_path = CACHE_RAW / f"{slug}.html"
            rendered_path = CACHE_RENDERED / f"{slug}.html"

            try:
                # Raw (no JS)
                raw_html = fetch_raw(url)
                raw_path.write_text(raw_html, encoding="utf-8")

                # Rendered (with JS)
                rendered_html = fetch_rendered(url, page)
                rendered_path.write_text(rendered_html, encoding="utf-8")

                url_map[url] = slug
            except Exception as e:
                print(f"\n  ERROR {url}: {e}")

            time.sleep(delay)

        browser.close()

    with open(URL_MAP_PATH, "w") as f:
        json.dump(url_map, f, indent=2)

    print(f"Crawl complete. url_map saved ({len(url_map)} pages).")
    return url_map


if __name__ == "__main__":
    crawl()
