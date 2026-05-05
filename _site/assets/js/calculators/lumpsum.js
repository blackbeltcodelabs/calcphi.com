import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ principal, rate, years }) {
  const r = rate / 100;
  const maturity = principal * Math.pow(1 + r, years);
  const gains = maturity - principal;
  const cagr = (Math.pow(maturity / principal, 1 / years) - 1) * 100;
  return { maturity, gains, cagr };
}

function update() {
  const principal = getInputValue('ls-principal');
  const rate = getInputValue('ls-rate');
  const years = getInputValue('ls-years');
  const { maturity, gains, cagr } = calculate({ principal, rate, years });
  setResult('ls-maturity', formatINR(maturity));
  setResult('ls-gains', formatINR(gains));
  setResult('ls-cagr', formatPercent(cagr));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ls-principal', 'ls-rate', 'ls-years'], update);
  update();
});
