import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const principal = getInputValue('tfd-principal');
  const rate = getInputValue('tfd-rate');
  const years = getInputValue('tfd-years');
  const isSenior = document.getElementById('tfd-senior')?.checked;
  const r = rate / 100;
  const n = 4; // quarterly
  const maturity = principal * Math.pow(1 + r / n, n * years);
  const interest = maturity - principal;
  const threshold = isSenior ? 50000 : 40000;
  const tdsRate = 0.10;
  const tds = interest > threshold ? (interest - threshold) * tdsRate : 0;
  const netInterest = interest - tds;
  setResult('tfd-interest', formatINR(interest));
  setResult('tfd-tds', formatINR(tds));
  setResult('tfd-net-interest', formatINR(netInterest));
  setResult('tfd-maturity', formatINR(maturity - tds));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['tfd-principal','tfd-rate','tfd-years'], update);
  const check = document.getElementById('tfd-senior');
  if (check) check.addEventListener('change', update);
  update();
});
