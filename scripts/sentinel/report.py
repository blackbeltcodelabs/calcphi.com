"""
report.py — AdSense Sentinel
Reads page_scores.json + duplicate_clusters.json, computes the site rollup,
writes reports/adsense/latest.json + a timestamped copy, prints a clean
terminal summary, and generates _site/warroom/index.html dashboard.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import yaml

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
SCORES_PATH = ROOT_DIR / "cache" / "page_scores.json"
CLUSTERS_PATH = ROOT_DIR / "cache" / "duplicate_clusters.json"
REPORTS_DIR = ROOT_DIR / "reports" / "adsense"
DASHBOARD_PATH = ROOT_DIR / "_site" / "warroom" / "index.html"
CONFIG_PATH = SCRIPT_DIR / "config.yaml"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def build_rollup(scores: list, clusters: dict, cfg: dict) -> dict:
    thresholds = cfg["thresholds"]
    pages_total = len(scores)
    pages_pass = sum(1 for p in scores if p.get("status") == "PASS")
    pages_fail = sum(1 for p in scores if p.get("status") == "FAIL")
    pages_error = sum(1 for p in scores if p.get("status") == "ERROR")
    pass_rate = round(pages_pass / pages_total, 4) if pages_total > 0 else 0.0
    near_dup_clusters = clusters.get("total_clusters", 0)
    anonymous_author_pages = sum(1 for p in scores if not p.get("has_author", True))
    placeholder_pages = sum(1 for p in scores if p.get("is_placeholder", False))
    js_dependent_pages = sum(1 for p in scores if p.get("is_js_dependent", False))

    blocking_reasons = []
    if pass_rate < thresholds["min_pass_rate"]:
        blocking_reasons.append(f"pass_rate={pass_rate:.1%} < {thresholds['min_pass_rate']:.0%} required")
    if placeholder_pages > 0:
        blocking_reasons.append(f"{placeholder_pages} placeholder page(s) must be removed or developed")
    if near_dup_clusters > thresholds["max_dup_clusters"]:
        blocking_reasons.append(f"{near_dup_clusters} near-duplicate cluster(s) > allowed {thresholds['max_dup_clusters']}")

    return {
        "pages_total": pages_total,
        "pages_pass": pages_pass,
        "pages_fail": pages_fail,
        "pages_error": pages_error,
        "pass_rate": pass_rate,
        "near_duplicate_clusters": near_dup_clusters,
        "anonymous_author_pages": anonymous_author_pages,
        "placeholder_pages": placeholder_pages,
        "js_dependent_pages": js_dependent_pages,
        "adsense_ready": len(blocking_reasons) == 0,
        "blocking_reasons": blocking_reasons,
    }


def print_summary(rollup: dict, failing_pages: list):
    sep = "─" * 60
    print(f"\n{BOLD}{sep}{RESET}")
    print(f"{BOLD}  AdSense Sentinel — Site Report{RESET}")
    print(f"{BOLD}{sep}{RESET}")
    ready_str = f"{GREEN}{BOLD}✅  READY{RESET}" if rollup["adsense_ready"] else f"{RED}{BOLD}❌  NOT READY{RESET}"
    print(f"\n  AdSense Ready:  {ready_str}")
    pct = rollup["pass_rate"] * 100
    bar = "█" * int(pct / 2) + "░" * (50 - int(pct / 2))
    col = GREEN if pct >= 95 else (YELLOW if pct >= 80 else RED)
    print(f"\n  Pass Rate:  {col}{pct:.1f}%{RESET}  [{bar}]")
    print(f"\n  Pages total:        {rollup['pages_total']}")
    print(f"  Pages PASS:         {GREEN}{rollup['pages_pass']}{RESET}")
    print(f"  Pages FAIL:         {RED}{rollup['pages_fail']}{RESET}")
    print(f"\n  Near-dup clusters:  {rollup['near_duplicate_clusters']}")
    print(f"  Anonymous-author:   {rollup['anonymous_author_pages']}")
    print(f"  Placeholder pages:  {rollup['placeholder_pages']}")
    print(f"  JS-dependent:       {rollup['js_dependent_pages']}")
    if rollup["blocking_reasons"]:
        print(f"\n  {RED}{BOLD}Blocking Reasons:{RESET}")
        for r in rollup["blocking_reasons"]:
            print(f"    • {r}")
    if failing_pages:
        print(f"\n{BOLD}  Top 10 Failing Pages{RESET}")
        print(f"  {sep[:56]}")
        for i, p in enumerate(failing_pages[:10], 1):
            issue = p["issues"][0] if p.get("issues") else "—"
            url = p["url"].replace("https://www.calcphi.com", "")
            print(f"  {i:2}. [{RED}{p['score']:3d}{RESET}]  {url}")
            print(f"       ↳ {YELLOW}{issue[:90]}{RESET}")
    print(f"\n{BOLD}{sep}{RESET}\n")


# ---------------------------------------------------------------------------
# HTML dashboard
# ---------------------------------------------------------------------------

def generate_dashboard(report: dict, clusters: dict):
    rollup = report["rollup"]
    pages = report["pages"]
    generated_at = report["generated_at"]
    failing = sorted([p for p in pages if p.get("status") == "FAIL"], key=lambda x: x.get("score", 0))
    cluster_list = clusters.get("clusters", [])

    ready = rollup["adsense_ready"]
    pass_pct = round(rollup["pass_rate"] * 100, 1)
    ready_class = "ready" if ready else "not-ready"
    ready_label = "✅ READY" if ready else "❌ NOT READY"

    blocking_html = ""
    if rollup["blocking_reasons"]:
        items = "".join(f"<li>{r}</li>" for r in rollup["blocking_reasons"])
        blocking_html = f'<div class="blocking"><h3>Blocking Reasons</h3><ul>{items}</ul></div>'

    def score_class(s):
        if s >= 70: return "pass"
        if s >= 50: return "warn"
        return "fail"

    failing_rows = ""
    for p in failing[:50]:
        url = p["url"].replace("https://www.calcphi.com", "")
        issue = (p["issues"][0] if p.get("issues") else "—")[:120]
        fix = (p["fixes"][0] if p.get("fixes") else "—")[:120]
        sc = p.get("score", 0)
        failing_rows += f"""
        <tr>
          <td><span class="score-badge {score_class(sc)}">{sc}</span></td>
          <td><a href="{p['url']}" target="_blank">{url}</a></td>
          <td>{p.get('word_count', 0)}</td>
          <td class="issue-cell">{issue}</td>
          <td class="fix-cell">{fix}</td>
        </tr>"""

    cluster_cards = ""
    for i, cluster in enumerate(cluster_list[:20], 1):
        urls = "".join(
            f'<li><a href="{c["url"]}" target="_blank">{c["url"].replace("https://www.calcphi.com","")}</a>'
            f' <span class="sim">sim={c["max_similarity"]:.2f}</span></li>'
            for c in cluster
        )
        cluster_cards += f'<div class="cluster-card"><h4>Cluster {i} — {len(cluster)} pages</h4><ul>{urls}</ul></div>'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CalcPhi War Room — AdSense Sentinel</title>
<style>
  :root {{
    --navy: #1a3d6e;
    --orange: #e8611a;
    --green: #10b981;
    --red: #ef4444;
    --yellow: #f59e0b;
    --bg: #f8fafc;
    --card: #ffffff;
    --border: #e2e8f0;
    --text: #0f172a;
    --muted: #64748b;
    --radius: 10px;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }}
  header {{ background: var(--navy); color: #fff; padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between; }}
  header h1 {{ font-size: 1.2rem; font-weight: 700; letter-spacing: .02em; }}
  header .subtitle {{ font-size: .8rem; opacity: .7; }}
  .generated {{ font-size: .75rem; opacity: .6; }}
  main {{ max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; }}
  h2 {{ font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: .05em; }}
  h3 {{ font-size: .9rem; font-weight: 600; margin-bottom: .5rem; }}

  /* Status banner */
  .status-banner {{ border-radius: var(--radius); padding: 1.5rem 2rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; }}
  .status-banner.ready {{ background: #d1fae5; border: 2px solid var(--green); }}
  .status-banner.not-ready {{ background: #fee2e2; border: 2px solid var(--red); }}
  .status-label {{ font-size: 1.5rem; font-weight: 800; }}
  .status-banner.ready .status-label {{ color: #065f46; }}
  .status-banner.not-ready .status-label {{ color: #991b1b; }}
  .status-desc {{ font-size: .85rem; color: var(--muted); }}

  /* Tiles */
  .tiles {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
  .tile {{ background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1rem; text-align: center; }}
  .tile .val {{ font-size: 2rem; font-weight: 800; line-height: 1; }}
  .tile .lbl {{ font-size: .72rem; color: var(--muted); margin-top: .35rem; text-transform: uppercase; letter-spacing: .04em; }}
  .tile.green .val {{ color: var(--green); }}
  .tile.red .val {{ color: var(--red); }}
  .tile.orange .val {{ color: var(--orange); }}
  .tile.yellow .val {{ color: var(--yellow); }}
  .tile.navy .val {{ color: var(--navy); }}

  /* Pass rate bar */
  .rate-section {{ background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; margin-bottom: 2rem; }}
  .rate-header {{ display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .75rem; }}
  .rate-pct {{ font-size: 1.75rem; font-weight: 800; color: {"var(--green)" if pass_pct >= 95 else ("var(--yellow)" if pass_pct >= 80 else "var(--red)") }; }}
  .rate-target {{ font-size: .8rem; color: var(--muted); }}
  .bar-track {{ background: #e2e8f0; border-radius: 999px; height: 14px; overflow: hidden; }}
  .bar-fill {{ height: 100%; border-radius: 999px; background: {"var(--green)" if pass_pct >= 95 else ("var(--yellow)" if pass_pct >= 80 else "var(--red)") }; width: {pass_pct}%; transition: width .6s ease; }}

  /* Blocking */
  .blocking {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 2rem; }}
  .blocking h3 {{ color: #991b1b; margin-bottom: .5rem; }}
  .blocking ul {{ padding-left: 1.25rem; }}
  .blocking li {{ font-size: .85rem; color: #7f1d1d; line-height: 1.7; }}

  /* Table */
  .table-section {{ background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 2rem; }}
  .table-header {{ padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }}
  .fail-count {{ font-size: .8rem; background: #fee2e2; color: #991b1b; padding: .2rem .6rem; border-radius: 999px; font-weight: 600; }}
  .table-wrap {{ overflow-x: auto; }}
  table {{ width: 100%; border-collapse: collapse; font-size: .8rem; }}
  th {{ background: #f8fafc; padding: .6rem .75rem; text-align: left; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); border-bottom: 1px solid var(--border); white-space: nowrap; }}
  td {{ padding: .55rem .75rem; border-bottom: 1px solid var(--border); vertical-align: top; }}
  tr:last-child td {{ border-bottom: none; }}
  tr:hover td {{ background: #f8fafc; }}
  td a {{ color: var(--navy); text-decoration: none; word-break: break-all; }}
  td a:hover {{ text-decoration: underline; }}
  .score-badge {{ display: inline-block; padding: .15rem .5rem; border-radius: 6px; font-weight: 700; font-size: .8rem; min-width: 2.5rem; text-align: center; }}
  .score-badge.pass {{ background: #d1fae5; color: #065f46; }}
  .score-badge.warn {{ background: #fef3c7; color: #92400e; }}
  .score-badge.fail {{ background: #fee2e2; color: #991b1b; }}
  .issue-cell {{ color: var(--red); font-size: .75rem; max-width: 280px; }}
  .fix-cell {{ color: #0369a1; font-size: .75rem; max-width: 280px; }}

  /* Clusters */
  .clusters-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
  .cluster-card {{ background: var(--card); border: 1px solid #fde68a; border-radius: var(--radius); padding: 1rem; }}
  .cluster-card h4 {{ font-size: .8rem; font-weight: 700; color: #92400e; margin-bottom: .5rem; }}
  .cluster-card ul {{ padding-left: 1.1rem; }}
  .cluster-card li {{ font-size: .75rem; color: var(--muted); line-height: 1.8; }}
  .cluster-card a {{ color: var(--navy); text-decoration: none; }}
  .cluster-card a:hover {{ text-decoration: underline; }}
  .sim {{ font-size: .7rem; color: var(--red); margin-left: .3rem; }}

  footer {{ text-align: center; font-size: .75rem; color: var(--muted); padding: 2rem; border-top: 1px solid var(--border); margin-top: 1rem; }}
</style>
</head>
<body>

<header>
  <div>
    <div class="subtitle">WAR ROOM</div>
    <h1>CalcPhi — AdSense Sentinel</h1>
  </div>
  <div class="generated">Last audit: {generated_at[:19].replace("T", " ")} UTC</div>
</header>

<main>

  <div class="status-banner {ready_class}">
    <div class="status-label">{ready_label}</div>
    <div class="status-desc">
      {"All gates pass. Site is ready for AdSense application." if ready else
       "Do not re-apply to AdSense until all blocking reasons are resolved."}
    </div>
  </div>

  <div class="rate-section">
    <div class="rate-header">
      <h2 style="margin:0">Pass Rate</h2>
      <div>
        <span class="rate-pct">{pass_pct}%</span>
        <span class="rate-target"> — target ≥ 95%</span>
      </div>
    </div>
    <div class="bar-track"><div class="bar-fill"></div></div>
  </div>

  <div class="tiles">
    <div class="tile navy"><div class="val">{rollup['pages_total']}</div><div class="lbl">Pages Total</div></div>
    <div class="tile green"><div class="val">{rollup['pages_pass']}</div><div class="lbl">Pages Pass</div></div>
    <div class="tile red"><div class="val">{rollup['pages_fail']}</div><div class="lbl">Pages Fail</div></div>
    <div class="tile {'red' if rollup['near_duplicate_clusters'] > 2 else 'green'}">
      <div class="val">{rollup['near_duplicate_clusters']}</div><div class="lbl">Dup Clusters</div>
    </div>
    <div class="tile {'red' if rollup['placeholder_pages'] > 0 else 'green'}">
      <div class="val">{rollup['placeholder_pages']}</div><div class="lbl">Placeholders</div>
    </div>
    <div class="tile {'orange' if rollup['anonymous_author_pages'] > 0 else 'green'}">
      <div class="val">{rollup['anonymous_author_pages']}</div><div class="lbl">Anon Author</div>
    </div>
    <div class="tile {'yellow' if rollup['js_dependent_pages'] > 0 else 'green'}">
      <div class="val">{rollup['js_dependent_pages']}</div><div class="lbl">JS-Dependent</div>
    </div>
  </div>

  {blocking_html}

  <div class="table-section">
    <div class="table-header">
      <h2 style="margin:0">Failing Pages</h2>
      <span class="fail-count">{rollup['pages_fail']} pages</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Score</th>
            <th>URL</th>
            <th>Words</th>
            <th>Top Issue</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>{failing_rows}</tbody>
      </table>
    </div>
  </div>

  <h2>Near-Duplicate Clusters <span style="font-weight:400;color:var(--muted);font-size:.8rem;text-transform:none;">(scaled-content risk)</span></h2>
  <div class="clusters-grid">{cluster_cards if cluster_cards else '<p style="color:var(--muted);font-size:.85rem;">No duplicate clusters found.</p>'}</div>

</main>

<footer>CalcPhi War Room · AdSense Sentinel · Generated {generated_at[:10]}</footer>

</body>
</html>"""
    return html


def run_report():
    cfg = load_config()

    with open(SCORES_PATH) as f:
        scores: list = json.load(f)

    if CLUSTERS_PATH.exists():
        with open(CLUSTERS_PATH) as f:
            clusters: dict = json.load(f)
    else:
        clusters = {"total_clusters": 0, "clusters": []}

    rollup = build_rollup(scores, clusters, cfg)
    failing_pages = sorted([p for p in scores if p.get("status") == "FAIL"], key=lambda p: p.get("score", 0))

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "site": cfg["site"]["base_url"],
        "rollup": rollup,
        "pages": scores,
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    latest_path = REPORTS_DIR / "latest.json"
    with open(latest_path, "w") as f:
        json.dump(report, f, indent=2)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    timestamped_path = REPORTS_DIR / f"report_{timestamp}.json"
    with open(timestamped_path, "w") as f:
        json.dump(report, f, indent=2)

    # Generate HTML dashboard
    DASHBOARD_PATH.parent.mkdir(parents=True, exist_ok=True)
    dashboard_html = generate_dashboard(report, clusters)
    DASHBOARD_PATH.write_text(dashboard_html, encoding="utf-8")

    print_summary(rollup, failing_pages)
    print(f"  Reports written:")
    print(f"    {latest_path}")
    print(f"    {timestamped_path}")
    print(f"    {DASHBOARD_PATH}\n")

    return report


if __name__ == "__main__":
    run_report()
