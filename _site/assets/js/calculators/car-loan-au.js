import { formatAUD, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ vehiclePrice, deposit, interestRate, loanTerm }) {
  const loanAmount = Math.max(0, vehiclePrice - deposit);
  const r = interestRate / 100 / 12;
  const n = loanTerm * 12;
  if (loanAmount <= 0) return { monthlyRepayment: 0, totalRepayments: 0, totalInterest: 0, loanAmount: 0, yearData: [] };
  const monthly = r === 0 ? loanAmount / n : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalRepayments = monthly * n;
  const totalInterest = totalRepayments - loanAmount;

  let balance = loanAmount;
  const yearData = [];
  for (let yr = 1; yr <= loanTerm; yr++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      const intCharge = balance * r;
      yearInterest += intCharge;
      const principal = monthly - intCharge;
      yearPrincipal += principal;
      balance = Math.max(0, balance - principal);
    }
    yearData.push([yr, formatAUD(yearInterest), formatAUD(yearPrincipal), formatAUD(balance)]);
  }
  return { monthlyRepayment: monthly, totalRepayments, totalInterest, loanAmount, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th>Year</th><th>Interest Paid</th><th>Principal Paid</th><th>Balance</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const vehiclePrice = getInputValue('vehicle-price');
  const deposit = getInputValue('deposit');
  const interestRate = getInputValue('interest-rate');
  const loanTerm = getInputValue('loan-term');
  const { monthlyRepayment, totalRepayments, totalInterest, loanAmount, yearData } = calculate({ vehiclePrice, deposit, interestRate, loanTerm });
  setResult('monthly-repayment', formatAUD(monthlyRepayment));
  setResult('total-repayments', formatAUD(totalRepayments));
  setResult('total-interest', formatAUD(totalInterest));
  setResult('loan-amount', formatAUD(loanAmount));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['vehicle-price', 'deposit', 'interest-rate', 'loan-term'], update);
  update();
});
