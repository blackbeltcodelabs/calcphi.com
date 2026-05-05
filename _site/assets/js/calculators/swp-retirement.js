import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const corpus = getInputValue('swpr-corpus');
  const monthly = getInputValue('monthly-withdrawal');
  const rate = getInputValue('swp-rate');
  const r = rate / 12 / 100;
  let balance = corpus, months = 0;
  while (balance > 0 && months < 600) {
    balance = balance * (1 + r) - monthly;
    months++;
    if (balance < 0) balance = 0;
  }
  const years = (months / 12).toFixed(1);
  const withdrawRate = (monthly * 12 / corpus * 100).toFixed(1);
  setResult('swpr-duration', years + ' years');
  setResult('swpr-total-withdrawn', formatINR(monthly * months));
  setResult('swpr-withdraw-rate', withdrawRate + '%');
  setResult('swpr-monthly', formatINR(monthly));
}

document.addEventListener('DOMContentLoaded', () => {
  const inputs = ['swpr-corpus', 'monthly-withdrawal', 'swp-rate'];
  inputs.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', update); });
  update();
});
