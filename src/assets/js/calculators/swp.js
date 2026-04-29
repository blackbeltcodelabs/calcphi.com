import { formatINR, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ corpus, monthly, rate, years }) {
  if (rate === 0) {
    const totalWithdrawn = monthly * years * 12;
    const remaining = Math.max(0, corpus - totalWithdrawn);
    return { remaining, totalWithdrawn, totalReturns: 0, yearData: [] };
  }
  const r = rate / 12 / 100;
  const n = years * 12;
  // FV = corpus × (1+r)^n - monthly × ((1+r)^n - 1)/r
  const growth = Math.pow(1 + r, n);
  const remaining = corpus * growth - monthly * ((growth - 1) / r);
  const totalWithdrawn = monthly * n;
  const totalReturns = remaining + totalWithdrawn - corpus;

  const yearData = [];
  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const g = Math.pow(1 + r, months);
    const bal = corpus * g - monthly * ((g - 1) / r);
    const withdrawn = monthly * months;
    yearData.push([y, formatINR(withdrawn), formatINR(Math.max(0, bal))]);
  }
  return { remaining: Math.max(0, remaining), totalWithdrawn, totalReturns, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th scope="col">Year</th><th scope="col">Total Withdrawn (₹)</th><th scope="col">Remaining Corpus (₹)</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const corpus = getInputValue('swp-corpus');
  const monthly = getInputValue('monthly-withdrawal');
  const rate = getInputValue('swp-rate');
  const years = getInputValue('swp-years');
  const { remaining, totalWithdrawn, totalReturns, yearData } = calculate({ corpus, monthly, rate, years });
  setResult('remaining-corpus', formatINR(remaining));
  setResult('total-withdrawn', formatINR(totalWithdrawn));
  setResult('total-returns', formatINR(totalReturns));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['swp-corpus', 'monthly-withdrawal', 'swp-rate', 'swp-years'], update);
  update();
});
