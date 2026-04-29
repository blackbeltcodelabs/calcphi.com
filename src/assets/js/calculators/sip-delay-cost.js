import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function sipMaturity(monthly, rate, years) {
  if (years <= 0) return 0;
  if (rate === 0) return monthly * years * 12;
  const r = rate / 12 / 100;
  const n = years * 12;
  return monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function update() {
  const monthly = getInputValue('sdc-monthly');
  const rate = getInputValue('sdc-rate');
  const totalYears = getInputValue('sdc-total-years');
  const delayYears = getInputValue('sdc-delay-years');

  const corpusNow = sipMaturity(monthly, rate, totalYears);
  const corpusDelayed = sipMaturity(monthly, rate, totalYears - delayYears);
  const costOfDelay = corpusNow - corpusDelayed;

  setResult('corpus-now', formatINR(corpusNow));
  setResult('corpus-delayed', formatINR(corpusDelayed));
  setResult('cost-of-delay', formatINR(costOfDelay));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['sdc-monthly', 'sdc-rate', 'sdc-total-years', 'sdc-delay-years'], update);
  update();
});
