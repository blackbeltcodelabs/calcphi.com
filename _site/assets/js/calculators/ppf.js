import { formatINR, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ annual, rate, years }) {
  const r = rate / 100;
  let balance = 0;
  const yearData = [];
  let totalInvested = 0;
  for (let y = 1; y <= years; y++) {
    balance = (balance + annual) * (1 + r);
    totalInvested += annual;
    yearData.push([y, formatINR(totalInvested), formatINR(balance - totalInvested), formatINR(balance)]);
  }
  return { maturity: balance, invested: totalInvested, interest: balance - totalInvested, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th scope="col">Year</th><th scope="col">Total Invested (₹)</th><th scope="col">Interest Earned (₹)</th><th scope="col">Balance (₹)</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const annual = getInputValue('annual-investment');
  const rate = getInputValue('ppf-rate');
  const years = getInputValue('ppf-tenure');
  const { maturity, invested, interest, yearData } = calculate({ annual, rate, years });
  setResult('total-invested', formatINR(invested));
  setResult('total-interest', formatINR(interest));
  setResult('maturity-value', formatINR(maturity));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['annual-investment', 'ppf-rate', 'ppf-tenure'], update);
  update();
});
