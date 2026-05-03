import { formatAUD, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calculate({ weeklyRent, loanAmount, loanRate, annualExpenses, depreciation, marginalTaxRate }) {
  const rentalIncome = weeklyRent * 52;
  const annualInterest = loanAmount * (loanRate / 100);
  const totalDeductions = annualInterest + annualExpenses + depreciation;
  const taxLoss = rentalIncome - totalDeductions;
  const taxSaving = taxLoss < 0 ? Math.abs(taxLoss) * (marginalTaxRate / 100) : 0;
  // After-tax cash cost = cash shortfall after tax benefit
  // Cash shortfall = rental income - interest - cash expenses (exclude non-cash depreciation)
  const cashShortfall = rentalIncome - annualInterest - annualExpenses;
  const afterTaxCost = cashShortfall < 0 ? Math.abs(cashShortfall) - taxSaving : 0;
  return { rentalIncome, totalDeductions, taxLoss, taxSaving, afterTaxCost };
}

function update() {
  const weeklyRent = getInputValue('weekly-rent');
  const loanAmount = getInputValue('loan-amount');
  const loanRate = getInputValue('loan-rate');
  const annualExpenses = getInputValue('annual-expenses');
  const depreciation = getInputValue('depreciation');
  const marginalTaxRate = parseFloat(getSelectValue('marginal-tax-rate')) || 0;
  const { rentalIncome, totalDeductions, taxLoss, taxSaving, afterTaxCost } = calculate({
    weeklyRent, loanAmount, loanRate, annualExpenses, depreciation, marginalTaxRate
  });
  setResult('rental-income', formatAUD(rentalIncome));
  setResult('total-deductions', formatAUD(totalDeductions));
  const lossLabel = taxLoss < 0 ? '− ' + formatAUD(Math.abs(taxLoss)) + ' (loss)' : formatAUD(taxLoss) + ' (profit)';
  setResult('tax-loss', lossLabel);
  setResult('tax-saving', formatAUD(taxSaving) + ' /yr');
  setResult('after-tax-cost', formatAUD(afterTaxCost) + ' /yr');
}

document.addEventListener('DOMContentLoaded', () => {
  const rangeIds = ['weekly-rent', 'loan-amount', 'loan-rate', 'annual-expenses', 'depreciation'];
  rangeIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', update);
  });
  const sel = document.getElementById('marginal-tax-rate');
  if (sel) sel.addEventListener('change', update);
  update();
});
