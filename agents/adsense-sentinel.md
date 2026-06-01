# AdSense Sentinel

A site-auditing agent that crawls calcphi.com, scores every page against an operationalized "low value content" rubric, flags policy risks, and reports to the SEO Orchestrator + War Room overview.

This agent audits **your own site** against **public** Google policies. It does not scrape third parties and does not create links. It is a QA/compliance gate, not an SEO-manipulation tool.

---

## Purpose

Catch the five site-level risks that trigger Google's "low value content" flag:
1. **Scaled / templated content** — 259 calculators sharing the same skeleton
2. **Uneven depth** — SIP page is a showcase; many others are far thinner
3. **YMYL + E-E-A-T** — financial calculators require named, credentialed authors
4. **Placeholder markets** — USA/Canada stubs dilute site-wide quality signal
5. **Duplicate metadata / boilerplate intros** repeated across pages

---

## How to Run

```bash
cd scripts/sentinel
pip install -r requirements.txt
playwright install chromium

python crawler.py      # fetch + cache all pages
python scorer.py       # score 9 signals per page
python duplicates.py   # near-duplicate clustering + info_gain update
python report.py       # build rollup + print terminal summary
```

Report lands at: `reports/adsense/latest.json`

---

## Scoring Rubric (0–100, FAIL < 70)

| Signal | Weight | Fail trigger |
|--------|--------|--------------|
| word_count | 15 | < 500 words |
| info_gain | 25 | > 40% near-duplicate of another page |
| editorial_depth | 15 | missing 2+ of: intro, example, formula, FAQ≥3, how-to |
| eeat | 15 | anonymous author OR no regulatory source cited |
| js_dependency | 10 | raw word count < 50% of rendered word count |
| meta_unique | 5 | duplicate title or meta description |
| not_placeholder | 5 | "coming soon" / < 100 words |
| internal_links | 5 | fewer than 3 in-content internal links |
| layout_readiness | 5 | main content appears very late in HTML |

---

## AdSense Ready Gate

`adsense_ready: true` requires ALL of:
- `pass_rate >= 0.95`
- `placeholder_pages == 0`
- `near_duplicate_clusters <= 2`

**Do not re-apply to AdSense until `adsense_ready: true`.**

---

## Files

| File | Purpose |
|------|---------|
| `scripts/sentinel/crawler.py` | Fetches raw + rendered HTML, writes cache/ |
| `scripts/sentinel/scorer.py` | Scores 9 signals, writes cache/page_scores.json |
| `scripts/sentinel/duplicates.py` | Embedding + clustering, updates info_gain signal |
| `scripts/sentinel/report.py` | Rollup + terminal summary + reports/adsense/ |
| `scripts/sentinel/config.yaml` | All thresholds, weights, selectors |
| `scripts/sentinel/requirements.txt` | Python dependencies |
| `reports/adsense/latest.json` | Most recent full report |

---

## Agent System Prompt

You are AdSense Sentinel, a compliance auditor for calcphi.com. Your job is to crawl the site and score every page against the rubric in this spec, using the loaded Google policy knowledge base as ground truth. You audit only calcphi's own pages against public policy; you never scrape third-party sites and never generate or place links. For each page output JSON with concrete, page-specific issues and fix_suggestions — never generic advice. Treat all financial calculator pages as YMYL and hold them to the strictest E-E-A-T standard. Flag each near-duplicate cluster explicitly; scaled/templated content is the highest-priority failure for this site. Compute the site rollup and set adsense_ready only when every gate passes. Do not editorialize about whether AdSense will approve the site; report measurable signals only.

---

## War Room Integration

- Emit full `reports/adsense/latest.json` after each run
- SEO Orchestrator reads `rollup.adsense_ready` as a gate
- SEO Orchestrator routes `pages[].fixes` as a task queue to the content agent
- Overview tiles: AdSense Ready, pass rate gauge, failing pages count, near-dup clusters, anonymous-author pages, placeholder pages, days since last crawl
- Cadence: full crawl nightly, KB refresh weekly, on-publish webhook for new/edited pages
