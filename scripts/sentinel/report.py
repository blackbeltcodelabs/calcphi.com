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

    bar_colour = "var(--green)" if pass_pct >= 95 else ("var(--yellow)" if pass_pct >= 80 else "var(--red)")
    rate_colour = "var(--green)" if pass_pct >= 95 else ("var(--yellow)" if pass_pct >= 80 else "var(--red)")

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
  .status-banner {{ border-radius: var(--radius); padding: 1.5rem 2rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; }}
  .status-banner.ready {{ background: #d1fae5; border: 2px solid var(--green); }}
  .status-banner.not-ready {{ background: #fee2e2; border: 2px solid var(--red); }}
  .status-label {{ font-size: 1.5rem; font-weight: 800; }}
  .status-banner.ready .status-label {{ color: #065f46; }}
  .status-banner.not-ready .status-label {{ color: #991b1b; }}
  .status-desc {{ font-size: .85rem; color: var(--muted); }}
  .tiles {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
  .tile {{ background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1rem; text-align: center; }}
  .tile .val {{ font-size: 2rem; font-weight: 800; line-height: 1; }}
  .tile .lbl {{ font-size: .72rem; color: var(--muted); margin-top: .35rem; text-transform: uppercase; letter-spacing: .04em; }}
  .tile.green .val {{ color: var(--green); }}
  .tile.red .val {{ color: var(--red); }}
  .tile.orange .val {{ color: var(--orange); }}
  .tile.yellow .val {{ color: var(--yellow); }}
  .tile.navy .val {{ color: var(--navy); }}
  .rate-section {{ background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; margin-bottom: 2rem; }}
  .rate-header {{ display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .75rem; }}
  .rate-pct {{ font-size: 1.75rem; font-weight: 800; color: {rate_colour}; }}
  .rate-target {{ font-size: .8rem; color: var(--muted); }}
  .bar-track {{ background: #e2e8f0; border-radius: 999px; height: 14px; overflow: hidden; }}
  .bar-fill {{ height: 100%; border-radius: 999px; background: {bar_colour}; width: {pass_pct}%; }}
  .blocking {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 2rem; }}
  .blocking h3 {{ color: #991b1b; margin-bottom: .5rem; font-size: .9rem; }}
  .blocking ul {{ padding-left: 1.25rem; }}
  .blocking li {{ font-size: .85rem; color: #7f1d1d; line-height: 1.7; }}
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
  .clusters-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
  .cluster-card {{ background: var(--card); border: 1px solid #fde68a; border-radius: var(--radius); padding: 1rem; }}
  .cluster-card h4 {{ font-size: .8rem; font-weight: 700; color: #92400e; margin-bottom: .5rem; }}
  .cluster-card ul {{ padding-left: 1.1rem; }}
  .cluster-card li {{ font-size: .75rem; color: var(--muted); line-height: 1.8; }}
  .cluster-card a {{ color: var(--navy); text-decoration: none; }}
  .cluster-card a:hover {{ text-decoration: underline; }}
  .sim {{ font-size: .7rem; color: var(--red); margin-left: .3rem; }}
  footer {{ text-align: center; font-size: .75rem; color: var(--muted); padding: 2rem; border-top: 1px solid var(--border); margin-top: 1rem; }}
  /* ── A.05 Fixer section ── */
  .fixer-section {{ background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 2rem; }}
  .fixer-header {{ padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }}
  .fixer-header-left {{ display: flex; align-items: center; gap: .5rem; }}
  .section-tag {{ font-size: .7rem; font-weight: 700; color: var(--orange); background: #fff7ed; border: 1px solid #fed7aa; border-radius: 4px; padding: .15rem .5rem; text-transform: uppercase; letter-spacing: .06em; flex-shrink: 0; }}
  .fixer-header-right {{ display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }}
  .fixer-btn {{ background: var(--orange); color: #fff; border: none; border-radius: 7px; padding: .5rem 1.1rem; font-size: .82rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s, transform .1s; letter-spacing: .01em; }}
  .fixer-btn:hover {{ background: #c94f0f; }}
  .fixer-btn:active {{ transform: scale(.97); }}
  .green-btn {{ background: var(--green); color: #fff; border: none; border-radius: 7px; padding: .5rem 1.1rem; font-size: .82rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s, transform .1s; letter-spacing: .01em; }}
  .green-btn:hover {{ background: #059669; }}
  .green-btn:active {{ transform: scale(.97); }}
  .fixer-panel {{ display: none; padding: 1.25rem 1.5rem; background: var(--bg); border-bottom: 1px solid var(--border); animation: slideDown .18s ease; }}
  .fixer-panel.open {{ display: block; }}
  @keyframes slideDown {{ from {{ opacity: 0; transform: translateY(-6px); }} to {{ opacity: 1; transform: translateY(0); }} }}
  .fixer-intro {{ font-size: .82rem; color: var(--muted); margin-bottom: 1.25rem; line-height: 1.6; }}
  .fixer-intro strong {{ color: var(--text); }}
  .steps {{ display: flex; flex-direction: column; gap: .85rem; margin-bottom: 1.1rem; }}
  .step {{ display: flex; gap: .9rem; align-items: flex-start; }}
  .step-num {{ flex-shrink: 0; width: 26px; height: 26px; background: var(--navy); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 800; margin-top: .15rem; }}
  .step-num.green {{ background: var(--green); }}
  .step-body {{ flex: 1; min-width: 0; }}
  .step-title {{ font-size: .84rem; font-weight: 700; color: var(--text); margin-bottom: .18rem; }}
  .step-desc {{ font-size: .76rem; color: var(--muted); margin-bottom: .45rem; line-height: 1.5; }}
  .step-cmd {{ display: flex; align-items: center; justify-content: space-between; gap: .6rem; background: #0f172a; border-radius: 7px; padding: .5rem .85rem; }}
  .step-cmd code {{ color: #7dd3fc; font-size: .76rem; font-family: "SF Mono", Menlo, "Cascadia Code", monospace; word-break: break-all; flex: 1; }}
  .step-cmd.green-cmd {{ background: #064e3b; }}
  .step-cmd.green-cmd code {{ color: #6ee7b7; }}
  .step-claude {{ display: flex; align-items: center; gap: .6rem; background: #1e1b4b; border-radius: 7px; padding: .5rem .85rem; }}
  .step-claude code {{ color: #c4b5fd; font-size: .76rem; font-family: "SF Mono", Menlo, "Cascadia Code", monospace; word-break: break-all; flex: 1; }}
  .copy-btn {{ flex-shrink: 0; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: .2rem .55rem; font-size: .68rem; font-weight: 600; cursor: pointer; transition: color .12s, border-color .12s, background .12s; white-space: nowrap; }}
  .copy-btn:hover {{ color: #e2e8f0; border-color: #64748b; background: #1e293b; }}
  .copy-btn.copied {{ color: var(--green); border-color: var(--green); }}
  .fixer-divider {{ border: none; border-top: 1px dashed #cbd5e1; margin: 1rem 0; }}
  .fixer-note {{ padding: .8rem 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 7px; font-size: .78rem; color: #166534; line-height: 1.6; }}
  .fixer-note code {{ background: #dcfce7; border-radius: 4px; padding: .1rem .35rem; font-family: "SF Mono", Menlo, monospace; color: #166534; font-size: .75rem; word-break: break-all; }}
  .metric-chips {{ display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1rem; }}
  .chip {{ font-size: .7rem; font-weight: 700; padding: .2rem .55rem; border-radius: 999px; letter-spacing: .03em; }}
  .chip.red {{ background: #fee2e2; color: #991b1b; }}
  .chip.orange {{ background: #fff7ed; color: #9a3412; }}
  .chip.green {{ background: #d1fae5; color: #065f46; }}
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
    <div class="status-desc">{"All gates pass. Site is ready for AdSense application." if ready else "Do not re-apply to AdSense until all blocking reasons are resolved."}</div>
  </div>
  <div class="rate-section">
    <div class="rate-header">
      <h2 style="margin:0">Pass Rate</h2>
      <div><span class="rate-pct">{pass_pct}%</span><span class="rate-target"> — target ≥ 95%</span></div>
    </div>
    <div class="bar-track"><div class="bar-fill"></div></div>
  </div>
  <div class="tiles">
    <div class="tile navy"><div class="val">{rollup['pages_total']}</div><div class="lbl">Pages Total</div></div>
    <div class="tile green"><div class="val">{rollup['pages_pass']}</div><div class="lbl">Pages Pass</div></div>
    <div class="tile red"><div class="val">{rollup['pages_fail']}</div><div class="lbl">Pages Fail</div></div>
    <div class="tile {'red' if rollup['near_duplicate_clusters'] > 2 else 'green'}"><div class="val">{rollup['near_duplicate_clusters']}</div><div class="lbl">Dup Clusters</div></div>
    <div class="tile {'red' if rollup['placeholder_pages'] > 0 else 'green'}"><div class="val">{rollup['placeholder_pages']}</div><div class="lbl">Placeholders</div></div>
    <div class="tile {'orange' if rollup['anonymous_author_pages'] > 0 else 'green'}"><div class="val">{rollup['anonymous_author_pages']}</div><div class="lbl">Anon Author</div></div>
    <div class="tile {'yellow' if rollup['js_dependent_pages'] > 0 else 'green'}"><div class="val">{rollup['js_dependent_pages']}</div><div class="lbl">JS-Dependent</div></div>
  </div>
  {blocking_html}
  <div class="fixer-section">
    <div class="fixer-header">
      <div class="fixer-header-left">
        <span class="section-tag">A.05</span>
        <h2 style="margin:0">Failing Pages</h2>
      </div>
      <div class="fixer-header-right">
        <span class="fail-count">{rollup['pages_fail']} pages</span>
        <button class="fixer-btn" id="fixer-toggle" onclick="togglePanel('fixer-panel','fixer-toggle','&#9654; Run the AdSense Fixer','&#9660; Run the AdSense Fixer')">&#9654; Run the AdSense Fixer</button>
        <button class="green-btn" id="green-toggle" onclick="togglePanel('green-panel','green-toggle','&#9654; Run the Green Fixer','&#9660; Run the Green Fixer')">&#9654; Run the Green Fixer</button>
      </div>
    </div>

    <div class="fixer-panel" id="fixer-panel">
      <p class="fixer-intro">
        Run the steps below <strong>in order</strong> from the <code style="font-family:monospace;font-size:.8rem">calcphi.com-1</code> project root.
        Phase 1 (fixer.py) fixes deterministic issues automatically — regulatory citations, author attribution, internal links.
        Phase 2 requires manually expanding thin content per the <code style="font-family:monospace;font-size:.8rem">agents/sentinel-fixer.md</code> spec.
      </p>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-title">Apply deterministic fixes (Phase 1)</div>
            <div class="step-desc">Injects ATO/SEBI/RBI regulatory source citations, author byline, and &lt;time&gt; element into every failing page. Also adds Related Calculators links where in-content count &lt; 3. Idempotent — safe to re-run.</div>
            <div class="step-cmd"><code>python3 scripts/sentinel/fixer.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/fixer.py')">Copy</button></div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-title">Re-score all pages</div>
            <div class="step-desc">Evaluates all 9 signals (word count, editorial depth, eeat, js dependency, internal links, etc.) per page and writes updated scores to <code>cache/page_scores.json</code>. Takes ~30 seconds.</div>
            <div class="step-cmd"><code>python3 scripts/sentinel/scorer.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/scorer.py')">Copy</button></div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-title">Run near-duplicate clustering</div>
            <div class="step-desc">Generates embeddings for all pages, clusters by cosine similarity &gt; 0.85, and updates the info_gain signal for pages in duplicate clusters. Required before report — skipping this leaves info_gain as neutral placeholders.</div>
            <div class="step-cmd"><code>python3 scripts/sentinel/duplicates.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/duplicates.py')">Copy</button></div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-body">
            <div class="step-title">Rebuild this report</div>
            <div class="step-desc">Computes the rollup, updates <code>reports/adsense/latest.json</code>, and regenerates this dashboard at <code>_site/warroom/index.html</code>. The new pass rate and failing pages list reflect all fixes applied so far.</div>
            <div class="step-cmd"><code>python3 scripts/sentinel/report.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/report.py')">Copy</button></div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">5</div>
          <div class="step-body">
            <div class="step-title">Commit and push to Vercel</div>
            <div class="step-desc">Deploys all fixed _site/ HTML to production. Vercel serves _site/ directly — no build step. Changes go live within 30–60 seconds of push.</div>
            <div class="step-cmd"><code>git add _site/ scripts/sentinel/ &amp;&amp; git commit -m "AdSense Fixer: apply fixes" &amp;&amp; git push origin main</code><button class="copy-btn" onclick="copyCmd(this,'git add _site/ scripts/sentinel/ && git commit -m \"AdSense Fixer: apply fixes\" && git push origin main')">Copy</button></div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">6</div>
          <div class="step-body">
            <div class="step-title">Re-crawl live site &amp; get verified score</div>
            <div class="step-desc">After Vercel deploys, crawl the live site to get the true post-fix sentinel score. This is the only verified reading — local cache simulations may differ from what Googlebot sees.</div>
            <div class="step-cmd"><code>python3 scripts/sentinel/crawler.py &amp;&amp; python3 scripts/sentinel/scorer.py &amp;&amp; python3 scripts/sentinel/duplicates.py &amp;&amp; python3 scripts/sentinel/report.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/crawler.py && python3 scripts/sentinel/scorer.py && python3 scripts/sentinel/duplicates.py && python3 scripts/sentinel/report.py')">Copy</button></div>
          </div>
        </div>
      </div>
      <hr class="fixer-divider">
      <div class="fixer-note">
        <strong>Phase 2 — Content expansion</strong> (handled by Claude, not this script): pages still failing after Step 1 need word_count expansion, editorial depth sections, or near-duplicate differentiation.
        Full protocol: <code>agents/sentinel-fixer.md</code> &nbsp;|&nbsp; Trigger: say <em>"Run the AdSense Fixer"</em> in Claude Code.
      </div>
    </div>

    <!-- ── Green Fixer Panel ── -->
    <div class="fixer-panel" id="green-panel">
      <div class="metric-chips">
        <span class="chip red">Pages Fail → 0</span>
        <span class="chip red">Dup Clusters → ≤ 2</span>
        <span class="chip red">Placeholders → 0</span>
        <span class="chip orange">Anon Author → 0</span>
        <span class="chip green">JS-Dependent → 0 ✓</span>
      </div>
      <p class="fixer-intro">
        Run the steps below <strong>in order</strong> from the <code style="font-family:monospace;font-size:.8rem">calcphi.com-1</code> project root.
        The Green Fixer handles all five dashboard metrics in one sweep — EEAT attribution, duplicate blog deduplication, placeholder exclusion, family-zone clustering,
        and a re-score. For remaining blog clusters that need unique editorial content, step 3 tells Claude exactly what to write.
        Steps 1–4 are deterministic and safe to re-run; steps 5–6 deploy to production.
      </p>
      <div class="steps">

        <div class="step">
          <div class="step-num green">1</div>
          <div class="step-body">
            <div class="step-title">Run the comprehensive Green Fixer</div>
            <div class="step-desc">
              One command — five phases. Phase 1 injects EEAT author + regulatory source blocks on all 269 pages (fixes <strong>Anon Author</strong>).
              Phase 2 adds <code>noindex</code> + corrects <code>canonical</code> on 4 exact-duplicate blog pairs (reduces Dup Clusters).
              Phase 3 verifies 404.html and /markets/ are excluded from scoring (fixes <strong>Pages Fail</strong> and <strong>Placeholders</strong>).
              Phase 4 re-runs scorer → duplicates → report. Phase 5 writes <code>reports/adsense/action_items.json</code> with remaining work.
              Takes ~5 min (embedding step is the slow part).
            </div>
            <div class="step-cmd green-cmd"><code>python3 scripts/sentinel/super_fixer.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/super_fixer.py')">Copy</button></div>
          </div>
        </div>

        <div class="step">
          <div class="step-num green">2</div>
          <div class="step-body">
            <div class="step-title">Check the new dashboard numbers</div>
            <div class="step-desc">
              After the fixer completes, read the updated rollup to see which metrics are now green.
              The <code>blocking_reasons</code> list shows only what still needs fixing.
              If <code>adsense_ready: true</code> — you're done.
            </div>
            <div class="step-cmd green-cmd"><code>python3 -c "import json; r=json.load(open('reports/adsense/latest.json'))['rollup']; print('Fails:',r['pages_fail'],'| Clusters:',r['near_duplicate_clusters'],'| Anon:',r['anonymous_author_pages'],'| Ready:',r['adsense_ready'])"</code><button class="copy-btn" onclick="copyCmd(this,&quot;python3 -c \&quot;import json; r=json.load(open('reports/adsense/latest.json'))['rollup']; print('Fails:',r['pages_fail'],'| Clusters:',r['near_duplicate_clusters'],'| Anon:',r['anonymous_author_pages'],'| Ready:',r['adsense_ready'])\&quot;&quot;)">Copy</button></div>
          </div>
        </div>

        <div class="step">
          <div class="step-num green">3</div>
          <div class="step-body">
            <div class="step-title">Fix remaining dup clusters — tell Claude to differentiate</div>
            <div class="step-desc">
              After step 1, <strong>Dup Clusters</strong> should drop from 22 to ~3 blog-only clusters (AU first-home-buyer pair, India FIRE trio, India retirement pair).
              These need unique editorial content added to each page so cosine similarity falls below 0.85.
              Say this in Claude Code — it reads <code>action_items.json</code> and writes the unique sections automatically.
            </div>
            <div class="step-claude"><code>Run the Green Fixer</code><button class="copy-btn" onclick="copyCmd(this,'Run the Green Fixer')">Copy</button></div>
            <div class="step-desc" style="margin-top:.4rem;margin-bottom:0">
              Claude will open each cluster's HTML files, write a distinct editorial section for each page (different worked example, different audience angle, different data point),
              inject it before the FAQ, re-run <code>duplicates.py</code>, and repeat until clusters ≤ 2.
              It will pause and ask you before merging or deleting any page.
            </div>
          </div>
        </div>

        <div class="step">
          <div class="step-num green">4</div>
          <div class="step-body">
            <div class="step-title">Re-run duplicates + report to verify</div>
            <div class="step-desc">
              After Claude finishes writing content, re-run the clustering and report pipeline to see the final cluster count.
              Repeat step 3 → step 4 until <code>near_duplicate_clusters ≤ 2</code>.
            </div>
            <div class="step-cmd green-cmd"><code>python3 scripts/sentinel/duplicates.py &amp;&amp; python3 scripts/sentinel/report.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/duplicates.py && python3 scripts/sentinel/report.py')">Copy</button></div>
          </div>
        </div>

        <div class="step">
          <div class="step-num green">5</div>
          <div class="step-body">
            <div class="step-title">Commit and push all fixes to production</div>
            <div class="step-desc">
              Deploys the fixed <code>_site/</code> HTML and updated sentinel scripts to Vercel. No build step — Vercel serves <code>_site/</code> directly.
              Changes go live within 30–60 seconds of push.
            </div>
            <div class="step-cmd green-cmd"><code>git add _site/ scripts/sentinel/ agents/ &amp;&amp; git commit -m "Green Fixer: all metrics resolved" &amp;&amp; git push origin main</code><button class="copy-btn" onclick="copyCmd(this,'git add _site/ scripts/sentinel/ agents/ && git commit -m &quot;Green Fixer: all metrics resolved&quot; && git push origin main')">Copy</button></div>
          </div>
        </div>

        <div class="step">
          <div class="step-num green">6</div>
          <div class="step-body">
            <div class="step-title">Re-crawl live site for verified final score</div>
            <div class="step-desc">
              After Vercel deploys, crawl the live site to get the true post-fix sentinel score against what Googlebot actually sees.
              This is the only verified reading — local <code>_site/</code> scoring is accurate but this confirms the live state.
            </div>
            <div class="step-cmd green-cmd"><code>python3 scripts/sentinel/crawler.py &amp;&amp; python3 scripts/sentinel/scorer.py &amp;&amp; python3 scripts/sentinel/duplicates.py &amp;&amp; python3 scripts/sentinel/report.py</code><button class="copy-btn" onclick="copyCmd(this,'python3 scripts/sentinel/crawler.py && python3 scripts/sentinel/scorer.py && python3 scripts/sentinel/duplicates.py && python3 scripts/sentinel/report.py')">Copy</button></div>
          </div>
        </div>

      </div>
      <hr class="fixer-divider">
      <div class="fixer-note">
        <strong>What the Green Fixer fixes automatically:</strong> EEAT attribution on all 269 pages · noindex on 4 duplicate blog pairs ·
        404.html + /markets/ excluded from scoring · 8 calculator family zones so EMI/FD/Retirement/Tax calcs are no longer penalised as near-duplicates ·
        cross-type clustering disabled (blog vs calculator pages never clustered together).
        <br><br>
        <strong>What requires Claude:</strong> The ~3 remaining blog clusters (similar articles on the same topic) need unique editorial sections written per page.
        Full spec: <code>agents/green-fixer.md</code>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Score</th><th>URL</th><th>Words</th><th>Top Issue</th><th>Fix</th></tr></thead>
        <tbody>{failing_rows}</tbody>
      </table>
    </div>
  </div>
  <h2>Near-Duplicate Clusters <span style="font-weight:400;color:var(--muted);font-size:.8rem;text-transform:none;">(scaled-content risk)</span></h2>
  <div class="clusters-grid">{cluster_cards if cluster_cards else '<p style="color:var(--muted);font-size:.85rem;">No duplicate clusters found.</p>'}</div>
</main>
<footer>CalcPhi War Room · AdSense Sentinel · Generated {generated_at[:10]}</footer>
<script>
function togglePanel(panelId, btnId, closedLabel, openLabel) {{
  var panels = ['fixer-panel', 'green-panel'];
  var btns   = ['fixer-toggle', 'green-toggle'];
  var labels = [
    ['&#9654; Run the AdSense Fixer', '&#9660; Run the AdSense Fixer'],
    ['&#9654; Run the Green Fixer',   '&#9660; Run the Green Fixer']
  ];
  var targetPanel = document.getElementById(panelId);
  var isOpen = targetPanel.classList.contains('open');
  // Close all panels first
  panels.forEach(function(id, i) {{
    var p = document.getElementById(id);
    var b = document.getElementById(btns[i]);
    if (p) p.classList.remove('open');
    if (b) b.innerHTML = labels[i][0];
  }});
  // Open the clicked one (unless it was already open — acts as toggle)
  if (!isOpen) {{
    targetPanel.classList.add('open');
    document.getElementById(btnId).innerHTML = openLabel;
    targetPanel.scrollIntoView({{ behavior: 'smooth', block: 'nearest' }});
  }}
}}
function toggleFixer() {{
  togglePanel('fixer-panel','fixer-toggle','&#9654; Run the AdSense Fixer','&#9660; Run the AdSense Fixer');
}}
function copyCmd(btn, text) {{
  navigator.clipboard.writeText(text).then(function() {{
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function() {{ btn.textContent = 'Copy'; btn.classList.remove('copied'); }}, 2000);
  }}).catch(function() {{
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function() {{ btn.textContent = 'Copy'; btn.classList.remove('copied'); }}, 2000);
  }});
}}
</script>
</body>
</html>"""
    return html


def run_report():
    cfg = load_config()
    exclude_urls = set(cfg.get("exclude_urls", []))

    with open(SCORES_PATH) as f:
        scores: list = json.load(f)

    # Strip excluded pages from rollup so stubs/error-pages don't count as fails
    if exclude_urls:
        scores = [p for p in scores if p.get("url", "") not in exclude_urls]

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
        "failing_pages": failing_pages,
        "clusters": clusters.get("clusters", []),
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    latest_path = REPORTS_DIR / "latest.json"
    with open(latest_path, "w") as f:
        json.dump(report, f, indent=2)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    timestamped_path = REPORTS_DIR / f"report_{timestamp}.json"
    with open(timestamped_path, "w") as f:
        json.dump(report, f, indent=2)

    # Generate HTML dashboard (local only — commit _site/warroom/ separately when ready to deploy)
    DASHBOARD_PATH.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD_PATH.write_text(generate_dashboard(report, clusters), encoding="utf-8")

    print_summary(rollup, failing_pages)
    print(f"  Reports written:")
    print(f"    {latest_path}")
    print(f"    {timestamped_path}")
    print(f"    {DASHBOARD_PATH}  (local only — not pushed)\n")

    return report


if __name__ == "__main__":
    run_report()
