import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function computeSlab(income) {
  if (income > 1000000) return 0.30;
  if (income > 500000) return 0.20;
  if (income > 250000) return 0.05;
  return 0;
}

function update() {
  const income = getInputValue('hlt-income');
  const interest = getInputValue('hlt-interest');
  const principal = getInputValue('hlt-principal');
  const interestDed = Math.min(interest, 200000);
  const principalDed = Math.min(principal, 150000);
  const totalDed = interestDed + principalDed;
  const slab = computeSlab(income);
  const saved = totalDed * slab * 1.04;
  setResult('hlt-interest-ded', formatINR(interestDed));
  setResult('hlt-principal-ded', formatINR(principalDed));
  setResult('hlt-total-saved', formatINR(saved));
  setResult('hlt-effective-rate', (slab * 100).toFixed(0) + '%');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['hlt-income','hlt-interest','hlt-principal'], update);
  update();
});
