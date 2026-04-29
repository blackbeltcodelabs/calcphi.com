import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const income = getInputValue('lin-income');
  const age = getInputValue('lin-age');
  const liabilities = getInputValue('lin-liabilities');
  const assets = getInputValue('lin-assets');
  const expenses = getInputValue('lin-expenses') / 100;
  const yearsToRetire = Math.max(0, 60 - age);
  const r = 0.07;
  const pv = income * 12 * expenses * (1 - Math.pow(1 + r, -yearsToRetire)) / r;
  const cover = Math.max(0, pv + liabilities - assets);
  setResult('lin-cover', formatINR(Math.ceil(cover / 1000000) * 1000000));
  setResult('lin-pv-income', formatINR(pv));
  setResult('lin-multiple', (cover / (income * 12)).toFixed(0) + 'x income');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['lin-income','lin-age','lin-liabilities','lin-assets','lin-expenses'], update);
  update();
});
