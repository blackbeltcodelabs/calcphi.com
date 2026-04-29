import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const principal = getInputValue('pomis-principal');
  const rate = getInputValue('pomis-rate');
  const monthlyInterest = principal * rate / 100 / 12;
  const annualInterest = monthlyInterest * 12;
  const totalInterest = monthlyInterest * 12 * 5;
  setResult('pomis-monthly', formatINR(monthlyInterest));
  setResult('pomis-annual', formatINR(annualInterest));
  setResult('pomis-total', formatINR(totalInterest));
  setResult('pomis-maturity', formatINR(principal + totalInterest));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['pomis-principal','pomis-rate'], update);
  update();
});
