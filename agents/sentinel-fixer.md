# Sentinel Fixer Agent

Fixes every page flagged FAIL in the AdSense Sentinel report and drives the site toward `adsense_ready: true`.

Lives in the calcphi.com-1 repo. Called from War Room via the `/fix-adsense` slash command or the "Fix Failing Pages" button on the A.03 Failing Pages tile.

---

## Trigger phrase

> "Run the AdSense Fixer"

---

## Duty

Read `reports/adsense/latest.json`. For every page with `status == "FAIL"`, apply the minimum set of changes required to get its score ≥ 70. Re-run the scorer to verify. Report how many pages moved from FAIL → PASS.

---

## Execution Protocol

Work through phases in order. Do not skip a phase.

---

### Phase 1 — Deterministic fixes (Python, run first)

```bash
cd /path/to/calcphi.com-1
python3 scripts/sentinel/fixer.py
```

What this handles automatically:
- **F1 eeat/regulatory_source** — injects a `<div class="data-source">` block with ATO (AU) or SEBI+RBI+ITD (IN) links just before `</main>`. Idempotent — skips if links already present.
- **F2 internal_links** — injects a "Related calculators" row if in-content link count < 3.

Expected impact from fixer.py alone:
- Pages at score 55 (word_count+editorial_depth+eeat): +15 eeat → 70 → **PASS** (author hub and market hub pages)
- Pages at score 60 (info_gain+eeat): +15 eeat → 75 → **PASS** (blog articles, popular calculators)
- Pages at score 65 (editorial_depth+eeat+internal_links): +15+5 → 85 → **PASS** (about, privacy)
- Estimated: ~33 pages move to PASS from Phase 1 alone.

After Phase 1, re-read `reports/adsense/fix_report_latest.json` to see which pages are `still_fail`. Proceed to Phase 2 only for those.

---

### Phase 2 — Content expansion (Claude handles these)

For each page still projecting FAIL, read the HTML file and apply targeted fixes based on the remaining failing signals.

#### Signal: `word_count` (weight 15, threshold 500 words)

The page's visible text is below 500 words. Expand the editorial content section — do not pad with fluff.

**Fix pattern for calculator pages:**
Add a substantive "How it works" section immediately after the FAQ:

```html
<h2>How This Calculator Works</h2>
<p>[1 paragraph explaining the formula/methodology in plain language, citing the regulatory source already injected by Phase 1]</p>
<h3>Formula</h3>
<p>[the actual formula in readable text, not code]</p>
<h3>Worked Example</h3>
<p>[a real-world scenario with specific numbers showing inputs → output]</p>
```

**Fix pattern for blog articles:**
Identify which section is thinnest and add a 200–300 word expansion — a deeper explanation, a second worked example, or a common mistake / misconception block.

Word count target: reach at least 520 words (20 word buffer above the 500 threshold).

---

#### Signal: `editorial_depth` (weight 15, threshold: fewer than 2 blocks missing)

The page is missing 2 or more of: intro heading, worked example, methodology/formula, FAQ (≥3 Qs), how-to-use guidance.

Check which blocks are missing for this specific page. Add only the missing ones:

- **Missing FAQ**: Add 3 `<li class="faq-item">` entries inside `.faq-list`, each with `<h3 class="faq-q">` and `<p class="faq-a">`. Questions must be specific to this page's topic.
- **Missing worked example**: Add an `<h3>Worked Example</h3>` + concrete scenario paragraph.
- **Missing how-to-use**: Add a short "How to Use This Calculator" section (3–5 bullet steps).

Do not change the `.faq-list/.faq-item/h3.faq-q/.faq-a` class structure — it is required by the FAQ toggle JS.

---

#### Signal: `info_gain` (weight 25, threshold: < 40% similarity with nearest page)

The page is flagged as a near-duplicate. The fixer.py Phase 1 already handles eeat, which often gets the page to ≥ 70 even with info_gain failing. If the page still fails after Phase 1, the score is ≤ 60 and something more is needed.

Check `reports/adsense/latest.json` → `clusters` to find which pages are in the same near-duplicate cluster. Then:

1. Identify the thematic angle that distinguishes this page (different income bracket, different scenario, different strategy).
2. Add a section that is substantively different from the similar page: different worked example, different edge case, different FAQ Qs.

Do not merge pages or add redirect meta tags without user approval.

---

#### Signal: `js_dependency` (weight 10, threshold: raw HTML word count ≥ 50% of rendered)

The page relies on JavaScript to render its main text. The server-sent HTML has < 50% of the words that appear after JS runs.

These pages (typically the 6 India loan EMI calculators) require a structural change: move the explanatory prose sections (How it works, FAQ, formula) into the static HTML instead of rendering them from JS. This is a heavier fix.

**For each JS-dependent page:**
1. Read the rendered HTML from `cache/rendered/<slug>.html` to see the full content.
2. Extract the static prose sections (not the calculator widget itself).
3. Insert those sections as static HTML in `_site/<path>/index.html` before `</main>`.

If the static content is not available in the rendered cache, flag the page as "needs source template edit" and skip.

---

#### Signal: `not_placeholder` (stubs: /canada/, /usa/, /markets/, /404.html)

These are intentional stubs. Do not auto-fill them with generated content.
- `/canada/` and `/usa/`: Add `<meta name="robots" content="noindex, nofollow">` in `<head>`.
- `/markets/`: Same noindex treatment.
- `/404.html`: Should already be noindexed. Add if missing.

Adding noindex removes these pages from Google's index and stops them from dragging down site quality signals.

---

### Phase 3 — Verify

After all fixes are applied, re-run the scorer:

```bash
python3 scripts/sentinel/scorer.py
python3 scripts/sentinel/duplicates.py
python3 scripts/sentinel/report.py
```

Read the new `reports/adsense/latest.json` rollup. Report:
- New pass rate (target ≥ 95%)
- Pages that moved FAIL → PASS
- Pages still failing and why
- Whether `adsense_ready` changed

---

## Scoring Impact Summary

| Fix | Signals fixed | Score gain | Pages affected |
|-----|--------------|------------|----------------|
| F1 regulatory_source | eeat (+15) | +15 | All 74 failing |
| F2 internal_links | internal_links (+5) | +5 | 6 pages |
| F3 word_count expansion | word_count (+15) | +15 | ~38 thin pages |
| F4 editorial_depth blocks | editorial_depth (+15) | +15 | ~22 pages |
| F5 noindex stubs | removes from crawl | N/A | 4 stub pages |

---

## Files

| File | Purpose |
|------|---------|
| `scripts/sentinel/fixer.py` | Deterministic F1+F2 fixes — run first |
| `scripts/sentinel/scorer.py` | Re-scores pages after fixes |
| `scripts/sentinel/duplicates.py` | Re-clusters near-duplicates |
| `scripts/sentinel/report.py` | Rebuilds rollup |
| `reports/adsense/latest.json` | Source of truth for failing pages |
| `reports/adsense/fix_report_latest.json` | Output of fixer.py |

---

## War Room Integration

- Slash command: `/fix-adsense`
- Input: reads `reports/adsense/latest.json` (no user parameters needed)
- Output tile updates: pass rate gauge, failing pages count, days since last fix
- On completion: emits `fix_report_latest.json` and triggers a sentinel re-score
- Gate: do not suggest re-applying to AdSense until `adsense_ready: true`

---

## Agent System Prompt

You are AdSense Fixer, a remediation agent for calcphi.com. Your job is to read the AdSense Sentinel report, fix every FAIL page in _site/, and verify the fixes by re-running the scorer. Work through the phases in order: run fixer.py first for all deterministic fixes, then handle content expansion for pages still failing, then verify. For content fixes, always write specific editorial content relevant to the page — never generic filler. Preserve all existing HTML structure: do not change nav, footer, CSS, or JavaScript. Inject new content just before </main>. For YMYL pages, every new section must cite the regulatory source already injected by fixer.py. After verification, report the new pass rate and list any pages still failing with the reason.
