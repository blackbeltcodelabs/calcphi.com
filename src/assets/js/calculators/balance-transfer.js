import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const loan = getInputValue('bt-loan');
  const oldRate = getInputValue('bt-old-rate') / 12 / 100;
  const newRate = getInputValue('bt-new-rate') / 12 / 100;
  const tenure = getInputValue('bt-tenure') * 12;
  const feePercent = getInputValue('bt-fee') / 100;
  const oldEmi = calcEmi(loan, oldRate, tenure);
  const newEmi = calcEmi(loan, newRate, tenure);
  const oldTotal = oldEmi * tenure;
  const newTotal = newEmi * tenure;
  const fee = loan * feePercent;
  const grossSaving = oldTotal - newTotal;
  const netSaving = grossSaving - fee;
  const breakEvenMonths = netSaving > 0 ? Math.ceil(fee / (oldEmi - newEmi)) : 0;
  setResult('bt-old-emi', formatINR(oldEmi));
  setResult('bt-new-emi', formatINR(newEmi));
  setResult('bt-emi-saving', formatINR(oldEmi - newEmi));
  setResult('bt-gross-saving', formatINR(grossSaving));
  setResult('bt-fee', formatINR(fee));
  setResult('bt-net-saving', formatINR(netSaving));
  setResult('bt-breakeven', breakEvenMonths > 0 ? breakEvenMonths + ' months' : 'N/A');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['bt-loan','bt-old-rate','bt-new-rate','bt-tenure','bt-fee'], update);
  update();
});
