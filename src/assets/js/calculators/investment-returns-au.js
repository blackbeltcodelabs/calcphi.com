import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

function calculate({ initialInvestment, finalValue, yearsHeld, annualIncome, inflationRate }) {
  if (initialInvestment <= 0 || yearsHeld <= 0) return { totalReturn: 0, totalReturnPct: 0, cagr: 0, realCagr: 0, totalIncome: 0 };
  const capitalGain = finalValue - initialInvestment;
  const totalIncome = annualIncome * yearsHeld;
  const totalReturn = capitalGain + totalIncome;
  const totalReturnPct = (totalReturn / initialInvestment) * 100;
  const cagr = (Math.pow(finalValue / initialInvestment, 1 / yearsHeld) - 1) * 100;
  const realCagr = ((1 + cagr / 100) / (1 + inflationRate / 100) - 1) * 100;
  return { totalReturn, totalReturnPct, cagr, realCagr, totalIncome };
}

function update() {
  const initialInvestment = getInputValue('initial-investment');
  const finalValue = getInputValue('final-value');
  const yearsHeld = getInputValue('years-held');
  const annualIncome = getInputValue('annual-income');
  const inflationRate = getInputValue('inflation-rate');
  const { totalReturn, totalReturnPct, cagr, realCagr, totalIncome } = calculate({ initialInvestment, finalValue, yearsHeld, annualIncome, inflationRate });
  setResult('total-return', formatAUD(totalReturn));
  setResult('total-return-pct', formatPercent(totalReturnPct));
  setResult('cagr', formatPercent(cagr));
  setResult('real-cagr', formatPercent(realCagr));
  setResult('total-income', formatAUD(totalIncome));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['initial-investment', 'final-value', 'years-held', 'annual-income', 'inflation-rate'], update);
  update();
});
