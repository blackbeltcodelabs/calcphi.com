import { formatAUD, formatPercent, setResult, getInputValue } from '../ui.js';

function calculate({ propertyValue, weeklyRent, annualExpenses, loanAmount, loanRate }) {
  const annualRentalIncome = weeklyRent * 52;
  const netRentalIncome = annualRentalIncome - annualExpenses;
  const annualInterest = loanAmount * (loanRate / 100);
  const annualCashFlow = netRentalIncome - annualInterest;
  const grossYield = propertyValue > 0 ? (annualRentalIncome / propertyValue) * 100 : 0;
  const netYield = propertyValue > 0 ? (netRentalIncome / propertyValue) * 100 : 0;
  return { grossYield, netYield, annualRentalIncome, annualCashFlow };
}

function update() {
  const propertyValue = getInputValue('property-value');
  const weeklyRent = getInputValue('weekly-rent');
  const annualExpenses = getInputValue('annual-expenses');
  const loanAmount = getInputValue('loan-amount');
  const loanRate = getInputValue('loan-rate');
  const { grossYield, netYield, annualRentalIncome, annualCashFlow } = calculate({
    propertyValue, weeklyRent, annualExpenses, loanAmount, loanRate
  });
  setResult('gross-yield', formatPercent(grossYield, 2) + ' p.a.');
  setResult('net-yield', formatPercent(netYield, 2) + ' p.a.');
  setResult('annual-rental-income', formatAUD(annualRentalIncome));
  const sign = annualCashFlow >= 0 ? '' : '−';
  setResult('annual-cash-flow', sign + formatAUD(Math.abs(annualCashFlow)));
}

document.addEventListener('DOMContentLoaded', () => {
  const ids = ['property-value', 'weekly-rent', 'annual-expenses', 'loan-amount', 'loan-rate'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', update);
  });
  update();
});
