import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const monthly = getInputValue('er-monthly');
  const currentAge = getInputValue('er-age');
  const retireAge = getInputValue('er-retire');
  const lifeExpect = getInputValue('er-life');
  const inflation = getInputValue('er-inflation') / 100;
  const postRate = getInputValue('er-post-rate') / 100;
  const yearsToRetire = retireAge - currentAge;
  const retirementYears = lifeExpect - retireAge;
  const futureMonthly = monthly * Math.pow(1 + inflation, yearsToRetire);
  const annualExpense = futureMonthly * 12;
  const r = postRate - inflation;
  const corpus = r > 0.001 ? annualExpense / r * (1 - Math.pow(1+r, -retirementYears)) : annualExpense * retirementYears;
  const swr = (annualExpense / corpus * 100).toFixed(1);
  setResult('er-corpus', formatINR(corpus));
  setResult('er-future-monthly', formatINR(futureMonthly));
  setResult('er-years', retirementYears.toString() + ' years of retirement');
  setResult('er-swr', swr + '% withdrawal rate');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['er-monthly','er-age','er-retire','er-life','er-inflation','er-post-rate'], update);
  update();
});
