import { formatINR, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function computeTax(income) {
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, limit) - prev) * rate;
    prev = limit;
    if (income <= limit) break;
  }
  if (income <= 1200000) tax = 0; // 87A rebate
  return tax * 1.04; // 4% cess
}

function update() {
  const income = getInputValue('at-income');
  const paid = getInputValue('at-paid');
  const annualTax = computeTax(income);
  const due = Math.max(0, annualTax - paid);
  const q1 = Math.max(0, annualTax * 0.15 - paid);
  const q2 = Math.max(0, annualTax * 0.45 - paid);
  const q3 = Math.max(0, annualTax * 0.75 - paid);
  setResult('at-annual-tax', formatINR(annualTax));
  setResult('at-q1', formatINR(Math.max(0, annualTax * 0.15)));
  setResult('at-q2', formatINR(Math.max(0, annualTax * 0.30)));
  setResult('at-q3', formatINR(Math.max(0, annualTax * 0.30)));
  setResult('at-q4', formatINR(Math.max(0, annualTax * 0.25)));
  setResult('at-balance', formatINR(due));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['at-income', 'at-paid'], update);
  update();
});
