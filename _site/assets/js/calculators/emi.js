import { formatINR, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ principal, rate, years }) {
  if (rate === 0) {
    const emi = principal / (years * 12);
    const total = principal;
    return { emi, totalInterest: 0, totalPayment: total, yearData: [] };
  }
  const r = rate / 12 / 100;
  const n = years * 12;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;
  const yearData = [];
  let balance = principal;
  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0, yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const intPart = balance * r;
      const prinPart = Math.min(emi - intPart, balance);
      yearInterest += intPart;
      yearPrincipal += prinPart;
      balance -= prinPart;
    }
    yearData.push([y, formatINR(yearPrincipal), formatINR(yearInterest), formatINR(Math.max(balance, 0))]);
  }
  return { emi, totalInterest, totalPayment, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th scope="col">Year</th><th scope="col">Principal Paid (₹)</th><th scope="col">Interest Paid (₹)</th><th scope="col">Outstanding (₹)</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const principal = getInputValue('loan-amount');
  const rate = getInputValue('interest-rate');
  const years = getInputValue('loan-tenure');
  const { emi, totalInterest, totalPayment, yearData } = calculate({ principal, rate, years });
  setResult('monthly-emi', formatINR(emi));
  setResult('total-interest', formatINR(totalInterest));
  setResult('total-payment', formatINR(totalPayment));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['loan-amount', 'interest-rate', 'loan-tenure'], update);
  update();
});
