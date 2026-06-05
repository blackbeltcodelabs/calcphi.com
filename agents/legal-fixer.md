# Legal Fixer Agent

Drives all Legal Room issues from red/orange → green by applying compliance fixes
to `_site/` HTML files and updating the war-room data. Mirrors the AdSense
Green-Fixer architecture exactly.

---

## Trigger phrase

> "Run the Legal Fixer"

---

## Issue targets

| Verdict | Count | Fix strategy |
|---------|-------|-------------|
| RED     | 8     | Auto-fixed by fixer.py (ASIC warnings, IRDAI disclaimers) |
| ORANGE  | 11    | Auto-fixed by fixer.py (text softening, PFRDA fix, IRDAI inject) |
| MANUAL  | 1     | AU tax rates blog — requires human verification against ATO |

---

## Execution Protocol

### Step 0 — Read current state

```bash
python3 -c "
import json
s = json.load(open('/Users/rahulbhattacharya/Desktop/war-room/data/legal/summary.json'))
print('Red:', s['red'], '| Orange:', s['orange'], '| Green:', s['green'])
print('Last scan:', s['lastScan'])
"
```

---

### Step 1 — Run the fixer (automated)

```bash
cd /Users/rahulbhattacharya/calcphi.com-1
python3 scripts/legal/fixer.py
```

**What this fixes automatically:**

| Pattern | Pages fixed |
|---------|------------|
| ASIC_CALC | Injects ASIC general advice warning above `calculator-widget` div on 5 AU calculator pages + stamp duty + mortgage |
| ASIC_BLOG | Injects ASIC warning box at top of AU blog articles (super-contribution-caps) |
| ASIC_HOMEPAGE | Adds site-wide ASIC banner to AU homepage |
| IRDAI_INSURANCE | Injects IRDAI regulatory notice before data-source block on IN term/health insurance calculators |
| IRDAI_INJECT | Adds IRDAI notice to ULIP calculator |
| PFRDA_FIX | Replaces "SEBI-registered" with "PFRDA-registered" on NPS calculator |
| TEXT_SOFTEN | Softens prescriptive/definitive investment advice language on SIP, income-tax, capital-gains, old-vs-new-regime pages |

**What it flags (MANUAL_FLAG — cannot auto-fix):**
- `/australia/blog/australia-income-tax-brackets-2026/` — tax rates (19%/32.5%) may be wrong for FY2026-27 post Stage 3 cuts. Verify against ato.gov.au and update the table.

---

### Step 2 — Handle the manual flag

Read the flagged issue from the fix report:

```bash
python3 -c "
import json
r = json.load(open('reports/legal/fix_report_latest.json'))
manual = [x for x in r['results'] if x['status'] == 'manual_required']
for m in manual:
    print(m['url'], '--', m['note'])
"
```

**For the tax rates blog:**
1. Open `_site/australia/blog/australia-income-tax-brackets-2026/index.html`
2. Check the current rates shown in the table
3. Verify against [ato.gov.au income tax rates](https://www.ato.gov.au/rates/individual-income-tax-rates/)
4. The Stage 3 cuts (effective 1 July 2024) changed 19%→16% and 32.5%→30%
5. Update the table to the correct FY2026-27 rates
6. Ask the user to confirm before writing: "The blog shows 19%/32.5%. ATO FY2026-27 rates are 16%/30% after Stage 3 cuts. Shall I update the table?"

---

### Step 3 — Verify fixes

```bash
python3 -c "
import json
r = json.load(open('reports/legal/fix_report_latest.json'))
print('Fixed:', r['fixed'], '| Manual:', r['manual_required'])
for x in r['results']:
    icon = '✓' if x['status'] == 'fixed' else ('⚠' if x['status'] == 'manual_required' else '↩')
    print(icon, x['url'], '->', x['verdict_after'])
"
```

---

### Step 4 — Commit and push fixes to Vercel

```bash
cd /Users/rahulbhattacharya/calcphi.com-1
git add _site/ && git commit -m "Legal Fixer: ASIC/IRDAI compliance fixes applied" && git push origin main
```

---

### Step 5 — Update War Room data

```bash
cp /Users/rahulbhattacharya/calcphi.com-1/reports/legal/fix_report_latest.json \
   /Users/rahulbhattacharya/Desktop/war-room/data/legal/fix_report_latest.json
```

---

### Step 6 — Push War Room — dashboard updates in ~1 min

```bash
cd /Users/rahulbhattacharya/Desktop/war-room
git add data/legal/ && git commit -m "Legal: compliance fixes applied — red/orange → green" && git push
```

---

## Decision gates (always ask before acting)

Stop and ask the user before:
1. **Updating factual data** (tax rates, regulatory thresholds) — verify source first
2. **Removing existing disclaimer text** — only add/supplement, never remove
3. **Changing page structure beyond the warning block** — no layout changes
4. **Any fix on a page not in `scripts/legal/fixer.py`'s FIXES list** — run a rescan first

---

## Fix pattern reference

| Pattern | Injection point | Style |
|---------|----------------|-------|
| ASIC_CALC | Before `<div class="calculator-widget">` | Orange left-border warning |
| ASIC_BLOG | Before first `<p>` (≥20 words) in `<main>` | Orange left-border warning |
| ASIC_HOMEPAGE | Before first `<section>` or `</main>` | Orange left-border warning |
| IRDAI_INSURANCE | Before `<div class="data-source">` | Blue left-border notice |
| IRDAI_INJECT | Before `<div class="data-source">` or `</main>` | Blue left-border notice |
| TEXT_SOFTEN | Direct string replace in HTML | n/a |
| PFRDA_FIX | Direct string replace: SEBI → PFRDA | n/a |
| MANUAL_FLAG | No HTML change — report only | n/a |

---

## Files

| File | Purpose |
|------|---------|
| `scripts/legal/fixer.py` | Main fixer — reads issues.json, applies fixes, updates verdicts |
| `agents/legal-fixer.md` | This spec |
| `reports/legal/fix_report_latest.json` | Fix run output |
| `war-room/data/legal/issues.json` | Source of truth for issue verdicts |
| `war-room/data/legal/summary.json` | Red/orange/green counts for dashboard tiles |

---

## Agent System Prompt

You are Legal Fixer, a compliance remediation agent for calcphi.com. Your job is to
drive all Legal Room issues from red/orange to green by running
`scripts/legal/fixer.py`, handling the one manual flag (AU tax rates blog — verify
against ATO before changing any numbers), then committing the `_site/` changes and
updating the war-room data files. Always add disclaimers, never remove existing ones.
For any factual change (tax rates, regulatory thresholds), show the user the proposed
change and wait for confirmation before writing. After all fixes, re-read the summary
and confirm all issues are green.
