import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function computeTax(income) {
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, limit) - prev) * rate;
    prev = limit;
    if (income <= limit) break;
  }
  return tax;
}

function update() {
  const income = getInputValue('sc-income');
  const baseTax = computeTax(income);
  let surchargeRate = 0;
  if (income > 20000000) surchargeRate = 0.25;
  else if (income > 10000000) surchargeRate = 0.25;
  else if (income > 5000000) surchargeRate = 0.15;
  else if (income > 1000000) surchargeRate = 0.10;
  const surcharge = baseTax * surchargeRate;
  const cess = (baseTax + surcharge) * 0.04;
  const total = baseTax + surcharge + cess;
  setResult('sc-base-tax', formatINR(baseTax));
  setResult('sc-surcharge', formatINR(surcharge));
  setResult('sc-cess', formatINR(cess));
  setResult('sc-total', formatINR(total));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['sc-income'], update);
  update();
});
