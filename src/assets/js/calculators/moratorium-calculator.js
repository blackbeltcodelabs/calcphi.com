import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const loan = getInputValue('mor-loan');
  const rate = getInputValue('mor-rate') / 12 / 100;
  const tenure = getInputValue('mor-tenure') * 12;
  const morMonths = getInputValue('mor-months');
  const normalEmi = calcEmi(loan, rate, tenure);
  const normalTotal = normalEmi * tenure;
  const morInterest = loan * rate * morMonths;
  const newPrincipal = loan + morInterest;
  const newEmi = calcEmi(newPrincipal, rate, tenure);
  const newTotal = newEmi * tenure;
  const extraCost = newTotal - normalTotal;
  setResult('mor-normal-emi', formatINR(normalEmi));
  setResult('mor-new-emi', formatINR(newEmi));
  setResult('mor-extra-interest', formatINR(morInterest));
  setResult('mor-total-extra', formatINR(extraCost));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['mor-loan','mor-rate','mor-tenure','mor-months'], update);
  update();
});
