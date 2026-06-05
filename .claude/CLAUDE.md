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

## AdSense Fixer

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
