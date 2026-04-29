import { formatINR, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

const PT_SLABS = {
  maharashtra: [[7500,0],[10000,175],[Infinity,200]],
  karnataka: [[15000,0],[Infinity,200]],
  westbengal: [[8500,0],[10000,90],[15000,110],[25000,130],[40000,150],[Infinity,200]],
  tamilnadu: [[3500,0],[5000,60],[10000,120],[20000,195],[Infinity,208]],
  other: [[10000,0],[Infinity,200]]
};

function update() {
  const salary = getInputValue('pt-salary');
  const state = document.getElementById('pt-state')?.value || 'maharashtra';
  const slabs = PT_SLABS[state] || PT_SLABS.other;
  let monthly = 0;
  for (const [limit, amount] of slabs) {
    if (salary <= limit) { monthly = amount; break; }
  }
  setResult('pt-monthly', formatINR(monthly));
  setResult('pt-annual', formatINR(monthly * 12));
  setResult('pt-tax-saved', formatINR(monthly * 12 * 0.30));
}

document.addEventListener('DOMContentLoaded', () => {
  const salaryEl = document.getElementById('pt-salary');
  const stateEl = document.getElementById('pt-state');
  if (salaryEl) salaryEl.addEventListener('input', update);
  if (stateEl) stateEl.addEventListener('change', update);
  update();
});
