import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ homeValue, superBalance, savingsCash, sharesInvestments, otherAssets, mortgageBalance, otherDebt }) {
  const totalAssets = homeValue + superBalance + savingsCash + sharesInvestments + otherAssets;
  const totalLiabilities = mortgageBalance + otherDebt;
  const netWorth = totalAssets - totalLiabilities;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  return { totalAssets, totalLiabilities, netWorth, debtRatio };
}

function update() {
  const homeValue = getInputValue('home-value');
  const superBalance = getInputValue('super-balance');
  const savingsCash = getInputValue('savings-cash');
  const sharesInvestments = getInputValue('shares-investments');
  const otherAssets = getInputValue('other-assets');
  const mortgageBalance = getInputValue('mortgage-balance');
  const otherDebt = getInputValue('other-debt');
  const { totalAssets, totalLiabilities, netWorth, debtRatio } = calculate({
    homeValue, superBalance, savingsCash, sharesInvestments, otherAssets, mortgageBalance, otherDebt
  });
  setResult('total-assets', formatAUD(totalAssets));
  setResult('total-liabilities', formatAUD(totalLiabilities));
  setResult('net-worth', formatAUD(netWorth));
  setResult('debt-ratio', formatPercent(debtRatio, 1));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['home-value', 'super-balance', 'savings-cash', 'shares-investments', 'other-assets', 'mortgage-balance', 'other-debt'], update);
  update();
});
