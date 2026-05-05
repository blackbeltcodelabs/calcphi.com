import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ monthly, rate, years }) {
  const r = rate / 12 / 100;
  const n = years * 12;

  // SIP maturity
  let sipMaturity;
  if (rate === 0) {
    sipMaturity = monthly * n;
  } else {
    sipMaturity = monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }

  // Equivalent lumpsum: total invested in SIP = monthly × 12 × years
  const lumpsumPrincipal = monthly * 12 * years;
  const lumpsumMaturity = lumpsumPrincipal * Math.pow(1 + rate / 100, years);

  const sipAdvantage = sipMaturity - lumpsumMaturity;

  return { sipMaturity, lumpsumMaturity, sipAdvantage, lumpsumPrincipal };
}

function update() {
  const monthly = getInputValue('sip-monthly');
  const rate = getInputValue('sip-rate');
  const years = getInputValue('sip-years');
  const { sipMaturity, lumpsumMaturity, sipAdvantage } = calculate({ monthly, rate, years });
  setResult('sip-maturity', formatINR(sipMaturity));
  setResult('lumpsum-maturity', formatINR(lumpsumMaturity));
  setResult('sip-advantage', (sipAdvantage >= 0 ? '+' : '') + formatINR(sipAdvantage).replace('₹-', '-₹'));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['sip-monthly', 'sip-rate', 'sip-years'], update);
  update();
});
