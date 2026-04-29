import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const loan = getInputValue('hli-loan');
  const rate = getInputValue('hli-rate') / 12 / 100;
  const years = getInputValue('hli-years');
  const n = years * 12;
  const emi = calcEmi(loan, rate, n);
  const annualPremium = loan * 0.004;
  const totalPremium = annualPremium * years;
  const monthlyPremium = annualPremium / 12;
  setResult('hli-emi', formatINR(emi));
  setResult('hli-annual-premium', formatINR(annualPremium));
  setResult('hli-monthly-premium', formatINR(monthlyPremium));
  setResult('hli-total-premium', formatINR(totalPremium));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['hli-loan','hli-rate','hli-years'], update);
  update();
});
