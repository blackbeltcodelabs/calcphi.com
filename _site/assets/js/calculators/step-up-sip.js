import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calculateStepUp({ monthly, stepup, rate, years }) {
  const r = rate / 12 / 100;
  let corpus = 0;
  let totalInvested = 0;
  let currentMonthly = monthly;
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) {
      corpus = (corpus + currentMonthly) * (1 + r);
      totalInvested += currentMonthly;
    }
    currentMonthly = currentMonthly * (1 + stepup / 100);
  }
  return { corpus, totalInvested };
}

function calculateFlat({ monthly, rate, years }) {
  if (rate === 0) return monthly * years * 12;
  const r = rate / 12 / 100;
  const n = years * 12;
  return monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function update() {
  const monthly = getInputValue('sus-monthly');
  const stepup = getInputValue('sus-stepup');
  const rate = getInputValue('sus-rate');
  const years = getInputValue('sus-years');
  const { corpus, totalInvested } = calculateStepUp({ monthly, stepup, rate, years });
  const flatCorpus = calculateFlat({ monthly, rate, years });
  const extra = corpus - flatCorpus;
  setResult('sus-final-corpus', formatINR(corpus));
  setResult('sus-total-invested', formatINR(totalInvested));
  setResult('sus-flat-sip-corpus', formatINR(flatCorpus));
  setResult('sus-extra-wealth', formatINR(extra));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['sus-monthly', 'sus-stepup', 'sus-rate', 'sus-years'], update);
  update();
});
