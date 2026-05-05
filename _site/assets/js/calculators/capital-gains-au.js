import { formatAUD, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function marginalRate(income) {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.19;
  if (income <= 135000) return 0.325;
  if (income <= 190000) return 0.37;
  return 0.45;
}

function calculate({ purchasePrice, salePrice, heldOver12, taxableIncome, assetType }) {
  const grossGain = Math.max(0, salePrice - purchasePrice);
  const discountApplies = heldOver12 === 'yes' && assetType !== 'collectible-pre-1985';
  const discountedGain = discountApplies ? grossGain * 0.5 : grossGain;
  const totalIncome = taxableIncome + discountedGain;
  const rate = marginalRate(totalIncome);
  const cgtPayable = discountedGain * rate;
  const effectiveCgtRate = grossGain > 0 ? (cgtPayable / grossGain) * 100 : 0;
  const netProceeds = salePrice - purchasePrice - cgtPayable;
  return { grossGain, discountedGain, cgtPayable, effectiveCgtRate, netProceeds };
}

function update() {
  const purchasePrice = getInputValue('purchase-price');
  const salePrice = getInputValue('sale-price');
  const heldOver12 = getSelectValue('held-over-12-months');
  const taxableIncome = getInputValue('taxable-income');
  const assetType = getSelectValue('asset-type');
  const { grossGain, discountedGain, cgtPayable, effectiveCgtRate, netProceeds } = calculate({ purchasePrice, salePrice, heldOver12, taxableIncome, assetType });
  setResult('gross-gain', formatAUD(grossGain));
  setResult('discounted-gain', formatAUD(discountedGain));
  setResult('cgt-payable', formatAUD(cgtPayable));
  setResult('effective-cgt-rate', formatPercent(effectiveCgtRate));
  setResult('net-proceeds', formatAUD(netProceeds));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['purchase-price', 'sale-price', 'held-over-12-months', 'taxable-income', 'asset-type'], update);
  update();
});
