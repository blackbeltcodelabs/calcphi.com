import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ monthlyIncome, housing, groceries, transport, utilities, entertainment, shopping, savingsInvested }) {
  // 50/30/20: needs = housing + groceries + transport + utilities
  const needs = housing + groceries + transport + utilities;
  const wants = entertainment + shopping;
  const totalSpending = needs + wants + savingsInvested;
  const monthlySurplus = monthlyIncome - totalSpending;
  const savingsRate = monthlyIncome > 0 ? ((savingsInvested + monthlySurplus) / monthlyIncome) * 100 : 0;
  const needsPct = monthlyIncome > 0 ? (needs / monthlyIncome) * 100 : 0;
  return { totalSpending, monthlySurplus, savingsRate, needsPct };
}

function update() {
  const monthlyIncome = getInputValue('monthly-income');
  const housing = getInputValue('housing');
  const groceries = getInputValue('groceries');
  const transport = getInputValue('transport');
  const utilities = getInputValue('utilities');
  const entertainment = getInputValue('entertainment');
  const shopping = getInputValue('shopping');
  const savingsInvested = getInputValue('savings-invested');
  const { totalSpending, monthlySurplus, savingsRate, needsPct } = calculate({
    monthlyIncome, housing, groceries, transport, utilities, entertainment, shopping, savingsInvested
  });
  setResult('total-spending', formatAUD(totalSpending));
  const surplusLabel = (monthlySurplus >= 0 ? '+' : '−') + formatAUD(Math.abs(monthlySurplus));
  setResult('monthly-surplus', surplusLabel);
  setResult('savings-rate', formatPercent(savingsRate, 1));
  setResult('needs-pct', formatPercent(needsPct, 1));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['monthly-income', 'housing', 'groceries', 'transport', 'utilities', 'entertainment', 'shopping', 'savings-invested'], update);
  update();
});
