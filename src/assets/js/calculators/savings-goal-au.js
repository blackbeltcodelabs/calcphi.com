import { formatAUD, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ targetAmount, currentSavings, monthlySavings, annualReturn }) {
  const r = annualReturn / 100 / 12;
  const gap = targetAmount - currentSavings;
  if (gap <= 0) {
    return { monthsToGoal: 0, totalContributions: 0, interestEarned: 0, requiredMonthly: 0 };
  }

  let months = 0;
  let balance = currentSavings;
  const maxMonths = 600;
  while (balance < targetAmount && months < maxMonths) {
    balance = balance * (1 + r) + monthlySavings;
    months++;
  }

  const monthsToGoal = balance >= targetAmount ? months : null;
  const totalContributions = monthlySavings * (monthsToGoal || 0);
  const interestEarned = (monthsToGoal ? targetAmount : 0) - currentSavings - totalContributions;

  // Required monthly to hit target in 24 months
  const n = 24;
  const fvFactor = r > 0 ? ((Math.pow(1 + r, n) - 1) / r) : n;
  const fvCurrent = currentSavings * Math.pow(1 + r, n);
  const neededFromSavings = targetAmount - fvCurrent;
  const requiredMonthly = neededFromSavings > 0 && fvFactor > 0 ? neededFromSavings / fvFactor : 0;

  return { monthsToGoal, totalContributions, interestEarned: Math.max(0, interestEarned), requiredMonthly: Math.max(0, requiredMonthly) };
}

function formatMonths(months) {
  if (months === null) return 'Over 50 years';
  if (months === 0) return 'Already reached!';
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return mo + ' month' + (mo !== 1 ? 's' : '');
  if (mo === 0) return yrs + ' year' + (yrs !== 1 ? 's' : '');
  return yrs + ' yr ' + mo + ' mo';
}

function update() {
  const targetAmount = getInputValue('target-amount');
  const currentSavings = getInputValue('current-savings');
  const monthlySavings = getInputValue('monthly-savings');
  const annualReturn = getInputValue('annual-return');
  const { monthsToGoal, totalContributions, interestEarned, requiredMonthly } = calculate({
    targetAmount, currentSavings, monthlySavings, annualReturn
  });
  setResult('months-to-goal', formatMonths(monthsToGoal));
  setResult('total-contributions', formatAUD(totalContributions));
  setResult('interest-earned', formatAUD(interestEarned));
  setResult('required-monthly', formatAUD(requiredMonthly) + ' /mo');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['target-amount', 'current-savings', 'monthly-savings', 'annual-return'], update);
  update();
});
