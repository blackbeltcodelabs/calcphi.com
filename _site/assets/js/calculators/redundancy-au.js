import { formatAUD, setResult, getInputValue, getSelectValue } from '../ui.js';

// FY2025-26 genuine redundancy tax-free thresholds
const TAX_FREE_BASE = 12524;
const TAX_FREE_PER_YEAR = 6264;

function calcFairWorkWeeks(years) {
  // Fair Work Act minimum redundancy weeks
  if (years < 1) return 0;
  if (years < 2) return 4;
  if (years < 3) return 6;
  if (years < 4) return 7;
  if (years < 5) return 8;
  if (years < 6) return 10;
  if (years < 7) return 11;
  if (years < 8) return 13;
  if (years < 9) return 14;
  return 16; // 9+ years
}

function calculate({ weeklyPay, yearsService, age, marginalTaxRate }) {
  const weeks = calcFairWorkWeeks(yearsService);
  const totalPayment = weeklyPay * weeks;

  // Over retirement age (67): no tax-free threshold
  const taxFreeAmount = age >= 67 ? 0 : Math.min(totalPayment, TAX_FREE_BASE + TAX_FREE_PER_YEAR * yearsService);
  const taxableComponent = Math.max(0, totalPayment - taxFreeAmount);

  // ETP concessional rate: max 30% (or 17% if below $45k including ETP)
  // Use marginal rate capped at 30% for ETP up to cap ($245,000)
  const etpRate = Math.min(marginalTaxRate / 100, 0.30);
  const taxOnEtp = taxableComponent * etpRate;
  const afterTaxTotal = totalPayment - taxOnEtp;

  return { totalPayment, taxFreeAmount, taxableComponent, taxOnEtp, afterTaxTotal };
}

function update() {
  const weeklyPay = getInputValue('weekly-pay');
  const yearsService = getInputValue('years-service');
  const age = getInputValue('age');
  const marginalTaxRate = parseFloat(getSelectValue('marginal-tax-rate')) || 0;
  const { totalPayment, taxFreeAmount, taxableComponent, taxOnEtp, afterTaxTotal } = calculate({
    weeklyPay, yearsService, age, marginalTaxRate
  });
  setResult('total-payment', formatAUD(totalPayment));
  setResult('tax-free-amount', formatAUD(taxFreeAmount));
  setResult('taxable-component', formatAUD(taxableComponent));
  setResult('tax-on-etp', formatAUD(taxOnEtp));
  setResult('after-tax-total', formatAUD(afterTaxTotal));
}

document.addEventListener('DOMContentLoaded', () => {
  ['weekly-pay', 'years-service', 'age'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', update);
  });
  const sel = document.getElementById('marginal-tax-rate');
  if (sel) sel.addEventListener('change', update);
  update();
});
