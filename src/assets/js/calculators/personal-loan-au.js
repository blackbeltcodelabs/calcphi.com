import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ loanAmount, interestRate, loanTerm, establishmentFee }) {
  const n = loanTerm * 12;
  const r = interestRate / 100 / 12;
  if (loanAmount <= 0) return { monthlyRepayment: 0, totalRepayments: 0, totalInterest: 0, comparisonRate: 0, totalCost: 0 };
  const monthly = r === 0 ? loanAmount / n : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalRepayments = monthly * n;
  const totalInterest = totalRepayments - loanAmount;
  const totalCost = totalRepayments + establishmentFee;

  // Comparison rate: solve for rate that makes PV of payments = loan + fee
  const adjustedLoan = loanAmount + establishmentFee;
  let lo = 0, hi = 1;
  let compRate = interestRate;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const rm = mid / 100 / 12;
    const pv = rm === 0 ? monthly * n : monthly * (1 - Math.pow(1 + rm, -n)) / rm;
    if (pv > adjustedLoan) lo = mid;
    else hi = mid;
    compRate = mid;
  }

  return { monthlyRepayment: monthly, totalRepayments, totalInterest, comparisonRate: compRate, totalCost };
}

function update() {
  const loanAmount = getInputValue('loan-amount');
  const interestRate = getInputValue('interest-rate');
  const loanTerm = getInputValue('loan-term');
  const establishmentFee = getInputValue('establishment-fee');
  const { monthlyRepayment, totalRepayments, totalInterest, comparisonRate, totalCost } = calculate({ loanAmount, interestRate, loanTerm, establishmentFee });
  setResult('monthly-repayment', formatAUD(monthlyRepayment));
  setResult('total-repayments', formatAUD(totalRepayments));
  setResult('total-interest', formatAUD(totalInterest));
  setResult('comparison-rate', formatPercent(comparisonRate));
  setResult('total-cost', formatAUD(totalCost));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['loan-amount', 'interest-rate', 'loan-term', 'establishment-fee'], update);
  update();
});
