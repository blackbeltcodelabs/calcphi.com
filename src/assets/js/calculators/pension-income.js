import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const corpus = getInputValue('pi-corpus');
  const rate = getInputValue('pi-rate') / 100;
  const years = getInputValue('pi-years');
  const r = rate / 12;
  const n = years * 12;
  const monthly = corpus * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = monthly * n;
  const interest = total - corpus;
  setResult('pi-monthly', formatINR(monthly));
  setResult('pi-total-withdrawn', formatINR(total));
  setResult('pi-interest-earned', formatINR(interest));
  setResult('pi-annual', formatINR(monthly * 12));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['pi-corpus','pi-rate','pi-years'], update);
  update();
});
