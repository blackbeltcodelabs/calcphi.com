import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const buyPrice = getInputValue('rer-buy');
  const sellPrice = getInputValue('rer-sell');
  const years = getInputValue('rer-years');
  const rent = getInputValue('rer-rent');
  const expenses = getInputValue('rer-expenses');

  const capitalGain = sellPrice - buyPrice;
  const totalRent = rent * 12 * years;
  const totalExpenses = expenses * 12 * years;
  const netRent = totalRent - totalExpenses;
  const totalReturn = capitalGain + netRent;
  const roi = (totalReturn / buyPrice) * 100;
  const cagr = (Math.pow(sellPrice / buyPrice, 1 / Math.max(years, 1)) - 1) * 100;
  const rentalYield = ((rent * 12) / buyPrice) * 100;

  setResult('rer-capital-gain', formatINR(capitalGain));
  setResult('rer-total-rent', formatINR(netRent));
  setResult('rer-total-return', formatINR(totalReturn));
  setResult('rer-roi', roi.toFixed(1) + '%');
  setResult('rer-cagr', cagr.toFixed(2) + '% p.a.');
  setResult('rer-rental-yield', rentalYield.toFixed(2) + '%');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['rer-buy', 'rer-sell', 'rer-years', 'rer-rent', 'rer-expenses'], update);
  update();
});
