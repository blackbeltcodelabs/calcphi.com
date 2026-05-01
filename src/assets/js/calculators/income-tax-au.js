import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calcTax(income) {
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.19;
  if (income <= 135000) return 5092 + (income - 45000) * 0.325;
  if (income <= 190000) return 34417 + (income - 135000) * 0.37;
  return 55267 + (income - 190000) * 0.45;
}

function calcLito(income) {
  if (income <= 37500) return 700;
  if (income <= 45000) return 700 - (income - 37500) * 0.05;
  if (income <= 66667) return 325 - (income - 45000) * 0.015;
  return 0;
}

function calcMedicare(income) {
  if (income <= 26000) return 0;
  if (income <= 36000) return (income - 26000) * 0.1;
  return income * 0.02;
}

function calculate({ taxableIncome, includeMedicare, applyLito }) {
  const grossTax = calcTax(taxableIncome);
  const litoOffset = applyLito === 'yes' ? Math.max(0, calcLito(taxableIncome)) : 0;
  const incomeTax = Math.max(0, grossTax - litoOffset);
  const medicareLevy = includeMedicare === 'yes' ? calcMedicare(taxableIncome) : 0;
  const totalTax = incomeTax + medicareLevy;
  const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
  const takeHome = taxableIncome - totalTax;
  return { incomeTax, medicareLevy, litoOffset, totalTax, effectiveRate, takeHome };
}

function update() {
  const taxableIncome = getInputValue('taxable-income');
  const includeMedicare = getSelectValue('include-medicare');
  const applyLito = getSelectValue('apply-lito');
  const { incomeTax, medicareLevy, litoOffset, totalTax, effectiveRate, takeHome } = calculate({ taxableIncome, includeMedicare, applyLito });
  setResult('income-tax', formatAUD(incomeTax));
  setResult('medicare-levy', formatAUD(medicareLevy));
  setResult('lito-offset', formatAUD(litoOffset));
  setResult('total-tax', formatAUD(totalTax));
  setResult('effective-rate', formatPercent(effectiveRate));
  setResult('take-home', formatAUD(takeHome));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['taxable-income', 'include-medicare', 'apply-lito'], update);
  update();
});
