import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calculate({ principal, interestRate, termMonths, interestPaid }) {
  const r = interestRate / 100;
  const t = termMonths / 12;

  let interestEarned;
  if (interestPaid === 'maturity') {
    interestEarned = principal * r * t;
  } else if (interestPaid === 'monthly') {
    interestEarned = principal * (Math.pow(1 + r / 12, termMonths) - 1);
  } else if (interestPaid === 'quarterly') {
    const periods = termMonths / 3;
    interestEarned = principal * (Math.pow(1 + r / 4, periods) - 1);
  } else {
    const years = Math.floor(termMonths / 12);
    const remainder = termMonths % 12;
    const afterFullYears = principal * Math.pow(1 + r, years);
    const finalAmount = afterFullYears * (1 + r * (remainder / 12));
    interestEarned = finalAmount - principal;
  }

  const maturityAmount = principal + interestEarned;
  const effectiveRate = t > 0 ? (Math.pow(maturityAmount / principal, 1 / t) - 1) * 100 : interestRate;
  const monthlyInterest = interestEarned / termMonths;

  return { interestEarned, maturityAmount, effectiveRate, monthlyInterest };
}

function update() {
  const principal = getInputValue('principal');
  const interestRate = getInputValue('interest-rate');
  const termMonths = getInputValue('term-months');
  const interestPaid = getSelectValue('interest-paid');
  const { interestEarned, maturityAmount, effectiveRate, monthlyInterest } = calculate({
    principal, interestRate, termMonths, interestPaid
  });
  setResult('interest-earned', formatAUD(interestEarned));
  setResult('maturity-amount', formatAUD(maturityAmount));
  setResult('effective-rate', formatPercent(effectiveRate, 2) + ' p.a.');
  setResult('monthly-interest', formatAUD(monthlyInterest));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['principal', 'interest-rate', 'term-months', 'interest-paid'], update);
  update();
});
