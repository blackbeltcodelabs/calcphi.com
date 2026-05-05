import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const amount = getInputValue('fvrd-amount');
  const rate = getInputValue('fvrd-rate') / 100;
  const years = getInputValue('fvrd-years');
  // FD: lumpsum = amount invested once
  const fdMaturity = amount * Math.pow(1 + rate / 4, 4 * years);
  const fdInterest = fdMaturity - amount;
  // RD: same total = amount; monthly = amount / (years*12)
  const monthly = amount / (years * 12);
  const r = rate / 12;
  const n = years * 12;
  const rdMaturity = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const rdInterest = rdMaturity - amount;
  setResult('fvrd-fd-maturity', formatINR(fdMaturity));
  setResult('fvrd-fd-interest', formatINR(fdInterest));
  setResult('fvrd-rd-maturity', formatINR(rdMaturity));
  setResult('fvrd-rd-interest', formatINR(rdInterest));
  setResult('fvrd-advantage', formatINR(fdMaturity - rdMaturity));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['fvrd-amount','fvrd-rate','fvrd-years'], update);
  update();
});
