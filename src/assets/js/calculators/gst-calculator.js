import { formatINR, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function update() {
  const amount = getInputValue('gst-amount');
  const rate = parseFloat(document.getElementById('gst-rate')?.value || '18');
  const gstAmt = amount * rate / 100;
  const total = amount + gstAmt;
  const cgst = gstAmt / 2;
  const sgst = gstAmt / 2;
  setResult('gst-tax', formatINR(gstAmt));
  setResult('gst-total', formatINR(total));
  setResult('gst-cgst', formatINR(cgst));
  setResult('gst-sgst', formatINR(sgst));
}

document.addEventListener('DOMContentLoaded', () => {
  const amtEl = document.getElementById('gst-amount');
  const rateEl = document.getElementById('gst-rate');
  if (amtEl) amtEl.addEventListener('input', update);
  if (rateEl) rateEl.addEventListener('change', update);
  update();
});
