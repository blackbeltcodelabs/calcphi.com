import { formatINR, formatPercent, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const premium = getInputValue('ulip-premium');
  const rate = getInputValue('ulip-rate') / 100;
  const years = getInputValue('ulip-years');
  const allocationCharge = 0.05;
  const fmc = 0.0135;
  const effectiveRate = rate - fmc;
  let corpus = 0;
  const yearData = [];
  for (let y = 1; y <= years; y++) {
    const invested = premium * (1 - (y === 1 ? allocationCharge : 0.02));
    corpus = (corpus + invested) * (1 + effectiveRate);
    yearData.push([y, formatINR(premium * y), formatINR(corpus)]);
  }
  const mfCorpus = premium * ((Math.pow(1 + rate - 0.003, years) - 1) / (rate - 0.003)) * (1 + rate - 0.003);
  setResult('ulip-corpus', formatINR(corpus));
  setResult('ulip-mf-compare', formatINR(mfCorpus));
  setResult('ulip-invested', formatINR(premium * years));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Year</th><th>Premiums Paid</th><th>ULIP Value</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ulip-premium','ulip-rate','ulip-years'], update);
  update();
});
