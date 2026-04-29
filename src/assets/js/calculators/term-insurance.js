import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const income = getInputValue('ti-income');
  const age = getInputValue('ti-age');
  const liabilities = getInputValue('ti-liabilities');
  const assets = getInputValue('ti-assets');
  const dependents = getInputValue('ti-dependents');
  const yearsToRetire = Math.max(0, 60 - age);
  const incomeReplacement = income * 12 * yearsToRetire * 0.7;
  const cover = Math.max(0, incomeReplacement + liabilities - assets);
  const roundedCover = Math.ceil(cover / 1000000) * 1000000;
  const monthlyPremiumEst = (roundedCover / 10000000) * 900;
  setResult('ti-cover', formatINR(roundedCover));
  setResult('ti-premium-est', formatINR(monthlyPremiumEst) + '/month*');
  setResult('ti-income-rep', formatINR(incomeReplacement));
  setResult('ti-multiple', (roundedCover / (income * 12)).toFixed(0) + 'x annual income');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ti-income','ti-age','ti-liabilities','ti-assets','ti-dependents'], update);
  update();
});
