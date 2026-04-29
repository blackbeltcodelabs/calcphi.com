import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ principal, rate, years, inflation }) {
  const nominalCorpus = principal * Math.pow(1 + rate / 100, years);
  const realCorpus = nominalCorpus / Math.pow(1 + inflation / 100, years);
  const realReturnRate = ((1 + rate / 100) / (1 + inflation / 100) - 1) * 100;
  const gains = nominalCorpus - principal;
  return { nominalCorpus, realCorpus, realReturnRate, gains };
}

function update() {
  const principal = getInputValue('ls-principal');
  const rate = getInputValue('ls-rate');
  const years = getInputValue('ls-years');
  const inflation = getInputValue('inflation-rate');
  const { nominalCorpus, realCorpus, realReturnRate, gains } = calculate({ principal, rate, years, inflation });
  setResult('ls-maturity', formatINR(nominalCorpus));
  setResult('ls-gains', formatINR(gains));
  setResult('ls-cagr', formatPercent(rate));
  setResult('real-corpus', formatINR(realCorpus));
  setResult('real-return-rate', formatPercent(realReturnRate));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ls-principal', 'ls-rate', 'ls-years', 'inflation-rate'], update);
  update();
});
