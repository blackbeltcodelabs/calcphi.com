import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const inclusive = getInputValue('gst-inclusive');
  const rate = parseFloat(document.getElementById('gst-rate-r')?.value || '18');
  const base = inclusive / (1 + rate / 100);
  const gstAmt = inclusive - base;
  setResult('gst-base', formatINR(base));
  setResult('gst-rev-tax', formatINR(gstAmt));
  setResult('gst-cgst-r', formatINR(gstAmt / 2));
  setResult('gst-sgst-r', formatINR(gstAmt / 2));
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('gst-inclusive');
  const sel = document.getElementById('gst-rate-r');
  if (el) el.addEventListener('input', update);
  if (sel) sel.addEventListener('change', update);
  update();
});
