import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ goalAmount, years, rate }) {
  if (rate === 0) {
    const n = years * 12;
    const requiredSIP = goalAmount / n;
    return { requiredSIP, totalInvestment: goalAmount, expectedReturns: 0 };
  }
  const r = rate / 12 / 100;
  const n = years * 12;
  // Required monthly SIP = FV × r / (((1+r)^n - 1) × (1+r))
  const requiredSIP = goalAmount * r / ((Math.pow(1 + r, n) - 1) * (1 + r));
  const totalInvestment = requiredSIP * n;
  const expectedReturns = goalAmount - totalInvestment;
  return { requiredSIP, totalInvestment, expectedReturns };
}

function update() {
  const goalAmount = getInputValue('goal-amount');
  const years = getInputValue('goal-years');
  const rate = getInputValue('goal-rate');
  const { requiredSIP, totalInvestment, expectedReturns } = calculate({ goalAmount, years, rate });
  setResult('required-sip', formatINR(requiredSIP));
  setResult('total-investment', formatINR(totalInvestment));
  setResult('expected-returns', formatINR(expectedReturns));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['goal-amount', 'goal-years', 'goal-rate'], update);
  update();
});
