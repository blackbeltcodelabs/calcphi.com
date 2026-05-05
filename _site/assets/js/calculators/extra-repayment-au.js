import { formatAUD, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ loanAmount, interestRate, loanTerm, extraMonthly }) {
  const r = interestRate / 100 / 12;
  const n = loanTerm * 12;
  if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
    return { interestSaved: 0, monthsSaved: 0, newTerm: loanTerm, originalInterest: 0, yearData: [] };
  }

  const standardRepayment = r > 0
    ? loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    : loanAmount / n;
  const totalStandard = standardRepayment * n;
  const originalInterest = totalStandard - loanAmount;

  // Simulate loan with extra repayments
  let balance = loanAmount;
  let totalPaid = 0;
  let months = 0;
  const yearData = [];
  const totalRepayment = standardRepayment + extraMonthly;

  while (balance > 0.01 && months < n) {
    const interest = balance * r;
    const principal = Math.min(totalRepayment - interest, balance);
    balance = Math.max(0, balance - principal);
    totalPaid += interest + principal;
    months++;
    if (months % 12 === 0 || balance < 0.01) {
      const yr = Math.ceil(months / 12);
      yearData.push([yr, formatAUD(interest * 12 || interest), formatAUD(balance)]);
    }
  }

  const newInterest = totalPaid - loanAmount;
  const interestSaved = originalInterest - newInterest;
  const monthsSaved = n - months;
  const newTermYears = Math.floor(months / 12);
  const newTermMonths = months % 12;
  const newTermStr = newTermYears + ' yrs' + (newTermMonths > 0 ? ' ' + newTermMonths + ' mo' : '');

  return { interestSaved, monthsSaved, newTerm: newTermStr, originalInterest, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th>Year</th><th>Annual Interest</th><th>Remaining Balance</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function formatTimeSaved(months) {
  if (months <= 0) return '0 months';
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return mo + ' month' + (mo !== 1 ? 's' : '');
  if (mo === 0) return yrs + ' year' + (yrs !== 1 ? 's' : '');
  return yrs + ' yr ' + mo + ' mo';
}

function update() {
  const loanAmount = getInputValue('loan-amount');
  const interestRate = getInputValue('interest-rate');
  const loanTerm = getInputValue('loan-term');
  const extraMonthly = getInputValue('extra-monthly');
  const { interestSaved, monthsSaved, newTerm, originalInterest, yearData } = calculate({
    loanAmount, interestRate, loanTerm, extraMonthly
  });
  setResult('interest-saved', formatAUD(interestSaved));
  setResult('time-saved', formatTimeSaved(monthsSaved));
  setResult('new-payoff', newTerm);
  setResult('original-interest', formatAUD(originalInterest));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['loan-amount', 'interest-rate', 'loan-term', 'extra-monthly'], update);
  update();
});
