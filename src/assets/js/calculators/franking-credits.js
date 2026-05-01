import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ cashDividend, frankingPercent, marginalTaxRate }) {
  const corporateTaxRate = 0.30;
  const frankingFraction = frankingPercent / 100;
  // Franking credit = cash dividend × (franking% × corporate rate / (1 - corporate rate))
  const frankingCredit = cashDividend * frankingFraction * (corporateTaxRate / (1 - corporateTaxRate));
  const grossedUpDividend = cashDividend + frankingCredit;
  const marginalRate = marginalTaxRate / 100;
  const taxOnDividend = grossedUpDividend * marginalRate;
  const taxOffset = frankingCredit;
  const netTax = Math.max(0, taxOnDividend - taxOffset);
  const afterTaxIncome = cashDividend - netTax + Math.max(0, taxOffset - taxOnDividend);
  return { frankingCredit, grossedUpDividend, taxOnDividend, taxOffset, netTax, afterTaxIncome };
}

function update() {
  const cashDividend = getInputValue('cash-dividend');
  const frankingPercent = getInputValue('franking-percent');
  const marginalTaxRate = getInputValue('marginal-tax-rate');
  const { frankingCredit, grossedUpDividend, taxOnDividend, taxOffset, netTax, afterTaxIncome } = calculate({ cashDividend, frankingPercent, marginalTaxRate });
  setResult('franking-credit', formatAUD(frankingCredit));
  setResult('grossed-up-dividend', formatAUD(grossedUpDividend));
  setResult('tax-on-dividend', formatAUD(taxOnDividend));
  setResult('tax-offset', formatAUD(taxOffset));
  setResult('net-tax', formatAUD(netTax));
  setResult('after-tax-income', formatAUD(afterTaxIncome));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['cash-dividend', 'franking-percent', 'marginal-tax-rate'], update);
  update();
});
