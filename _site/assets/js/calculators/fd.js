import { formatINR, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calculate({ principal, rate, years, months, compounding }) {
  const t = years + months / 12;
  const r = rate / 100;
  let maturity;
  if (compounding === 'simple') {
    maturity = principal * (1 + r * t);
  } else {
    const n = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1;
    maturity = principal * Math.pow(1 + r / n, n * t);
  }
  const interest = maturity - principal;
  const effectiveRate = compounding === 'simple' ? rate : (Math.pow(maturity / principal, 1 / t) - 1) * 100;
  return { maturity, interest, effectiveRate };
}

function update() {
  const principal = getInputValue('fd-principal');
  const rate = getInputValue('fd-rate');
  const years = getInputValue('fd-tenure-years');
  const months = getInputValue('fd-tenure-months');
  const compounding = getSelectValue('fd-compounding') || 'quarterly';
  const { maturity, interest, effectiveRate } = calculate({ principal, rate, years, months, compounding });
  setResult('maturity-amount', formatINR(maturity));
  setResult('interest-earned', formatINR(interest));
  setResult('effective-rate', formatPercent(effectiveRate));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['fd-principal', 'fd-rate', 'fd-tenure-years', 'fd-tenure-months'], update);
  const sel = document.getElementById('fd-compounding');
  if (sel) sel.addEventListener('change', update);
  update();
});
