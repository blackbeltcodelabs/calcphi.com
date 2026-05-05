import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const age = getInputValue('hi-age');
  const family = getInputValue('hi-family');
  const city = document.getElementById('hi-city')?.value || 'metro';
  const baseSum = city === 'metro' ? 500000 : 300000;
  const ageFactor = age > 45 ? 1.5 : age > 35 ? 1.2 : 1;
  const familyFactor = family > 2 ? 1 + (family - 2) * 0.2 : 1;
  const recommended = baseSum * ageFactor * familyFactor;
  const roundedSum = Math.ceil(recommended / 100000) * 100000;
  const premiumBase = age > 45 ? 18000 : age > 35 ? 12000 : 8000;
  const premium = premiumBase * familyFactor * (city === 'metro' ? 1.15 : 1);
  setResult('hi-recommended', formatINR(roundedSum));
  setResult('hi-premium-est', formatINR(premium) + '/year*');
  setResult('hi-premium-monthly', formatINR(premium / 12) + '/month*');
  setResult('hi-family-cover', 'Family floater for ' + family + ' members');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['hi-age','hi-family'], update);
  const sel = document.getElementById('hi-city');
  if (sel) sel.addEventListener('change', update);
  update();
});
