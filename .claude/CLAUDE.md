## AdSense Sentinel

The adsense-sentinel subagent audits calcphi.com for Google AdSense 
compliance. Scripts are in scripts/sentinel/. Reports land in 
reports/adsense/latest.json.

Trigger it by saying: "Run the AdSense Sentinel audit"

Do not suggest re-applying to AdSense until the agent 
reports adsense_ready: true.

If the SEO Orchestrator agent is present, it should read 
reports/adsense/latest.json after each run and surface the 
adsense_ready boolean and blocking_reasons as action items.

## Green Fixer (comprehensive — use this)

The green-fixer agent fixes ALL five dashboard metrics: page fails, dup clusters,
placeholders, anon author, and JS-dependent. It runs iteratively until everything
is green, asking the user for decisions it can't make automatically.

Trigger it by saying: "Run the Green Fixer"

Execution order:
1. Run `python3 scripts/sentinel/super_fixer.py` — handles EEAT patch (all pages),
   noindex true-dup blogs, placeholder exclusion, and re-scores. Full protocol
   in agents/green-fixer.md.
2. Read reports/adsense/action_items.json — lists remaining dup clusters and
   failing pages that need content differentiation or manual decisions.
3. For remaining dup clusters: write unique differentiating content sections
   for each page in the cluster (different examples, different angle, different
   regulatory detail), inject before the FAQ, re-run duplicates.py + report.py.
4. Repeat until near_duplicate_clusters ≤ 2 AND all other metrics are at target.
5. Ask the user before: merging pages, noindexing pages not in NOINDEX_PAIRS,
   or redirecting/removing content.

Do not suggest re-applying to AdSense until the sentinel reports adsense_ready: true.

## AdSense Fixer (legacy — for FAIL pages only)

The sentinel-fixer agent reads reports/adsense/latest.json and fixes 
every FAIL page in _site/ to get its score ≥ 70.

Trigger it by saying: "Run the AdSense Fixer"

Execution order (always follow this):
1. Run `python3 scripts/sentinel/fixer.py` — handles F1 (regulatory source 
   citations) and F2 (internal links) deterministically for all failing pages.
2. For pages still projecting FAIL after step 1, open each HTML file and 
   apply content fixes (word_count expansion, editorial_depth blocks, 
   noindex for stubs). Full protocol is in agents/sentinel-fixer.md.
3. Re-run scorer + report to verify: 
   python3 scripts/sentinel/scorer.py && 
   python3 scripts/sentinel/duplicates.py && 
   python3 scripts/sentinel/report.py
4. Report new pass rate and any pages still failing.

Do not suggest re-applying to AdSense until the sentinel reports adsense_ready: true.
