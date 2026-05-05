import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const income = getInputValue('s80d-income');
  const selfPremium = getInputValue('s80d-self');
  const parentPremium = getInputValue('s80d-parents');
  const isSeniorSelf = document.getElementById('s80d-senior-self')?.checked;
  const isSeniorParent = document.getElementById('s80d-senior-parent')?.checked;
  const selfLimit = isSeniorSelf ? 50000 : 25000;
  const parentLimit = isSeniorParent ? 50000 : 25000;
  const selfDeduction = Math.min(selfPremium, selfLimit);
  const parentDeduction = Math.min(parentPremium, parentLimit);
  const total = selfDeduction + parentDeduction;
  const taxRate = income > 1000000 ? 0.30 : income > 500000 ? 0.20 : 0.05;
  const saved = total * taxRate * 1.04;
  setResult('s80d-self-ded', formatINR(selfDeduction));
  setResult('s80d-parent-ded', formatINR(parentDeduction));
  setResult('s80d-total', formatINR(total));
  setResult('s80d-saved', formatINR(saved));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['s80d-income','s80d-self','s80d-parents'], update);
  const checks = document.querySelectorAll('input[type="checkbox"]');
  checks.forEach(c => c.addEventListener('change', update));
  update();
});
