import { formatINR, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ monthly, rate, years }) {
  if (rate === 0) {
    const invested = monthly * years * 12;
    return { maturity: invested, invested, returns: 0, yearData: [] };
  }
  const r = rate / 12 / 100;
  const n = years * 12;
  const maturity = monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const invested = monthly * n;
  const yearData = [];
  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const val = monthly * (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
    const inv = monthly * months;
    yearData.push([y, formatINR(inv), formatINR(val - inv), formatINR(val)]);
  }
  return { maturity, invested, returns: maturity - invested, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th scope="col">Year</th><th scope="col">Invested (₹)</th><th scope="col">Returns (₹)</th><th scope="col">Total Value (₹)</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const monthly = getInputValue('monthly-investment');
  const rate = getInputValue('return-rate');
  const years = getInputValue('tenure');
  const { maturity, invested, returns, yearData } = calculate({ monthly, rate, years });
  setResult('total-invested', formatINR(invested));
  setResult('estimated-returns', formatINR(returns));
  setResult('total-wealth', formatINR(maturity));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['monthly-investment', 'return-rate', 'tenure'], update);
  update();
});
