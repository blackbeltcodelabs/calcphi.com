import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

const NEW_SLABS = [
  { from: 0, to: 400000, rate: 0 },
  { from: 400000, to: 800000, rate: 0.05 },
  { from: 800000, to: 1200000, rate: 0.10 },
  { from: 1200000, to: 1600000, rate: 0.15 },
  { from: 1600000, to: 2000000, rate: 0.20 },
  { from: 2000000, to: 2400000, rate: 0.25 },
  { from: 2400000, to: Infinity, rate: 0.30 },
];
const OLD_SLABS = [
  { from: 0, to: 250000, rate: 0 },
  { from: 250000, to: 500000, rate: 0.05 },
  { from: 500000, to: 1000000, rate: 0.20 },
  { from: 1000000, to: Infinity, rate: 0.30 },
];

function calcSlabTax(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.from) break;
    const taxable = Math.min(income, slab.to === Infinity ? income : slab.to) - slab.from;
    tax += taxable * slab.rate;
  }
  return tax;
}

function applyRebate(tax, income, limit) {
  return income <= limit ? 0 : tax;
}

function withCess(tax) {
  return tax * 1.04;
}

function calculateNewRegime(grossIncome) {
  const std = 75000;
  const taxableIncome = Math.max(0, grossIncome - std);
  let tax = calcSlabTax(taxableIncome, NEW_SLABS);
  tax = applyRebate(tax, taxableIncome, 1200000);
  return withCess(tax);
}

function calculateOldRegime(grossIncome, deductions) {
  const std = 50000;
  const totalDed = deductions + std;
  const taxableIncome = Math.max(0, grossIncome - totalDed);
  let tax = calcSlabTax(taxableIncome, OLD_SLABS);
  tax = applyRebate(tax, taxableIncome, 500000);
  return withCess(tax);
}

function update() {
  const income = getInputValue('gross-income');
  const d80c = getInputValue('section80c');
  const d80d = getInputValue('section80d');
  const dHRA = getInputValue('hra-exemption');
  const dHomeLoan = getInputValue('home-loan-interest');
  const dNPS = getInputValue('nps-80ccd1b');
  const totalDeductions = Math.min(d80c, 150000) + Math.min(d80d, 50000) + dHRA + Math.min(dHomeLoan, 200000) + Math.min(dNPS, 50000);

  const newTax = calculateNewRegime(income);
  const oldTax = calculateOldRegime(income, totalDeductions);

  setResult('new-regime-tax', formatINR(newTax));
  setResult('old-regime-tax', formatINR(oldTax));
  setResult('tax-savings', formatINR(Math.abs(newTax - oldTax)));

  const recEl = document.getElementById('regime-recommendation');
  if (recEl) {
    recEl.textContent = newTax <= oldTax
      ? 'New Regime saves more for your profile'
      : 'Old Regime saves more for your profile';
    recEl.style.color = 'var(--color-success)';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['gross-income', 'section80c', 'section80d', 'hra-exemption', 'home-loan-interest', 'nps-80ccd1b'], update);
  update();
});
