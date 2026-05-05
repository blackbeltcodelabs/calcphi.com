import { formatAUD, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ currentAge, retirementAge, currentSuper, annualSalary, superRate, extraContributions, investmentReturn }) {
  const years = Math.max(0, retirementAge - currentAge);
  const r = investmentReturn / 100;
  let balance = currentSuper;
  const yearData = [];
  for (let yr = 1; yr <= years; yr++) {
    const employerContrib = annualSalary * superRate / 100;
    const totalContrib = employerContrib + extraContributions;
    balance = balance * (1 + r) + totalContrib;
    yearData.push([currentAge + yr, formatAUD(totalContrib), formatAUD(balance)]);
  }
  const totalContributions = (annualSalary * superRate / 100 + extraContributions) * years;
  const totalGrowth = balance - currentSuper - totalContributions;
  const annualDrawdown = balance / 20;
  return { superAtRetirement: balance, totalContributions, totalGrowth, annualDrawdown, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th>Age</th><th>Annual Contributions</th><th>Balance</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const currentAge = getInputValue('current-age');
  const retirementAge = getInputValue('retirement-age');
  const currentSuper = getInputValue('current-super');
  const annualSalary = getInputValue('annual-salary');
  const superRate = getInputValue('super-rate');
  const extraContributions = getInputValue('extra-contributions');
  const investmentReturn = getInputValue('investment-return');
  const { superAtRetirement, totalContributions, totalGrowth, annualDrawdown, yearData } = calculate({ currentAge, retirementAge, currentSuper, annualSalary, superRate, extraContributions, investmentReturn });
  setResult('super-at-retirement', formatAUD(superAtRetirement));
  setResult('total-contributions', formatAUD(totalContributions));
  setResult('total-growth', formatAUD(totalGrowth));
  setResult('annual-drawdown', formatAUD(annualDrawdown));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['current-age', 'retirement-age', 'current-super', 'annual-salary', 'super-rate', 'extra-contributions', 'investment-return'], update);
  update();
});
