import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const limit = getInputValue('od-limit');
  const used = getInputValue('od-used');
  const rate = getInputValue('od-rate') / 100 / 365;
  const days = getInputValue('od-days');

  const interest = used * rate * days;
  const available = limit - used;
  const annualCost = used * (getInputValue('od-rate') / 100);

  setResult('od-interest', formatINR(interest));
  setResult('od-daily-rate', formatINR(used * rate));
  setResult('od-available', formatINR(available));
  setResult('od-annual-cost', formatINR(annualCost));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['od-limit', 'od-used', 'od-rate', 'od-days'], update);
  update();
});
