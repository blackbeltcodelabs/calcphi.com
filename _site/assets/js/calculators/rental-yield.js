import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const propValue = getInputValue('ry-value');
  const monthlyRent = getInputValue('ry-rent');
  const maintenance = getInputValue('ry-maintenance');
  const propTax = getInputValue('ry-prop-tax');
  const vacancy = getInputValue('ry-vacancy') / 100;
  const grossRent = monthlyRent * 12;
  const effectiveRent = grossRent * (1 - vacancy);
  const netRent = effectiveRent - maintenance - propTax;
  const grossYield = (grossRent / propValue) * 100;
  const netYield = (netRent / propValue) * 100;
  setResult('ry-gross-yield', grossYield.toFixed(2) + '%');
  setResult('ry-net-yield', netYield.toFixed(2) + '%');
  setResult('ry-annual-rent', formatINR(grossRent));
  setResult('ry-net-rent', formatINR(netRent));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ry-value','ry-rent','ry-maintenance','ry-prop-tax','ry-vacancy'], update);
  update();
});
