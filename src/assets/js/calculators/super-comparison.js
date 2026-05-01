import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function projectFund(balance, annualContribs, years, returnRate, feeRate) {
  const r = (returnRate - feeRate) / 100;
  let b = balance;
  for (let yr = 0; yr < years; yr++) {
    b = b * (1 + r) + annualContribs;
  }
  return b;
}

function calculate({ currentBalance, annualContributions, yearsToRetire, fundAReturn, fundAFee, fundBReturn, fundBFee }) {
  const fundABalance = projectFund(currentBalance, annualContributions, yearsToRetire, fundAReturn, fundAFee);
  const fundBBalance = projectFund(currentBalance, annualContributions, yearsToRetire, fundBReturn, fundBFee);

  // Project with zero return to find total fees paid
  const totalContribsBase = currentBalance * Math.pow(1, yearsToRetire) + annualContributions * yearsToRetire;
  const feeDifference = Math.abs(fundABalance - fundBBalance);
  const balanceDifference = fundABalance - fundBBalance;

  return { fundABalance, fundBBalance, feeDifference, balanceDifference };
}

function update() {
  const currentBalance = getInputValue('current-balance');
  const annualContributions = getInputValue('annual-contributions');
  const yearsToRetire = getInputValue('years-to-retire');
  const fundAReturn = getInputValue('fund-a-return');
  const fundAFee = getInputValue('fund-a-fee');
  const fundBReturn = getInputValue('fund-b-return');
  const fundBFee = getInputValue('fund-b-fee');
  const { fundABalance, fundBBalance, feeDifference, balanceDifference } = calculate({ currentBalance, annualContributions, yearsToRetire, fundAReturn, fundAFee, fundBReturn, fundBFee });
  setResult('fund-a-balance', formatAUD(fundABalance));
  setResult('fund-b-balance', formatAUD(fundBBalance));
  setResult('fee-difference', formatAUD(feeDifference));
  setResult('balance-difference', balanceDifference >= 0 ? 'Fund A ahead by ' + formatAUD(balanceDifference) : 'Fund B ahead by ' + formatAUD(-balanceDifference));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['current-balance', 'annual-contributions', 'years-to-retire', 'fund-a-return', 'fund-a-fee', 'fund-b-return', 'fund-b-fee'], update);
  update();
});
