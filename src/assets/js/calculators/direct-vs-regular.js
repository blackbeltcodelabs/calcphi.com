import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ amount, directRate, expenseGap, years }) {
  const regularRate = directRate - expenseGap;
  const directCorpus = amount * Math.pow(1 + directRate / 100, years);
  const regularCorpus = amount * Math.pow(1 + regularRate / 100, years);
  const savingsFromDirect = directCorpus - regularCorpus;
  return { directCorpus, regularCorpus, savingsFromDirect };
}

function update() {
  const amount = getInputValue('dvr-amount');
  const directRate = getInputValue('dvr-rate');
  const expenseGap = getInputValue('dvr-expense-gap');
  const years = getInputValue('dvr-years');
  const { directCorpus, regularCorpus, savingsFromDirect } = calculate({ amount, directRate, expenseGap, years });
  setResult('direct-corpus', formatINR(directCorpus));
  setResult('regular-corpus', formatINR(regularCorpus));
  setResult('savings-from-direct', formatINR(savingsFromDirect));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['dvr-amount', 'dvr-rate', 'dvr-expense-gap', 'dvr-years'], update);
  update();
});
