import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const area = getInputValue('ptax-area');
  const ratePerSqft = getInputValue('ptax-rate-sqft');
  const city = document.getElementById('ptax-city')?.value || 'other';
  const cityRate = { mumbai: 0.025, delhi: 0.015, bengaluru: 0.020, chennai: 0.018, other: 0.015 }[city] || 0.015;
  const annualValue = area * ratePerSqft * 12;
  const tax = annualValue * cityRate;
  const quarterly = tax / 4;
  setResult('ptax-annual-value', formatINR(annualValue));
  setResult('ptax-annual', formatINR(tax));
  setResult('ptax-quarterly', formatINR(quarterly));
  setResult('ptax-rate', (cityRate * 100).toFixed(1) + '%');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ptax-area','ptax-rate-sqft'], update);
  const sel = document.getElementById('ptax-city');
  if (sel) sel.addEventListener('change', update);
  update();
});
