import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ navStart, navEnd, years, dividends }) {
  if (navStart <= 0 || years <= 0) return { absoluteReturn: 0, cagrReturn: 0, moneyMultiplier: 0 };
  const totalEnd = navEnd + dividends;
  const absoluteReturn = ((totalEnd - navStart) / navStart) * 100;
  const cagrReturn = (Math.pow(totalEnd / navStart, 1 / years) - 1) * 100;
  const moneyMultiplier = totalEnd / navStart;
  return { absoluteReturn, cagrReturn, moneyMultiplier };
}

function update() {
  const navStart = getInputValue('nav-start');
  const navEnd = getInputValue('nav-end');
  const years = getInputValue('mf-years');
  const dividends = getInputValue('mf-dividends');
  const { absoluteReturn, cagrReturn, moneyMultiplier } = calculate({ navStart, navEnd, years, dividends });
  setResult('absolute-return', formatPercent(absoluteReturn, 1));
  setResult('cagr-return', formatPercent(cagrReturn));
  setResult('money-multiplier', moneyMultiplier.toFixed(2) + 'x');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['nav-start', 'nav-end', 'mf-years', 'mf-dividends'], update);
  update();
});
