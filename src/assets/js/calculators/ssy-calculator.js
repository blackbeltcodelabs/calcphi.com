import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const annual = getInputValue('ssy-annual');
  const rate = getInputValue('ssy-rate') / 100;
  const girlAge = getInputValue('ssy-age');
  let corpus = 0;
  const depositYears = 15;
  const maturityYear = 21;
  const yearData = [];
  for (let y = 1; y <= maturityYear; y++) {
    if (y <= depositYears) corpus += annual;
    corpus *= (1 + rate);
    if (y <= depositYears) yearData.push([y, formatINR(annual * y), formatINR(corpus)]);
  }
  setResult('ssy-corpus', formatINR(corpus));
  setResult('ssy-invested', formatINR(annual * depositYears));
  setResult('ssy-interest', formatINR(corpus - annual * depositYears));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Year</th><th>Total Deposited</th><th>Balance</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ssy-annual','ssy-rate','ssy-age'], update);
  update();
});
