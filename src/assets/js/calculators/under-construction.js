import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const propValue = getInputValue('uc-value');
  const loan = getInputValue('uc-loan');
  const rate = getInputValue('uc-rate') / 12 / 100;
  const constructionYears = getInputValue('uc-construction');
  const tenure = getInputValue('uc-tenure') * 12;
  const preEmiInterest = loan * rate * constructionYears * 12;
  const emi = calcEmi(loan, rate, tenure);
  const gst = propValue * 0.05;
  const totalCost = propValue + gst + preEmiInterest + (emi * tenure - loan);
  setResult('uc-emi', formatINR(emi));
  setResult('uc-pre-emi', formatINR(preEmiInterest));
  setResult('uc-gst', formatINR(gst));
  setResult('uc-total-cost', formatINR(totalCost));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['uc-value','uc-loan','uc-rate','uc-construction','uc-tenure'], update);
  update();
});
