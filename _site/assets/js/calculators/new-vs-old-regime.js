import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function newRegime(income) {
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
  const taxable = income - 75000; // standard deduction
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, limit) - prev) * rate;
    prev = limit;
    if (taxable <= limit) break;
  }
  if (taxable <= 1200000) tax = 0;
  return tax * 1.04;
}

function oldRegime(income, deductions80c, hra, other) {
  const taxable = Math.max(0, income - 50000 - Math.min(deductions80c, 150000) - hra - other);
  const slabs = [[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, limit) - prev) * rate;
    prev = limit;
    if (taxable <= limit) break;
  }
  if (taxable <= 500000) tax = 0;
  return tax * 1.04;
}

function update() {
  const income = getInputValue('nvr-income');
  const ded80c = getInputValue('nvr-80c');
  const hra = getInputValue('nvr-hra');
  const other = getInputValue('nvr-other');
  const newTax = newRegime(income);
  const oldTax = oldRegime(income, ded80c, hra, other);
  const saving = oldTax - newTax;
  setResult('nvr-new-tax', formatINR(newTax));
  setResult('nvr-old-tax', formatINR(oldTax));
  setResult('nvr-better', saving > 0 ? 'New Regime saves ' + formatINR(saving) : 'Old Regime saves ' + formatINR(-saving));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['nvr-income','nvr-80c','nvr-hra','nvr-other'], update);
  update();
});
