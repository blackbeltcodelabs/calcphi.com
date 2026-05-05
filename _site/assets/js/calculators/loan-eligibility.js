import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const netIncome = getInputValue('le-income');
  const existingEmi = getInputValue('le-existing');
  const rate = getInputValue('le-rate') / 12 / 100;
  const tenure = getInputValue('le-tenure') * 12;
  const foirLimit = 0.50;
  const maxEmi = netIncome * foirLimit - existingEmi;
  const maxLoan = maxEmi <= 0 ? 0 : maxEmi * (Math.pow(1+rate, tenure) - 1) / (rate * Math.pow(1+rate, tenure));
  setResult('le-max-emi', formatINR(maxEmi));
  setResult('le-max-loan', formatINR(maxLoan));
  setResult('le-foir', ((existingEmi / netIncome) * 100).toFixed(0) + '%');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['le-income','le-existing','le-rate','le-tenure'], update);
  update();
});
