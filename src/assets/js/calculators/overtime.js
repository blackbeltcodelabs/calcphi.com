import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const basic = getInputValue('ot-basic');
  const hours = getInputValue('ot-hours');
  const workDays = getInputValue('ot-work-days');
  const hourlyRate = basic / (workDays * 8);
  const otRate = hourlyRate * 2;
  const otPay = otRate * hours;
  const monthly = basic + otPay;
  setResult('ot-hourly', formatINR(hourlyRate));
  setResult('ot-ot-rate', formatINR(otRate));
  setResult('ot-ot-pay', formatINR(otPay));
  setResult('ot-total', formatINR(monthly));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ot-basic','ot-hours','ot-work-days'], update);
  update();
});
