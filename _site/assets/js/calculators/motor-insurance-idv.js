import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

const DEP_RATES = [0.05, 0.15, 0.25, 0.35, 0.45, 0.50];

function update() {
  const price = getInputValue('idv-price');
  const age = Math.min(Math.floor(getInputValue('idv-age')), 5);
  const depRate = DEP_RATES[age] || 0.50;
  const idv = price * (1 - depRate);
  const premiumRate = 0.0315;
  const ownDamage = idv * premiumRate;
  const tp = age === 0 ? 2094 : 1897;
  const total = ownDamage + tp;
  setResult('idv-value', formatINR(idv));
  setResult('idv-depreciation', (depRate * 100).toFixed(0) + '%');
  setResult('idv-od-premium', formatINR(ownDamage));
  setResult('idv-tp', formatINR(tp));
  setResult('idv-total', formatINR(total));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['idv-price','idv-age'], update);
  update();
});
