import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const principal = getInputValue('kvp-principal');
  const rate = getInputValue('kvp-rate') / 100;
  const doublingMonths = Math.ceil(Math.log(2) / Math.log(1 + rate / 12));
  const doublingYears = (doublingMonths / 12).toFixed(1);
  const maturity = principal * 2;
  const yearData = [];
  for (let y = 1; y <= Math.ceil(doublingMonths / 12); y++) {
    const n = y * 12;
    const val = principal * Math.pow(1 + rate / 12, n);
    yearData.push([y, formatINR(principal), formatINR(val)]);
  }
  setResult('kvp-maturity', formatINR(maturity));
  setResult('kvp-doubling', doublingYears + ' years');
  setResult('kvp-interest', formatINR(principal));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Year</th><th>Invested</th><th>Value</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['kvp-principal','kvp-rate'], update);
  update();
});
