import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const monthly = getInputValue('rc-monthly');
  const currentAge = getInputValue('rc-age');
  const retireAge = getInputValue('rc-retire-age');
  const lifeExpect = getInputValue('rc-life-expect');
  const inflation = getInputValue('rc-inflation') / 100;
  const postReturnRate = getInputValue('rc-post-rate') / 100;
  const yearsToRetire = retireAge - currentAge;
  const retirementYears = lifeExpect - retireAge;
  const futureMonthly = monthly * Math.pow(1 + inflation, yearsToRetire);
  const annualExpense = futureMonthly * 12;
  const r = postReturnRate - inflation;
  const corpus = r > 0 ? annualExpense / r * (1 - Math.pow(1 + r, -retirementYears)) : annualExpense * retirementYears;
  const monthlyNeed = getInputValue('rc-monthly');
  setResult('rc-future-monthly', formatINR(futureMonthly));
  setResult('rc-corpus-needed', formatINR(corpus));
  setResult('rc-retire-years', retirementYears.toString());
  setResult('rc-years-to-retire', yearsToRetire.toString());
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['rc-monthly','rc-age','rc-retire-age','rc-life-expect','rc-inflation','rc-post-rate'], update);
  update();
});
