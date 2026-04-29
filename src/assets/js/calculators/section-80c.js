import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function computeTax(income, deductions = 0) {
  const taxable = Math.max(0, income - deductions);
  const slabs = [[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, limit) - prev) * rate;
    prev = limit;
    if (taxable <= limit) break;
  }
  if (taxable <= 500000) tax = Math.min(tax, Math.max(0, taxable - 250000) * 0.05);
  return tax * 1.04;
}

function update() {
  const income = getInputValue('s80c-income');
  const elss = getInputValue('s80c-elss');
  const ppf = getInputValue('s80c-ppf');
  const lic = getInputValue('s80c-lic');
  const epf = getInputValue('s80c-epf');
  const other = getInputValue('s80c-other');
  const total80c = Math.min(150000, elss + ppf + lic + epf + other);
  const taxWithout = computeTax(income);
  const taxWith = computeTax(income, total80c);
  const saved = taxWithout - taxWith;
  const remaining = Math.max(0, 150000 - total80c);
  setResult('s80c-total', formatINR(total80c));
  setResult('s80c-remaining', formatINR(remaining));
  setResult('s80c-tax-saved', formatINR(saved));
  setResult('s80c-tax-with', formatINR(taxWith));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['s80c-income','s80c-elss','s80c-ppf','s80c-lic','s80c-epf','s80c-other'], update);
  update();
});
