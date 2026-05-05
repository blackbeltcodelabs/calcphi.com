import { formatINR, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ monthly, rate, months }) {
  // Indian bank RD: quarterly compounding
  const r = rate / 400; // quarterly rate
  const quarters = months / 3;
  // Each monthly deposit earns interest differently
  // Standard RD maturity formula: M = R * [(1+r)^n - 1] / [1 - (1+r)^(-1/3)]
  let maturity = 0;
  for (let m = 1; m <= months; m++) {
    const quartersRemaining = (months - m + 1) / 3;
    maturity += monthly * Math.pow(1 + r, quartersRemaining);
  }
  const invested = monthly * months;
  const interest = maturity - invested;
  return { maturity, invested, interest };
}

function update() {
  const monthly = getInputValue('monthly-deposit');
  const rate = getInputValue('rd-rate');
  const months = getInputValue('rd-tenure');
  const { maturity, invested, interest } = calculate({ monthly, rate, months });
  setResult('total-deposited', formatINR(invested));
  setResult('rd-interest', formatINR(interest));
  setResult('rd-maturity', formatINR(maturity));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['monthly-deposit', 'rd-rate', 'rd-tenure'], update);
  update();
});
