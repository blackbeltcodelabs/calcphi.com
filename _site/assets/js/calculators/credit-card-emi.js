import { formatINR, formatPercent, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const amount = getInputValue('cc-amount');
  const flatRate = getInputValue('cc-rate') / 100 / 12;
  const months = getInputValue('cc-months');
  const interest = amount * flatRate * months;
  const emi = (amount + interest) / months;
  const total = emi * months;
  // Effective annual rate (IRR approximation)
  const r = flatRate * 1.85; // flat to effective ~
  const effectiveRate = (Math.pow(1 + r, 12) - 1) * 100;
  setResult('cc-emi', formatINR(emi));
  setResult('cc-total-interest', formatINR(interest));
  setResult('cc-total', formatINR(total));
  setResult('cc-effective-rate', effectiveRate.toFixed(1) + '% p.a.');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['cc-amount','cc-rate','cc-months'], update);
  update();
});
