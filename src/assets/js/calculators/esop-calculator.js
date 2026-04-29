import { formatINR, formatPercent, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function update() {
  const units = getInputValue('esop-units');
  const exercisePrice = getInputValue('esop-exercise');
  const fmv = getInputValue('esop-fmv');
  const salePrice = getInputValue('esop-sale');
  const slabRate = getInputValue('esop-slab') / 100;
  const exerciseGain = (fmv - exercisePrice) * units;
  const perquisiteTax = exerciseGain * slabRate * 1.04;
  const saleGain = (salePrice - fmv) * units;
  const capitalGainsTax = saleGain > 0 ? saleGain * 0.125 * 1.04 : 0;
  const totalValue = salePrice * units;
  const netAfterTax = totalValue - exercisePrice * units - perquisiteTax - capitalGainsTax;
  setResult('esop-exercise-gain', formatINR(exerciseGain));
  setResult('esop-perquisite-tax', formatINR(perquisiteTax));
  setResult('esop-sale-gain', formatINR(saleGain));
  setResult('esop-cg-tax', formatINR(capitalGainsTax));
  setResult('esop-net', formatINR(netAfterTax));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['esop-units','esop-exercise','esop-fmv','esop-sale','esop-slab'], update);
  update();
});
