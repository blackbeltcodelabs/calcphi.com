import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ principal, rate, years }) {
  const interest = principal * (rate / 100) * years;
  const maturity = principal + interest;
  return { interest, maturity };
}

function update() {
  const principal = getInputValue('ls-principal');
  const rate = getInputValue('ls-rate');
  const years = getInputValue('ls-years');
  const { interest, maturity } = calculate({ principal, rate, years });
  setResult('ls-maturity', formatINR(maturity));
  setResult('ls-gains', formatINR(interest));
  setResult('ls-cagr', formatPercent(rate));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ls-principal', 'ls-rate', 'ls-years'], update);
  update();
});
