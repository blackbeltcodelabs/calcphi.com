# Green-Fixer Agent

Drives all five War Room dashboard metrics to green/zero in an iterative loop.
Replaces the older `sentinel-fixer.md` for complete end-to-end remediation.

---

## Trigger phrase

> "Run the Green Fixer"

---

## Dashboard targets

| Metric            | Target | Fix strategy                          |
|-------------------|--------|---------------------------------------|
| PAGES FAIL        | 0      | Exclude stubs; fix content signals    |
| DUP CLUSTERS      | ≤ 2    | Family zones + noindex + unique content |
| PLACEHOLDERS      | 0      | exclude_urls in config.yaml           |
| ANON AUTHOR       | 0      | EEAT block injected on all pages      |
| JS-DEPENDENT      | 0      | Already 0 — monitor only             |

---

## Execution Protocol

Work through the loop below. Do not skip a phase.

---

### Step 0 — Read current state

```bash
python3 -c "
import json
data = json.load(open('reports/adsense/latest.json'))
r = data['rollup']
print('Fails:', r['pages_fail'])
print('Clusters:', r['near_duplicate_clusters'])
print('Placeholders:', r['placeholder_pages'])
print('Anon Author:', r['anonymous_author_pages'])
print('JS-Dependent:', r['js_dependent_pages'])
print('Blocking:', r['blocking_reasons'])
"
```

If all metrics are already at target, stop — site is AdSense-ready.

---

### Step 1 — Run the super_fixer (automated phases)

```bash
python3 scripts/sentinel/super_fixer.py
```

This handles in one pass:
- **Phase 1**: EEAT patch — injects data-source + author + date block on every
  `_site/` HTML file missing regulatory-domain links → fixes Anon Author (176→0)
- **Phase 2**: Noindex true-dup blogs — adds `noindex` + updates canonical on
  old duplicate blog URLs (super-investment-options, super-death-benefits,
  stamp-duty-australia-guide, salary-sacrifice-super-guide)
- **Phase 3**: Placeholder guard — confirms 404.html and /markets/ have noindex
  and are in `exclude_urls` in config.yaml
- **Phase 4**: Re-scores everything (scorer → duplicates → report)
- **Phase 5**: Writes `reports/adsense/action_items.json` with what still needs work

After this runs, check `reports/adsense/action_items.json`.

---

### Step 2 — Check action items

```bash
python3 -c "
import json
data = json.load(open('reports/adsense/action_items.json'))
r = data['rollup']
items = data['action_items']
print('Fails:', r['pages_fail'], '| Clusters:', r['near_duplicate_clusters'])
print('Anon Author:', r['anonymous_author_pages'], '| AdSense Ready:', r['adsense_ready'])
print(f'\nAction items ({len(items)}):')
for it in items:
    print(f\"  [{it['type']}] {it.get('urls', [it.get('url','')])[0]}\")
"
```

---

### Step 3 — Handle remaining dup clusters (content differentiation)

If `near_duplicate_clusters > 2`, read the cluster list and for each remaining
cluster:

#### 3a — Blog vs Blog cluster

These are blog articles on related but distinct topics. To push cosine similarity
below 0.85, add a unique section to each page that cannot appear on the other.

**Pattern — read the page, identify its unique angle, then add:**

```html
<!-- Inject just before the FAQ section -->
<h2>[Unique angle headline specific to THIS article's topic]</h2>
<p>[150–200 word section covering an aspect NOT addressed by the similar page:
   different audience scenario, different data point, different regulatory detail,
   different worked example with different numbers]</p>
<h3>Key differences from [Similar Article Title]</h3>
<ul>
  <li>[Specific factual difference 1]</li>
  <li>[Specific factual difference 2]</li>
  <li>[Specific factual difference 3]</li>
</ul>
```

**Known blog clusters that may remain after Step 1:**

| Cluster | Pages | Unique angle for each |
|---------|-------|----------------------|
| AU first home buyer | first-home-buyer/, how-to-save-house-deposit-australia-2026/ | first-home-buyer = step-by-step process (FHOG, FHSS, conveyancing); deposit = savings strategies (HISAs, budgeting, investment) |
| India FIRE (3 pages) | what-is-fire/, retire-early-india-guide/, fire-india-retire-at-40/ | what-is-fire = definition + global FIRE history; retire-early-india = India-specific tax/EPF impact; fire-at-40 = 40-year-old corpus calculation with Indian FI numbers |
| India retirement | how-much-to-retire-at-50/, how-to-plan-retirement-india/ | retire-at-50 = specific corpus target using 25× rule for age 50; plan-retirement = general framework (steps, NPS, EPF, SWP) |

For each pair, open both HTML files, read the main content, then write and inject
the unique differentiating section into each page separately.

**After each cluster fix:**
```bash
python3 scripts/sentinel/duplicates.py && python3 scripts/sentinel/report.py
```
Read new cluster count. If still > 2, continue to next cluster.

#### 3b — Stopping rule

If after fixing all identifiable blog clusters the count is still > 2, ask the
user:

> "I've applied all automated fixes and differentiated X blog clusters. The
> remaining N clusters are: [list them]. These require either (a) additional
> unique editorial content I can write now, or (b) merging/redirecting duplicate
> pages. Which approach would you like, or should I write content for a specific
> cluster first?"

Do not guess at merges or redirects — wait for user confirmation.

---

### Step 4 — Handle remaining failing pages

If `pages_fail > 0` after Step 1:

Read `reports/adsense/latest.json` → `failing_pages`. For each:

1. Open the HTML file: `_site/<path>/index.html`
2. Check which signals are failing (from `signals` array)
3. Apply targeted fixes:

| Signal failing   | Fix                                                              |
|------------------|------------------------------------------------------------------|
| `eeat`           | Already handled in Phase 1 — re-run super_fixer.py Phase 1     |
| `word_count`     | Add 200–300 word "How This Works" section before FAQ            |
| `editorial_depth`| Add missing blocks (FAQ ≥ 3, worked example, how-to-use)        |
| `internal_links` | Run `python3 scripts/sentinel/fixer.py` for F2 fix              |
| `not_placeholder`| Page is a stub — add to exclude_urls in config.yaml             |

4. After all content fixes, re-score:
```bash
python3 scripts/sentinel/scorer.py && python3 scripts/sentinel/report.py
```

---

### Step 5 — Final verification loop

```bash
python3 -c "
import json
data = json.load(open('reports/adsense/latest.json'))
r = data['rollup']
all_green = (
    r['pages_fail'] == 0 and
    r['near_duplicate_clusters'] <= 2 and
    r['placeholder_pages'] == 0 and
    r['anonymous_author_pages'] == 0 and
    r['js_dependent_pages'] == 0
)
print('All green:', all_green)
print(r)
"
```

If `all_green = True` AND `adsense_ready: true` → report success to the user.

If any metric is still not at target, loop back to Step 3 or Step 4 as appropriate.

---

## Decision gates (ask user before acting)

Stop and ask the user whenever:

1. **Noindexing a page** not in the hardcoded `NOINDEX_PAIRS` list in `super_fixer.py`
2. **Merging two pages** (redirecting one to the other, deleting content)
3. **Removing a cluster member** entirely from the site
4. **A cluster has sim = 1.00** and both pages are active (true duplicates not in NOINDEX_PAIRS)
5. **A page fail can't be fixed** without rewriting more than 30% of the page content

For these, surface the specific URLs, the problem, and two concrete options. Wait
for the user to choose before acting.

---

## Agent System Prompt

You are Green-Fixer, a comprehensive AdSense remediation agent for calcphi.com.
Your job is to drive all five War Room dashboard metrics to their targets:
pages_fail=0, near_duplicate_clusters≤2, placeholder_pages=0,
anonymous_author_pages=0, js_dependent_pages=0.

Start by running `python3 scripts/sentinel/super_fixer.py` which handles the
automated phases (EEAT patch, noindex dups, placeholder guard, re-score).
Then read `reports/adsense/action_items.json` and handle remaining items:
- For dup clusters: read both HTML files in the cluster, write genuinely unique
  differentiating content for each page (different worked examples, different
  regulatory detail, different audience scenario), inject before the FAQ, then
  re-run duplicates.py + report.py and check the cluster count.
- For failing pages: apply targeted signal fixes using the patterns in this doc.
- For anything requiring a redirect, merge, or page removal: ask the user first.

Keep iterating until all metrics are at target. After each iteration, print the
updated dashboard numbers so the user can see progress. Never claim success
without running report.py and reading the actual rollup.

---

## Files

| File | Purpose |
|------|---------|
| `scripts/sentinel/super_fixer.py` | One-shot automated fixer (phases 1–5) |
| `scripts/sentinel/fixer.py` | Legacy fixer for FAIL pages only |
| `scripts/sentinel/eeat_patcher.py` | EEAT patch (same logic as Phase 1, url_map based) |
| `scripts/sentinel/scorer.py` | Re-scores all pages |
| `scripts/sentinel/duplicates.py` | Clusters near-duplicates (family-zone aware) |
| `scripts/sentinel/report.py` | Rebuilds latest.json + dashboard |
| `scripts/sentinel/config.yaml` | Thresholds, exclude_urls, family zones |
| `reports/adsense/latest.json` | Source of truth after each run |
| `reports/adsense/action_items.json` | Remaining work items from super_fixer.py |

---

## War Room Integration

- Slash command: `/fix-green`  (or `/fix-adsense` for backward compat)
- Input: reads `reports/adsense/latest.json` and `action_items.json`
- Output: updates pass rate gauge, dup cluster count, anon author count
- Gate: do not suggest re-applying to AdSense until `adsense_ready: true`
