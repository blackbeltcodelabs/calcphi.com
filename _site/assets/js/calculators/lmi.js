import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function getLmiRate(lvr, state) {
  if (lvr <= 80) return 0;
  if (lvr <= 85) return 0.006;
  if (lvr <= 90) return 0.012;
  if (lvr <= 92) return 0.018;
  if (lvr <= 95) return 0.025;
  return 0.035;
}

function calculate({ propertyValue, depositAmount, state }) {
  if (propertyValue <= 0) return { lvr: 0, loanAmount: 0, lmiEstimate: 0, lmiCapitalised: 0 };
  const loanAmount = Math.max(0, propertyValue - depositAmount);
  const lvr = (loanAmount / propertyValue) * 100;
  const lmiRate = getLmiRate(lvr, state);
  const lmiEstimate = loanAmount * lmiRate;
  const lmiCapitalised = loanAmount + lmiEstimate;
  return { lvr, loanAmount, lmiEstimate, lmiCapitalised };
}

function update() {
  const propertyValue = getInputValue('property-value');
  const depositAmount = getInputValue('deposit-amount');
  const state = getSelectValue('state');
  const { lvr, loanAmount, lmiEstimate, lmiCapitalised } = calculate({ propertyValue, depositAmount, state });
  setResult('lvr', formatPercent(lvr, 1));
  setResult('loan-amount', formatAUD(loanAmount));
  setResult('lmi-estimate', lmiEstimate > 0 ? formatAUD(lmiEstimate) : 'Not required');
  setResult('lmi-capitalised', lmiEstimate > 0 ? formatAUD(lmiCapitalised) : formatAUD(loanAmount));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['property-value', 'deposit-amount', 'state'], update);
  update();
});
