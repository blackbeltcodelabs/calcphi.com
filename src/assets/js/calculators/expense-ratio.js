import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ principal, rate, years, expenseRatio }) {
  const corpusWithoutER = principal * Math.pow(1 + rate / 100, years);
  const netRate = rate - expenseRatio;
  const corpusWithER = principal * Math.pow(1 + netRate / 100, years);
  const totalERCost = corpusWithoutER - corpusWithER;
  return { corpusWithoutER, corpusWithER, totalERCost };
}

function update() {
  const principal = getInputValue('ls-principal');
  const rate = getInputValue('ls-rate');
  const years = getInputValue('ls-years');
  const expenseRatio = getInputValue('expense-ratio');
  const { corpusWithoutER, corpusWithER, totalERCost } = calculate({ principal, rate, years, expenseRatio });
  setResult('corpus-without-er', formatINR(corpusWithoutER));
  setResult('corpus-with-er', formatINR(corpusWithER));
  setResult('total-er-cost', formatINR(totalERCost));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ls-principal', 'ls-rate', 'ls-years', 'expense-ratio'], update);
  update();
});
