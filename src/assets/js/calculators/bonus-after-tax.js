import { formatINR, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function marginalRate(income) {
  if (income > 2400000) return 0.30;
  if (income > 2000000) return 0.25;
  if (income > 1600000) return 0.20;
  if (income > 1200000) return 0.15;
  if (income > 800000) return 0.10;
  if (income > 400000) return 0.05;
  return 0;
}

function update() {
  const salary = getInputValue('bat-salary');
  const bonus = getInputValue('bat-bonus');
  const rate = marginalRate(salary + bonus);
  const tds = bonus * rate * 1.04;
  const net = bonus - tds;
  setResult('bat-tds', formatINR(tds));
  setResult('bat-net', formatINR(net));
  setResult('bat-rate', formatPercent(rate * 100));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['bat-salary','bat-bonus'], update);
  update();
});
