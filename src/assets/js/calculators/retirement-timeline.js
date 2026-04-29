import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const current = getInputValue('rt-current');
  const monthly = getInputValue('rt-monthly');
  const rate = getInputValue('rt-rate') / 100;
  const expenses = getInputValue('rt-expenses');
  const withdrawRate = 0.04;
  const fireNumber = expenses * 12 / withdrawRate;
  if (current >= fireNumber) { setResult('rt-years', 'Already FI!'); setResult('rt-fire-number', formatINR(fireNumber)); return; }
  const r = rate / 12;
  const pmt = monthly;
  let corpus = current, months = 0;
  while (corpus < fireNumber && months < 600) {
    corpus = corpus * (1 + r) + pmt;
    months++;
  }
  const years = Math.ceil(months / 12);
  setResult('rt-fire-number', formatINR(fireNumber));
  setResult('rt-years', years + ' years');
  setResult('rt-age', 'at age ' + (getInputValue('rt-age') + years));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['rt-current','rt-monthly','rt-rate','rt-expenses','rt-age'], update);
  update();
});
