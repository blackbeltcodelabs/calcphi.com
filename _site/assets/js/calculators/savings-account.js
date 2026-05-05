import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const principal = getInputValue('sa-balance');
  const rate = getInputValue('sa-rate') / 100;
  const months = getInputValue('sa-months');

  const monthlyRate = rate / 12;
  const quarterlyInterest = principal * (rate / 4);
  const annualInterest = principal * rate;
  const corpus = principal * Math.pow(1 + monthlyRate, months);
  const interest = corpus - principal;

  setResult('sa-monthly-interest', formatINR(principal * monthlyRate));
  setResult('sa-quarterly-interest', formatINR(quarterlyInterest));
  setResult('sa-annual-interest', formatINR(annualInterest));
  setResult('sa-corpus', formatINR(corpus));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['sa-balance', 'sa-rate', 'sa-months'], update);
  update();
});
