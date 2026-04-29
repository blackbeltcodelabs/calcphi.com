import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ initialValue, finalValue, years }) {
  if (initialValue <= 0 || years <= 0) return { cagr: 0, absoluteReturns: 0, absolutePercent: 0 };
  const cagr = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  const absoluteReturns = finalValue - initialValue;
  const absolutePercent = ((finalValue - initialValue) / initialValue) * 100;
  return { cagr, absoluteReturns, absolutePercent };
}

function update() {
  const initialValue = getInputValue('initial-value');
  const finalValue = getInputValue('final-value');
  const years = getInputValue('cagr-years');
  const { cagr, absoluteReturns, absolutePercent } = calculate({ initialValue, finalValue, years });
  setResult('cagr-result', formatPercent(cagr));
  setResult('absolute-returns', formatINR(absoluteReturns));
  setResult('absolute-percent', formatPercent(absolutePercent, 1));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['initial-value', 'final-value', 'cagr-years'], update);
  update();
});
