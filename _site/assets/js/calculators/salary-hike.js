import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function computeTax(taxable) {
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, limit) - prev) * rate;
    prev = limit;
    if (taxable <= limit) break;
  }
  if (taxable <= 1200000) tax = 0;
  return tax * 1.04;
}

function update() {
  const ctc = getInputValue('sh-ctc');
  const hikePercent = getInputValue('sh-hike') / 100;
  const newCtc = ctc * (1 + hikePercent);
  const currentInHand = (ctc * 0.88 - computeTax(ctc * 0.88 - 75000)) / 12;
  const newInHand = (newCtc * 0.88 - computeTax(newCtc * 0.88 - 75000)) / 12;
  const increase = newInHand - currentInHand;
  setResult('sh-new-ctc', formatINR(newCtc));
  setResult('sh-new-inhand', formatINR(newInHand));
  setResult('sh-monthly-increase', formatINR(increase));
  setResult('sh-annual-increase', formatINR(increase * 12));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['sh-ctc','sh-hike'], update);
  update();
});
