import { formatAUD, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

const PAY_PERIODS = { weekly: 52, fortnightly: 26, monthly: 12, quarterly: 4 };

const HECS_RATES = [
  [54435, 0.01], [62851, 0.02], [66621, 0.025], [70619, 0.03],
  [74856, 0.035], [79347, 0.04], [84108, 0.045], [89155, 0.05],
  [94504, 0.055], [100175, 0.06], [106186, 0.065], [112557, 0.07],
  [119311, 0.075], [126469, 0.08], [134057, 0.085], [142101, 0.09],
  [150627, 0.095], [Infinity, 0.10],
];

function calcAnnualTax(income, tfnClaimed) {
  if (tfnClaimed === 'no') return income * 0.47;
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.19;
  if (income <= 135000) return 5092 + (income - 45000) * 0.325;
  if (income <= 190000) return 34417 + (income - 135000) * 0.37;
  return 55267 + (income - 190000) * 0.45;
}

function calcHecsRate(income) {
  for (const [threshold, rate] of HECS_RATES) {
    if (income < threshold) return rate;
  }
  return 0.10;
}

function calcMedicare(income) {
  if (income <= 26000) return 0;
  if (income <= 36000) return (income - 26000) * 0.1;
  return income * 0.02;
}

function calculate({ grossIncome, payFrequency, tfnClaimed, hecsDebt }) {
  const periods = PAY_PERIODS[payFrequency] || 26;
  const annualIncome = grossIncome * periods;
  const annualTax = calcAnnualTax(annualIncome, tfnClaimed);
  const annualMedicare = calcMedicare(annualIncome);
  const annualTotal = annualTax + annualMedicare;
  const hecsRate = hecsDebt === 'yes' ? calcHecsRate(annualIncome) : 0;
  const annualHecs = annualIncome * hecsRate;
  const taxWithheld = annualTotal / periods;
  const hecsWithheld = annualHecs / periods;
  const totalWithheld = taxWithheld + hecsWithheld;
  const netPay = grossIncome - totalWithheld;
  return { taxWithheld, hecsWithheld, totalWithheld, netPay };
}

function update() {
  const grossIncome = getInputValue('gross-income');
  const payFrequency = getSelectValue('pay-frequency');
  const tfnClaimed = getSelectValue('tfn-claimed');
  const hecsDebt = getSelectValue('hecs-debt');
  const { taxWithheld, hecsWithheld, totalWithheld, netPay } = calculate({ grossIncome, payFrequency, tfnClaimed, hecsDebt });
  setResult('tax-withheld', formatAUD(taxWithheld));
  setResult('hecs-withheld', formatAUD(hecsWithheld));
  setResult('total-withheld', formatAUD(totalWithheld));
  setResult('net-pay', formatAUD(netPay));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['gross-income', 'pay-frequency', 'tfn-claimed', 'hecs-debt'], update);
  update();
});
