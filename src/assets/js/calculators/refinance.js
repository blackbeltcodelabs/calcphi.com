import { formatAUD, setResult, getInputValue, bindInputs } from '../ui.js';

function loanPayment(principal, annualRate, months) {
  if (months <= 0 || principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function calculate({ currentBalance, currentRate, newRate, remainingTerm, refinanceCosts }) {
  const months = remainingTerm * 12;
  const oldMonthly = loanPayment(currentBalance, currentRate, months);
  const newMonthly = loanPayment(currentBalance, newRate, months);
  const monthlySaving = oldMonthly - newMonthly;
  const annualSaving = monthlySaving * 12;
  const breakEvenMonths = monthlySaving > 0 ? Math.ceil(refinanceCosts / monthlySaving) : 0;
  const totalSaving = monthlySaving > 0 ? Math.max(0, monthlySaving * months - refinanceCosts) : 0;
  return { monthlySaving, annualSaving, breakEvenMonths, totalSaving };
}

function update() {
  const currentBalance = getInputValue('current-balance');
  const currentRate = getInputValue('current-rate');
  const newRate = getInputValue('new-rate');
  const remainingTerm = getInputValue('remaining-term');
  const refinanceCosts = getInputValue('refinance-costs');
  const { monthlySaving, annualSaving, breakEvenMonths, totalSaving } = calculate({ currentBalance, currentRate, newRate, remainingTerm, refinanceCosts });
  setResult('monthly-saving', formatAUD(monthlySaving));
  setResult('annual-saving', formatAUD(annualSaving));
  setResult('breakeven-months', breakEvenMonths > 0 ? `${breakEvenMonths} months` : monthlySaving <= 0 ? 'Not beneficial' : 'Immediate');
  setResult('total-saving', formatAUD(totalSaving));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['current-balance', 'current-rate', 'new-rate', 'remaining-term', 'refinance-costs'], update);
  update();
});
