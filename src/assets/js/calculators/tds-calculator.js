import { formatINR, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

const TDS_RATES = {
  salary: 0, fd: 0.10, rent: 0.10, professional: 0.10, commission: 0.05, lottery: 0.30
};

function update() {
  const income = getInputValue('tds-income');
  const incomeType = document.getElementById('tds-type')?.value || 'fd';
  const rate = TDS_RATES[incomeType] || 0.10;
  const tds = income * rate;
  const net = income - tds;
  setResult('tds-amount', formatINR(tds));
  setResult('tds-net', formatINR(net));
  setResult('tds-rate', (rate * 100).toFixed(0) + '%');
}

document.addEventListener('DOMContentLoaded', () => {
  const incomeEl = document.getElementById('tds-income');
  const typeEl = document.getElementById('tds-type');
  if (incomeEl) incomeEl.addEventListener('input', update);
  if (typeEl) typeEl.addEventListener('change', update);
  update();
});
