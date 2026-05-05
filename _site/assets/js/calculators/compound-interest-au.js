import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs, buildTableRows } from '../ui.js';

const CONTRIB_PERIODS = { monthly: 12, quarterly: 4, annually: 1, fortnightly: 26 };
const COMPOUND_PERIODS = { monthly: 12, quarterly: 4, annually: 1, daily: 365 };

function calculate({ principal, regularContribution, contributionFrequency, interestRate, compoundFrequency, years }) {
  const n = COMPOUND_PERIODS[compoundFrequency] || 12;
  const cf = CONTRIB_PERIODS[contributionFrequency] || 12;
  const r = interestRate / 100 / n;
  const totalPeriods = years * n;
  let balance = principal;
  let totalContributed = principal;
  const yearData = [];

  for (let period = 1; period <= totalPeriods; period++) {
    balance = balance * (1 + r);
    const contribsThisPeriod = (cf / n);
    balance += regularContribution * contribsThisPeriod;
    totalContributed += regularContribution * contribsThisPeriod;
    if (period % n === 0) {
      const yr = period / n;
      yearData.push([yr, formatAUD(totalContributed), formatAUD(balance - totalContributed), formatAUD(balance)]);
    }
  }

  const totalInterest = balance - totalContributed;
  const effectiveReturn = principal > 0 ? ((balance / principal) ** (1 / years) - 1) * 100 : 0;
  return { finalValue: balance, totalContributed, totalInterest, effectiveReturn, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th>Year</th><th>Total Contributed</th><th>Interest Earned</th><th>Balance</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const principal = getInputValue('principal');
  const regularContribution = getInputValue('regular-contribution');
  const contributionFrequency = getSelectValue('contribution-frequency');
  const interestRate = getInputValue('interest-rate');
  const compoundFrequency = getSelectValue('compound-frequency');
  const years = getInputValue('years');
  const { finalValue, totalContributed, totalInterest, effectiveReturn, yearData } = calculate({ principal, regularContribution, contributionFrequency, interestRate, compoundFrequency, years });
  setResult('final-value', formatAUD(finalValue));
  setResult('total-contributed', formatAUD(totalContributed));
  setResult('total-interest', formatAUD(totalInterest));
  setResult('effective-return', formatPercent(effectiveReturn));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['principal', 'regular-contribution', 'contribution-frequency', 'interest-rate', 'compound-frequency', 'years'], update);
  update();
});
