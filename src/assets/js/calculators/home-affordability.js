import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const income = getInputValue('ha-income');
  const existing = getInputValue('ha-existing');
  const down = getInputValue('ha-down');
  const rate = getInputValue('ha-rate') / 12 / 100;
  const tenure = getInputValue('ha-tenure') * 12;
  const maxEmi = income * 0.45 - existing;
  const maxLoan = maxEmi <= 0 ? 0 : maxEmi * (Math.pow(1+rate, tenure) - 1) / (rate * Math.pow(1+rate, tenure));
  const maxProperty = maxLoan + down;
  setResult('ha-max-emi', formatINR(maxEmi));
  setResult('ha-max-loan', formatINR(maxLoan));
  setResult('ha-max-property', formatINR(maxProperty));
  setResult('ha-down-needed', formatINR(down));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ha-income','ha-existing','ha-down','ha-rate','ha-tenure'], update);
  update();
});
