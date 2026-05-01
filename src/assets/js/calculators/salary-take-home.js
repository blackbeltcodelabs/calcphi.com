import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calcIncomeTax(income) {
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

function calculate({ grossSalary, superRate, salarySacrificeAmount, otherDeductions }) {
  const taxableIncome = Math.max(0, grossSalary - salarySacrificeAmount);
  const grossTax = calcIncomeTax(taxableIncome);
  const lito = Math.max(0, calcLito(taxableIncome));
  const incomeTaxPa = Math.max(0, grossTax - lito);
  const medicareLevyPa = calcMedicare(taxableIncome);
  const superEmployer = grossSalary * superRate / 100;
  const netAnnual = taxableIncome - incomeTaxPa - medicareLevyPa - otherDeductions;
  return {
    netAnnual,
    netMonthly: netAnnual / 12,
    netFortnightly: netAnnual / 26,
    netWeekly: netAnnual / 52,
    incomeTaxPa,
    medicareLevyPa,
    superEmployer,
  };
}

function update() {
  const grossSalary = getInputValue('gross-salary');
  const superRate = getInputValue('super-rate');
  const salarySacrificeAmount = getInputValue('salary-sacrifice-amount');
  const otherDeductions = getInputValue('other-deductions');
  const r = calculate({ grossSalary, superRate, salarySacrificeAmount, otherDeductions });
  setResult('net-annual', formatAUD(r.netAnnual));
  setResult('net-monthly', formatAUD(r.netMonthly));
  setResult('net-fortnightly', formatAUD(r.netFortnightly));
  setResult('net-weekly', formatAUD(r.netWeekly));
  setResult('income-tax-pa', formatAUD(r.incomeTaxPa));
  setResult('medicare-levy-pa', formatAUD(r.medicareLevyPa));
  setResult('super-employer', formatAUD(r.superEmployer));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['gross-salary', 'super-rate', 'salary-sacrifice-amount', 'other-deductions'], update);
  update();
});
