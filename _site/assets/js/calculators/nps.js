import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ monthly, currentAge, retirementAge, returnRate, annuityRate }) {
  const years = retirementAge - currentAge;
  if (years <= 0) return { corpus: 0, lumpsum: 0, annuityCorpus: 0, pension: 0 };
  const r = returnRate / 12 / 100;
  const n = years * 12;
  const corpus = monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const lumpsum = corpus * 0.6;
  const annuityCorpus = corpus * 0.4;
  const pension = (annuityCorpus * annuityRate / 100) / 12;
  return { corpus, lumpsum, annuityCorpus, pension };
}

function update() {
  const monthly = getInputValue('nps-monthly');
  const currentAge = getInputValue('current-age');
  const retirementAge = getInputValue('retirement-age');
  const returnRate = getInputValue('nps-return');
  const annuityRate = getInputValue('annuity-rate');
  const { corpus, lumpsum, annuityCorpus, pension } = calculate({ monthly, currentAge, retirementAge, returnRate, annuityRate });
  setResult('nps-total-corpus', formatINR(corpus));
  setResult('nps-lumpsum', formatINR(lumpsum));
  setResult('nps-annuity-corpus', formatINR(annuityCorpus));
  setResult('nps-monthly-pension', formatINR(pension));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['nps-monthly', 'current-age', 'retirement-age', 'nps-return', 'annuity-rate'], update);
  update();
});
