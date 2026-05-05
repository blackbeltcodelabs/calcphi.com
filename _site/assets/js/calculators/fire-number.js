import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const monthly = getInputValue('fn-monthly');
  const withdrawRate = getInputValue('fn-withdraw-rate') / 100;
  const inflation = getInputValue('fn-inflation') / 100;
  const currentAge = getInputValue('fn-age');
  const fireAge = getInputValue('fn-fire-age');
  const yearsToFire = fireAge - currentAge;
  const futureMonthly = monthly * Math.pow(1 + inflation, yearsToFire);
  const annualExpense = futureMonthly * 12;
  const fireNumber = annualExpense / withdrawRate;
  const multiple = (fireNumber / (monthly * 12)).toFixed(1);
  setResult('fn-fire-number', formatINR(fireNumber));
  setResult('fn-future-monthly', formatINR(futureMonthly));
  setResult('fn-multiple', multiple + 'x annual expenses');
  setResult('fn-years-to-fire', yearsToFire.toString());
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['fn-monthly','fn-withdraw-rate','fn-inflation','fn-age','fn-fire-age'], update);
  update();
});
