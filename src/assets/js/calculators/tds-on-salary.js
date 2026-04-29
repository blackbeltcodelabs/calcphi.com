import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function computeTax(income) {
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
  const taxable = Math.max(0, income - 75000);
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, limit) - prev) * rate;
    prev = limit;
    if (taxable <= limit) break;
  }
  if (taxable <= 1200000) tax = 0;
  return tax * 1.04;
}

function update() {
  const salary = getInputValue('tos-salary');
  const other = getInputValue('tos-other');
  const totalIncome = salary + other;
  const annualTax = computeTax(totalIncome);
  const monthlyTds = annualTax / 12;
  setResult('tos-annual-income', formatINR(totalIncome));
  setResult('tos-annual-tax', formatINR(annualTax));
  setResult('tos-monthly-tds', formatINR(monthlyTds));
  setResult('tos-in-hand', formatINR((salary - monthlyTds) / 12));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['tos-salary','tos-other'], update);
  update();
});
