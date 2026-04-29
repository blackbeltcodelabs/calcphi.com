import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const basic = getInputValue('epf-basic');
  const years = getInputValue('epf-years');
  const rate = getInputValue('epf-rate') / 100;
  const empContrib = basic * 0.12;
  const emplContrib = basic * 0.0367;
  const annualContrib = (empContrib + emplContrib) * 12;
  let corpus = 0;
  const yearData = [];
  for (let y = 1; y <= years; y++) {
    corpus = (corpus + annualContrib) * (1 + rate);
    yearData.push([y, formatINR(annualContrib * y), formatINR(corpus)]);
  }
  const totalInvested = annualContrib * years;
  setResult('epf-annual-contrib', formatINR(annualContrib));
  setResult('epf-total-invested', formatINR(totalInvested));
  setResult('epf-corpus', formatINR(corpus));
  setResult('epf-returns', formatINR(corpus - totalInvested));
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (head) head.innerHTML = '<tr><th>Year</th><th>Total Invested</th><th>EPF Corpus</th></tr>';
  if (body) body.innerHTML = buildTableRows(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['epf-basic','epf-years','epf-rate'], update);
  update();
});
