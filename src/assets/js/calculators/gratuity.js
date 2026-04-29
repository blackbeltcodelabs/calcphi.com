import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const basic = getInputValue('gr-basic');
  const years = getInputValue('gr-years');
  const covered = document.getElementById('gr-covered')?.checked !== false;
  let gratuity;
  if (covered) {
    gratuity = basic * 15 / 26 * years;
  } else {
    gratuity = basic * 15 / 30 * years;
  }
  const taxFree = Math.min(gratuity, 2000000);
  const taxable = Math.max(0, gratuity - 2000000);
  setResult('gr-gratuity', formatINR(gratuity));
  setResult('gr-tax-free', formatINR(taxFree));
  setResult('gr-taxable', formatINR(taxable));
  setResult('gr-per-year', formatINR(gratuity / Math.max(years, 1)));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['gr-basic','gr-years'], update);
  const check = document.getElementById('gr-covered');
  if (check) check.addEventListener('change', update);
  update();
});
