import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const currentCost = getInputValue('cep-cost');
  const childAge = getInputValue('cep-age');
  const eduAge = getInputValue('cep-edu-age');
  const inflation = getInputValue('cep-inflation') / 100;
  const returnRate = getInputValue('cep-return') / 100;
  const years = eduAge - childAge;
  const futureCost = currentCost * Math.pow(1 + inflation, years);
  const r = returnRate / 12;
  const n = years * 12;
  const monthlyNeeded = futureCost * r / (Math.pow(1 + r, n) - 1);
  setResult('cep-future-cost', formatINR(futureCost));
  setResult('cep-monthly-sip', formatINR(monthlyNeeded));
  setResult('cep-years', years.toString());
  setResult('cep-lumpsum-now', formatINR(futureCost / Math.pow(1 + returnRate, years)));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['cep-cost','cep-age','cep-edu-age','cep-inflation','cep-return'], update);
  update();
});
