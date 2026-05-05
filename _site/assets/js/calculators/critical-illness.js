import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const income = getInputValue('ci-income');
  const recoveryYears = getInputValue('ci-recovery');
  const treatment = getInputValue('ci-treatment');
  const emi = getInputValue('ci-emi');
  const incomeLoss = income * 12 * recoveryYears;
  const emiDue = emi * 12 * recoveryYears;
  const totalNeeded = incomeLoss + treatment + emiDue;
  const recommended = Math.ceil(totalNeeded / 500000) * 500000;
  setResult('ci-income-loss', formatINR(incomeLoss));
  setResult('ci-treatment', formatINR(treatment));
  setResult('ci-emi-total', formatINR(emiDue));
  setResult('ci-recommended', formatINR(recommended));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ci-income','ci-recovery','ci-treatment','ci-emi'], update);
  update();
});
