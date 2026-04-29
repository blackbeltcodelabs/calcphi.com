import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function computeTax(taxable) {
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
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
  const ctc = getInputValue('ctc-ctc');
  const basicPercent = getInputValue('ctc-basic') / 100;
  const basic = ctc * basicPercent;
  const hra = basic * 0.50;
  const pfEmployee = basic * 0.12;
  const pfEmployer = basic * 0.12;
  const gratuity = basic * 0.0481;
  const grossSalary = ctc - pfEmployer - gratuity;
  const taxable = Math.max(0, grossSalary - 75000); // std deduction new regime
  const tax = computeTax(taxable);
  const monthlyTax = tax / 12;
  const monthlyPf = pfEmployee / 12;
  const inHand = (grossSalary - tax - pfEmployee) / 12;
  const yearData = [
    ['Basic Salary', formatINR(basic / 12), formatINR(basic)],
    ['HRA', formatINR(hra / 12), formatINR(hra)],
    ['Special Allowance', formatINR((grossSalary - basic - hra) / 12), formatINR(grossSalary - basic - hra)],
    ['Employee PF (-)', formatINR(pfEmployee / 12), formatINR(pfEmployee)],
    ['Income Tax TDS (-)', formatINR(monthlyTax), formatINR(tax)],
    ['In-Hand Salary', formatINR(inHand), formatINR(inHand * 12)],
  ];
  setResult('ctc-gross', formatINR(grossSalary / 12));
  setResult('ctc-pf', formatINR(pfEmployee / 12));
  setResult('ctc-tax', formatINR(monthlyTax));
  setResult('ctc-in-hand', formatINR(inHand));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Component</th><th>Monthly</th><th>Annual</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ctc-ctc','ctc-basic'], update);
  update();
});
