import { formatAUD, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ propertyPrice, depositPercent, mortgageRate, weeklyRent, propertyGrowth, years }) {
  const deposit = propertyPrice * depositPercent / 100;
  const loanAmount = propertyPrice - deposit;
  const r = mortgageRate / 100 / 12;
  const n = years * 12;
  const monthly = r === 0 ? loanAmount / n : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalMortgagePayments = monthly * n;
  const stampDuty = propertyPrice * 0.04;
  const maintenanceAnnual = propertyPrice * 0.01;
  const totalBuyCost = deposit + stampDuty + totalMortgagePayments + maintenanceAnnual * years;
  const totalRentCost = weeklyRent * 52 * years;
  const futurePropertyValue = propertyPrice * Math.pow(1 + propertyGrowth / 100, years);
  let balance = loanAmount;
  for (let m = 0; m < n; m++) {
    const intCharge = balance * r;
    balance = Math.max(0, balance - (monthly - intCharge));
  }
  const equityBuilt = futurePropertyValue - balance;
  const netBuyAdvantage = equityBuilt - totalBuyCost + totalRentCost;
  return { buyCost: totalBuyCost, rentCost: totalRentCost, equityBuilt, netBuyAdvantage };
}

function update() {
  const propertyPrice = getInputValue('property-price');
  const depositPercent = getInputValue('deposit-percent');
  const mortgageRate = getInputValue('mortgage-rate');
  const weeklyRent = getInputValue('weekly-rent');
  const propertyGrowth = getInputValue('property-growth');
  const years = getInputValue('years');
  const { buyCost, rentCost, equityBuilt, netBuyAdvantage } = calculate({ propertyPrice, depositPercent, mortgageRate, weeklyRent, propertyGrowth, years });
  setResult('buy-cost', formatAUD(buyCost));
  setResult('rent-cost', formatAUD(rentCost));
  setResult('equity-built', formatAUD(equityBuilt));
  setResult('net-buy-advantage', netBuyAdvantage >= 0 ? 'Buy ahead by ' + formatAUD(netBuyAdvantage) : 'Rent ahead by ' + formatAUD(-netBuyAdvantage));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['property-price', 'deposit-percent', 'mortgage-rate', 'weekly-rent', 'property-growth', 'years'], update);
  update();
});
