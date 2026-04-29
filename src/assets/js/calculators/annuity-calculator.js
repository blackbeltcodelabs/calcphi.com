import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const corpus = getInputValue('ann-corpus');
  const rate = getInputValue('ann-rate') / 100;
  const type = document.getElementById('ann-type')?.value || 'life';
  const annuityMonthly = corpus * rate / 12;
  const annuityAnnual = corpus * rate;
  const withReturn = corpus * (rate - 0.005) / 12;
  setResult('ann-monthly', formatINR(annuityMonthly));
  setResult('ann-annual', formatINR(annuityAnnual));
  setResult('ann-with-return', formatINR(withReturn));
  setResult('ann-effective-yield', (rate * 100).toFixed(2) + '%');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ann-corpus','ann-rate'], update);
  const sel = document.getElementById('ann-type');
  if (sel) sel.addEventListener('change', update);
  update();
});
