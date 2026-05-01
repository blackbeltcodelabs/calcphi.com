import { formatAUD, setResult, getInputValue, bindInputs } from '../ui.js';

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

function netTax(income) {
  return Math.max(0, calcTax(income) - calcLito(income)) + calcMedicare(income);
}

function calculate({ grossSalary, sacrificeAmount, employerSg }) {
  const taxBefore = netTax(grossSalary);
  const taxAfter = netTax(grossSalary - sacrificeAmount);
  const taxSaving = taxBefore - taxAfter;
  const netPayChange = -sacrificeAmount + taxSaving;
  const employerContrib = grossSalary * employerSg / 100;
  const superTaxInFund = sacrificeAmount * 0.15;
  const netBenefit = sacrificeAmount - superTaxInFund + taxSaving;
  return { taxBefore, taxAfter, taxSaving, netPayChange, superTaxInFund, netBenefit };
}

function update() {
  const grossSalary = getInputValue('gross-salary');
  const sacrificeAmount = getInputValue('sacrifice-amount');
  const employerSg = getInputValue('employer-sg');
  const { taxBefore, taxAfter, taxSaving, netPayChange, superTaxInFund, netBenefit } = calculate({ grossSalary, sacrificeAmount, employerSg });
  setResult('tax-before', formatAUD(taxBefore));
  setResult('tax-after', formatAUD(taxAfter));
  setResult('tax-saving', formatAUD(taxSaving));
  setResult('net-pay-change', (netPayChange >= 0 ? '+' : '') + formatAUD(netPayChange));
  setResult('super-tax-in-fund', formatAUD(superTaxInFund));
  setResult('net-benefit', formatAUD(netBenefit));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['gross-salary', 'sacrifice-amount', 'employer-sg'], update);
  update();
});
