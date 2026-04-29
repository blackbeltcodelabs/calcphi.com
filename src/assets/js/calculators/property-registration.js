import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const propValue = getInputValue('pr-value');
  const state = document.getElementById('pr-state')?.value || 'maharashtra';
  const isWoman = document.getElementById('pr-woman')?.checked;
  const rates = {
    maharashtra: { stamp: isWoman ? 0.05 : 0.06, regn: 0.01 },
    karnataka: { stamp: 0.03, regn: 0.01 },
    delhi: { stamp: isWoman ? 0.04 : 0.06, regn: 0.01 },
    tamilnadu: { stamp: 0.07, regn: 0.04 },
    other: { stamp: 0.05, regn: 0.01 }
  };
  const r = rates[state] || rates.other;
  const stamp = propValue * r.stamp;
  const regn = propValue * r.regn;
  const legal = 10000;
  const total = stamp + regn + legal;
  setResult('pr-stamp', formatINR(stamp));
  setResult('pr-regn', formatINR(regn));
  setResult('pr-legal', formatINR(legal));
  setResult('pr-total', formatINR(total));
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('pr-value');
  const stateEl = document.getElementById('pr-state');
  const womanEl = document.getElementById('pr-woman');
  if (el) el.addEventListener('input', update);
  if (stateEl) stateEl.addEventListener('change', update);
  if (womanEl) womanEl.addEventListener('change', update);
  update();
});
