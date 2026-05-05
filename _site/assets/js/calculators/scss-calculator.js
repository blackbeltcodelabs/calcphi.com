import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const principal = getInputValue('scss-principal');
  const rate = getInputValue('scss-rate') / 100;
  const years = getInputValue('scss-years');
  const quarterlyInterest = principal * rate / 4;
  const annualInterest = principal * rate;
  const totalInterest = annualInterest * years;
  const maturity = principal + totalInterest;
  const yearData = [];
  for (let y = 1; y <= years; y++) {
    yearData.push([y, formatINR(annualInterest), formatINR(annualInterest * y), formatINR(principal)]);
  }
  setResult('scss-quarterly', formatINR(quarterlyInterest));
  setResult('scss-annual', formatINR(annualInterest));
  setResult('scss-total-interest', formatINR(totalInterest));
  setResult('scss-maturity', formatINR(maturity));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Year</th><th>Annual Interest</th><th>Cumulative Interest</th><th>Principal</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['scss-principal','scss-rate','scss-years'], update);
  update();
});
