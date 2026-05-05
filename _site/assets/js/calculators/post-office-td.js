import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

const TD_RATES = { '1': 6.9, '2': 7.0, '3': 7.1, '5': 7.5 };

function update() {
  const principal = getInputValue('potd-principal');
  const years = document.getElementById('potd-years')?.value || '5';
  const rate = (TD_RATES[years] || 7.5) / 100;
  const n = 4;
  const maturity = principal * Math.pow(1 + rate / n, n * parseInt(years));
  const interest = maturity - principal;
  setResult('potd-rate', (rate * 100).toFixed(1) + '% p.a.');
  setResult('potd-interest', formatINR(interest));
  setResult('potd-maturity', formatINR(maturity));
  setResult('potd-invested', formatINR(principal));
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('potd-principal');
  const sel = document.getElementById('potd-years');
  if (el) el.addEventListener('input', update);
  if (sel) sel.addEventListener('change', update);
  update();
});
