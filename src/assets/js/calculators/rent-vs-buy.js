import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function calcEmi(p, r, n) { return r === 0 ? p/n : (p * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1); }

function update() {
  const propValue = getInputValue('rvb-price');
  const downPayment = getInputValue('rvb-down');
  const loanRate = getInputValue('rvb-loan-rate') / 12 / 100;
  const tenure = getInputValue('rvb-tenure');
  const appreciation = getInputValue('rvb-appreciation') / 100;
  const rent = getInputValue('rvb-rent');
  const investReturn = getInputValue('rvb-invest-return') / 100;
  const loan = propValue - downPayment;
  const emi = calcEmi(loan, loanRate, tenure * 12);
  const futurePropValue = propValue * Math.pow(1 + appreciation, tenure);
  const buyTotalPaid = emi * tenure * 12 + downPayment;
  const rentTotal = rent * 12 * Math.pow((1 + 0.05 * tenure), 1) * tenure;
  const investedDown = downPayment * Math.pow(1 + investReturn, tenure);
  const rentInvestDiff = (emi - rent) < 0 ? 0 : (emi - rent) * 12;
  const netBuyWealth = futurePropValue - (loan > 0 ? 0 : 0);
  setResult('rvb-emi', formatINR(emi));
  setResult('rvb-future-price', formatINR(futurePropValue));
  setResult('rvb-buy-total', formatINR(buyTotalPaid));
  setResult('rvb-rent-total', formatINR(rentTotal));
  setResult('rvb-verdict', emi > rent * 1.5 ? 'Renting may be better short-term' : 'Buying builds long-term wealth');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['rvb-price','rvb-down','rvb-loan-rate','rvb-tenure','rvb-appreciation','rvb-rent','rvb-invest-return'], update);
  update();
});
