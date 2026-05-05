import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const loan = getInputValue('fvr-loan');
  const flatRate = getInputValue('fvr-flat-rate') / 100;
  const reducingRate = getInputValue('fvr-reducing-rate') / 12 / 100;
  const tenure = getInputValue('fvr-tenure');
  const n = tenure * 12;
  const flatInterest = loan * flatRate * tenure;
  const flatEmi = (loan + flatInterest) / n;
  const flatTotal = flatEmi * n;
  const reducingEmi = calcEmi(loan, reducingRate, n);
  const reducingTotal = reducingEmi * n;
  const reducingInterest = reducingTotal - loan;
  setResult('fvr-flat-emi', formatINR(flatEmi));
  setResult('fvr-flat-total', formatINR(flatTotal));
  setResult('fvr-flat-interest', formatINR(flatInterest));
  setResult('fvr-reducing-emi', formatINR(reducingEmi));
  setResult('fvr-reducing-total', formatINR(reducingTotal));
  setResult('fvr-reducing-interest', formatINR(reducingInterest));
  setResult('fvr-difference', formatINR(flatTotal - reducingTotal));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['fvr-loan','fvr-flat-rate','fvr-reducing-rate','fvr-tenure'], update);
  update();
});
