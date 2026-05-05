import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const loan = getInputValue('lp-loan');
  const rate = getInputValue('lp-rate') / 12 / 100;
  const tenure = getInputValue('lp-tenure') * 12;
  const prepay = getInputValue('lp-prepay');
  const afterMonth = getInputValue('lp-after') * 12;
  const emi = calcEmi(loan, rate, tenure);
  const totalWithout = emi * tenure;
  let balance = loan;
  for (let m = 0; m < afterMonth; m++) { balance = balance * (1 + rate) - emi; }
  const newBalance = Math.max(0, balance - prepay);
  const remainingTenure = tenure - afterMonth;
  const newEmi = calcEmi(newBalance, rate, remainingTenure);
  const totalWith = emi * afterMonth + newEmi * remainingTenure;
  const saved = totalWithout - totalWith;
  setResult('lp-emi', formatINR(emi));
  setResult('lp-new-emi', formatINR(newEmi));
  setResult('lp-interest-saved', formatINR(saved));
  setResult('lp-total-without', formatINR(totalWithout));
  setResult('lp-total-with', formatINR(totalWith));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['lp-loan','lp-rate','lp-tenure','lp-prepay','lp-after'], update);
  update();
});
