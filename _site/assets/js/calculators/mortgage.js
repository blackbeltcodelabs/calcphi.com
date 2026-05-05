import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ loanAmount, interestRate, loanTerm, repaymentType }) {
  const r = interestRate / 100 / 12;
  const n = loanTerm * 12;
  if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
    return { monthly: 0, fortnightly: 0, totalRepayments: 0, totalInterest: 0, yearData: [] };
  }
  let monthly;
  if (repaymentType === 'interest-only') {
    monthly = loanAmount * r;
  } else {
    monthly = r === 0 ? loanAmount / n : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  const fortnightly = (monthly * 12) / 26;
  const totalRepayments = monthly * n;
  const totalInterest = repaymentType === 'interest-only' ? monthly * n : totalRepayments - loanAmount;

  const yearData = [];
  let balance = loanAmount;
  for (let yr = 1; yr <= loanTerm; yr++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      const intCharge = balance * r;
      yearInterest += intCharge;
      if (repaymentType !== 'interest-only') {
        const principal = monthly - intCharge;
        yearPrincipal += principal;
        balance = Math.max(0, balance - principal);
      }
    }
    yearData.push([yr, formatAUD(yearInterest), formatAUD(yearPrincipal), formatAUD(balance)]);
  }
  return { monthly, fortnightly, totalRepayments, totalInterest, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th>Year</th><th>Interest Paid</th><th>Principal Paid</th><th>Balance</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const loanAmount = getInputValue('loan-amount');
  const interestRate = getInputValue('interest-rate');
  const loanTerm = getInputValue('loan-term');
  const repaymentType = getSelectValue('repayment-type');
  const { monthly, fortnightly, totalRepayments, totalInterest, yearData } = calculate({ loanAmount, interestRate, loanTerm, repaymentType });
  setResult('monthly-repayment', formatAUD(monthly));
  setResult('fortnightly-repayment', formatAUD(fortnightly));
  setResult('total-repayments', formatAUD(totalRepayments));
  setResult('total-interest', formatAUD(totalInterest));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['loan-amount', 'interest-rate', 'loan-term', 'repayment-type'], update);
  update();
});
