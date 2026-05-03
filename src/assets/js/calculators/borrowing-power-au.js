import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calculate({ annualIncome, monthlyExpenses, existingRepayments, interestRate, loanTerm }) {
  const assessmentRate = interestRate + 3; // APRA 3% buffer
  const r = assessmentRate / 100 / 12;
  const n = loanTerm * 12;

  const monthlyGrossIncome = annualIncome / 12;
  // Estimate net monthly income (rough after-tax)
  const annualTax = calcTax(annualIncome);
  const monthlyNetIncome = (annualIncome - annualTax) / 12;

  const availableForRepayment = monthlyNetIncome - monthlyExpenses - existingRepayments;
  if (availableForRepayment <= 0) {
    return { maxBorrowing: 0, assessmentRate, monthlyRepayment: 0, maxPropertyPrice: 0 };
  }

  // Maximum loan at assessment rate
  const maxBorrowing = r > 0
    ? availableForRepayment * ((1 - Math.pow(1 + r, -n)) / r)
    : availableForRepayment * n;

  // Repayment at actual rate (for display)
  const ra = interestRate / 100 / 12;
  const monthlyRepayment = ra > 0
    ? maxBorrowing * ra * Math.pow(1 + ra, n) / (Math.pow(1 + ra, n) - 1)
    : maxBorrowing / n;

  const maxPropertyPrice = maxBorrowing / 0.8; // assumes 20% deposit

  return { maxBorrowing, assessmentRate, monthlyRepayment, maxPropertyPrice };
}

function calcTax(income) {
  // FY2025-26 ATO brackets (Stage 3)
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.19;
  if (income <= 135000) return 5092 + (income - 45000) * 0.325;
  if (income <= 190000) return 34267 + (income - 135000) * 0.37;
  return 54667 + (income - 190000) * 0.45;
}

function update() {
  const annualIncome = getInputValue('annual-income');
  const monthlyExpenses = getInputValue('monthly-expenses');
  const existingRepayments = getInputValue('existing-repayments');
  const interestRate = getInputValue('interest-rate');
  const loanTerm = getInputValue('loan-term');
  const { maxBorrowing, assessmentRate, monthlyRepayment, maxPropertyPrice } = calculate({
    annualIncome, monthlyExpenses, existingRepayments, interestRate, loanTerm
  });
  setResult('max-borrowing', formatAUD(maxBorrowing));
  setResult('assessment-rate', formatPercent(assessmentRate, 2) + ' p.a.');
  setResult('monthly-repayment', formatAUD(monthlyRepayment));
  setResult('max-property-price', formatAUD(maxPropertyPrice));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['annual-income', 'monthly-expenses', 'existing-repayments', 'interest-rate', 'loan-term'], update);
  update();
});
