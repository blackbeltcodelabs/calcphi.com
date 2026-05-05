import { formatINR, setResult, getInputValue, bindInputs, buildTableRows } from '../ui.js';

function calculate({ corpus, monthlyTransfer, sourceRate, equityRate, months }) {
  const rSource = sourceRate / 12 / 100;
  const rEquity = equityRate / 12 / 100;

  let sourceBalance = corpus;
  let equityBalance = 0;
  const yearData = [];

  for (let m = 1; m <= months; m++) {
    // Source fund earns interest first
    sourceBalance = sourceBalance * (1 + rSource);
    // Transfer to equity
    const transfer = Math.min(monthlyTransfer, sourceBalance);
    sourceBalance -= transfer;
    // Equity balance grows and receives transfer
    equityBalance = equityBalance * (1 + rEquity) + transfer;

    if (m % 12 === 0 || m === months) {
      yearData.push([m, formatINR(transfer * (m % 12 === 0 ? 12 : m % 12)), formatINR(sourceBalance), formatINR(equityBalance)]);
    }
  }

  const totalTransferred = Math.min(monthlyTransfer * months, corpus);
  return { finalEquityCorpus: equityBalance, sourceRemaining: sourceBalance, totalTransferred, yearData };
}

function renderBreakdown(yearData) {
  const head = document.getElementById('breakdown-head');
  const body = document.getElementById('breakdown-body');
  if (!head || !body) return;
  head.innerHTML = '<tr><th scope="col">Month</th><th scope="col">Transferred (₹)</th><th scope="col">Source Balance (₹)</th><th scope="col">Equity Balance (₹)</th></tr>';
  body.innerHTML = buildTableRows(yearData);
}

function update() {
  const corpus = getInputValue('stp-corpus');
  const monthlyTransfer = getInputValue('monthly-investment');
  const sourceRate = getInputValue('stp-source-rate');
  const equityRate = getInputValue('return-rate');
  const months = getInputValue('tenure');
  const { finalEquityCorpus, sourceRemaining, totalTransferred, yearData } = calculate({ corpus, monthlyTransfer, sourceRate, equityRate, months });
  setResult('final-equity-corpus', formatINR(finalEquityCorpus));
  setResult('source-remaining', formatINR(sourceRemaining));
  setResult('total-transferred', formatINR(totalTransferred));
  renderBreakdown(yearData);
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['stp-corpus', 'monthly-investment', 'stp-source-rate', 'return-rate', 'tenure'], update);
  update();
});
