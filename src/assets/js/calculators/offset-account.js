import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ loanBalance, offsetBalance, interestRate, remainingTerm }) {
  const r = interestRate / 100 / 12;
  const n = remainingTerm * 12;
  const effectiveBalance = Math.max(0, loanBalance - offsetBalance);

  const monthlyWithout = r === 0 ? loanBalance / n : (loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const monthlyWith = effectiveBalance <= 0 ? 0 : r === 0 ? effectiveBalance / n : (effectiveBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const totalWithout = monthlyWithout * n;
  const interestWithout = totalWithout - loanBalance;

  // Calculate actual payoff months with offset
  let balance = loanBalance;
  let totalPaid = 0;
  let months = 0;
  const payment = monthlyWithout;
  while (balance > 0.01 && months < n * 2) {
    const intCharge = (balance - Math.min(offsetBalance, balance)) * r;
    const principal = Math.min(balance, payment - intCharge);
    balance -= principal;
    totalPaid += payment;
    months++;
  }

  const interestWith = totalPaid - loanBalance;
  const interestSaved = Math.max(0, interestWithout - interestWith);
  const monthsSaved = n - months;
  const timeSaved = monthsSaved <= 0 ? 'None' : monthsSaved < 12 ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''}` : `${Math.floor(monthsSaved / 12)} yr ${monthsSaved % 12} mo`;
  const monthlySaving = Math.max(0, (interestWithout - interestWith) / n);
  const effectiveRate = effectiveBalance <= 0 ? 0 : interestRate * (effectiveBalance / loanBalance);

  return { interestSaved, timeSaved, monthlySaving, effectiveRate };
}

function update() {
  const loanBalance = getInputValue('loan-balance');
  const offsetBalance = getInputValue('offset-balance');
  const interestRate = getInputValue('interest-rate');
  const remainingTerm = getInputValue('remaining-term');
  const { interestSaved, timeSaved, monthlySaving, effectiveRate } = calculate({ loanBalance, offsetBalance, interestRate, remainingTerm });
  setResult('interest-saved', formatAUD(interestSaved));
  setResult('time-saved', timeSaved);
  setResult('monthly-saving', formatAUD(monthlySaving));
  setResult('effective-rate', formatPercent(effectiveRate));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['loan-balance', 'offset-balance', 'interest-rate', 'remaining-term'], update);
  update();
});
