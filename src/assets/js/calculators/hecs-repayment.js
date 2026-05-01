import { formatAUD, formatPercent, setResult, getInputValue, bindInputs } from '../ui.js';

const REPAYMENT_THRESHOLDS = [
  [54435, 0.01],
  [62851, 0.02],
  [66621, 0.025],
  [70619, 0.03],
  [74856, 0.035],
  [79347, 0.04],
  [84108, 0.045],
  [89155, 0.05],
  [94504, 0.055],
  [100175, 0.06],
  [106186, 0.065],
  [112557, 0.07],
  [119311, 0.075],
  [126469, 0.08],
  [134057, 0.085],
  [142101, 0.09],
  [150627, 0.095],
  [Infinity, 0.10],
];

function getRepaymentRate(income) {
  for (const [threshold, rate] of REPAYMENT_THRESHOLDS) {
    if (income < threshold) return rate;
  }
  return 0.10;
}

function calculate({ hecsBalance, annualIncome, incomeGrowth, indexationRate }) {
  const thisYearRate = getRepaymentRate(annualIncome);
  const thisYearRepayment = annualIncome * thisYearRate;
  const indexationAdded = hecsBalance * (indexationRate / 100);

  let balance = hecsBalance;
  let income = annualIncome;
  let totalRepaid = 0;
  let years = 0;
  const MAX_YEARS = 50;

  while (balance > 0.01 && years < MAX_YEARS) {
    const indexation = balance * (indexationRate / 100);
    balance += indexation;
    const repayRate = getRepaymentRate(income);
    const repayment = Math.min(balance, income * repayRate);
    balance -= repayment;
    totalRepaid += repayment;
    income *= (1 + incomeGrowth / 100);
    years++;
  }

  return { thisYearRepayment, thisYearRate: thisYearRate * 100, indexationAdded, yearsToClear: years >= MAX_YEARS ? '50+' : years, totalRepaid };
}

function update() {
  const hecsBalance = getInputValue('hecs-balance');
  const annualIncome = getInputValue('annual-income');
  const incomeGrowth = getInputValue('income-growth');
  const indexationRate = getInputValue('indexation-rate');
  const { thisYearRepayment, thisYearRate, indexationAdded, yearsToClear, totalRepaid } = calculate({ hecsBalance, annualIncome, incomeGrowth, indexationRate });
  setResult('this-year-repayment', formatAUD(thisYearRepayment));
  setResult('this-year-rate', formatPercent(thisYearRate));
  setResult('indexation-added', formatAUD(indexationAdded));
  setResult('years-to-clear', typeof yearsToClear === 'number' ? `${yearsToClear} years` : yearsToClear);
  setResult('total-repaid', formatAUD(totalRepaid));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['hecs-balance', 'annual-income', 'income-growth', 'indexation-rate'], update);
  update();
});
