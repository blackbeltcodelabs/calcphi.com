import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const basic = getInputValue('le-basic');
  const leaves = getInputValue('le-leaves');
  const isRetirement = document.getElementById('le-retirement')?.checked;
  const encashment = basic / 26 * leaves;
  const taxFree = isRetirement ? Math.min(encashment, 2500000) : 0;
  const taxable = encashment - taxFree;
  setResult('le-amount', formatINR(encashment));
  setResult('le-tax-free', formatINR(taxFree));
  setResult('le-taxable', formatINR(taxable));
  setResult('le-daily-rate', formatINR(basic / 26));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['le-basic','le-leaves'], update);
  const check = document.getElementById('le-retirement');
  if (check) check.addEventListener('change', update);
  update();
});
