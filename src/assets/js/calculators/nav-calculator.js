import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ units, currentNAV, purchaseNAV, years }) {
  const currentValue = units * currentNAV;
  const cost = units * purchaseNAV;
  const profitLoss = currentValue - cost;
  let navCAGR = 0;
  if (purchaseNAV > 0 && years > 0) {
    navCAGR = (Math.pow(currentNAV / purchaseNAV, 1 / years) - 1) * 100;
  }
  return { currentValue, profitLoss, navCAGR };
}

function update() {
  const units = getInputValue('nav-units');
  const currentNAV = getInputValue('current-nav');
  const purchaseNAV = getInputValue('purchase-nav');
  const years = getInputValue('nav-years');
  const { currentValue, profitLoss, navCAGR } = calculate({ units, currentNAV, purchaseNAV, years });
  setResult('current-value', formatINR(currentValue));
  setResult('profit-loss', formatINR(profitLoss));
  setResult('nav-cagr', formatPercent(navCAGR));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['nav-units', 'current-nav', 'purchase-nav', 'nav-years'], update);
  update();
});
