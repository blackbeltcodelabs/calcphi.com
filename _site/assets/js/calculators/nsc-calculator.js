import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const principal = getInputValue('nsc-principal');
  const rate = getInputValue('nsc-rate') / 100;
  const years = 5;
  let corpus = principal;
  const yearData = [];
  let totalInterest = 0;
  for (let y = 1; y <= years; y++) {
    const interest = corpus * rate;
    corpus += interest;
    totalInterest += interest;
    yearData.push([y, formatINR(interest), formatINR(corpus)]);
  }
  setResult('nsc-maturity', formatINR(corpus));
  setResult('nsc-interest', formatINR(totalInterest));
  setResult('nsc-invested', formatINR(principal));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Year</th><th>Interest Earned</th><th>Value</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['nsc-principal','nsc-rate'], update);
  update();
});
