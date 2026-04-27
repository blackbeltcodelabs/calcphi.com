import { formatINR, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calculate({ basic, hraReceived, rentPaid, city }) {
  const annualBasic = basic * 12;
  const annualHRA = hraReceived * 12;
  const annualRent = rentPaid * 12;
  const metroFactor = city === 'metro' ? 0.5 : 0.4;

  const a = annualHRA;
  const b = annualBasic * metroFactor;
  const c = Math.max(0, annualRent - annualBasic * 0.1);

  const exemption = Math.min(a, b, c);
  const taxableHRA = annualHRA - exemption;
  return { exemption, taxableHRA };
}

function update() {
  const basic = getInputValue('basic-salary');
  const hraReceived = getInputValue('hra-received');
  const rentPaid = getInputValue('rent-paid');
  const city = getSelectValue('city-type') || 'metro';
  const { exemption, taxableHRA } = calculate({ basic, hraReceived, rentPaid, city });
  setResult('hra-exemption', formatINR(exemption));
  setResult('taxable-hra', formatINR(taxableHRA));

  const breakdown = document.getElementById('calculation-breakdown');
  if (breakdown) {
    const a = hraReceived * 12;
    const b = basic * 12 * (city === 'metro' ? 0.5 : 0.4);
    const c = Math.max(0, rentPaid * 12 - basic * 12 * 0.1);
    breakdown.innerHTML = `
      <small style="display:block;margin-top:0.5rem;color:var(--color-text-secondary);font-size:0.8rem">
        Min of: (a) ${formatINR(a)} HRA received &nbsp;|&nbsp;
        (b) ${formatINR(b)} (${city === 'metro' ? '50' : '40'}% of basic) &nbsp;|&nbsp;
        (c) ${formatINR(c)} (rent − 10% basic) = <strong>${formatINR(exemption)}</strong>
      </small>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['basic-salary', 'hra-received', 'rent-paid'], update);
  const sel = document.getElementById('city-type');
  if (sel) sel.addEventListener('change', update);
  update();
});
