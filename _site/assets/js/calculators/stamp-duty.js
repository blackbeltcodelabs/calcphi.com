import { formatINR, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

const STATE_RATES = {
  maharashtra: { rate: 0.06, regn: 0.01, label: '6% + 1% registration' },
  karnataka: { rate: 0.03, regn: 0.01, label: '3% + 1% registration' },
  delhi: { rate: 0.06, regn: 0.01, label: '6% + 1% (4% for women)' },
  tamilnadu: { rate: 0.07, regn: 0.01, label: '7% + 4% registration' },
  gujarat: { rate: 0.045, regn: 0.01, label: '4.5% + 1%' },
  rajasthan: { rate: 0.06, regn: 0.01, label: '6% + 1%' },
  up: { rate: 0.07, regn: 0.01, label: '7% + 1%' },
  other: { rate: 0.05, regn: 0.01, label: '5% + 1% (approx)' }
};

function update() {
  const propValue = getInputValue('sd-value');
  const state = document.getElementById('sd-state')?.value || 'maharashtra';
  const info = STATE_RATES[state] || STATE_RATES.other;
  const stampDuty = propValue * info.rate;
  const regn = propValue * info.regn;
  const total = stampDuty + regn;
  setResult('sd-stamp', formatINR(stampDuty));
  setResult('sd-regn', formatINR(regn));
  setResult('sd-total', formatINR(total));
  setResult('sd-rate-label', info.label);
}

document.addEventListener('DOMContentLoaded', () => {
  const propEl = document.getElementById('sd-value');
  const stateEl = document.getElementById('sd-state');
  if (propEl) propEl.addEventListener('input', update);
  if (stateEl) stateEl.addEventListener('change', update);
  update();
});
