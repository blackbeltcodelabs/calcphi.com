/* CalcPhi — shared UI utilities */

export function formatINR(value) {
  const num = Math.round(Number(value));
  if (isNaN(num)) return '—';
  return '₹' + num.toLocaleString('en-IN');
}

export function formatUSD(value) {
  const num = Math.round(Number(value));
  if (isNaN(num)) return '—';
  return '$' + num.toLocaleString('en-US');
}

export function formatAUD(value) {
  const num = Math.round(Number(value));
  if (isNaN(num)) return '—';
  return 'A$' + num.toLocaleString('en-AU');
}

export function formatAUDCents(value) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return 'A$' + num.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatUSDCents(value) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(value, decimals = 0) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

export function formatPercent(value, decimals = 2) {
  return Number(value).toFixed(decimals) + '%';
}

export function setResult(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) || 0 : 0;
}

export function getSelectValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

export function bindInputs(ids, callback) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', callback);
  });
}

export function buildTableRows(rows) {
  return rows.map(cells =>
    `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
}

/* Mobile nav toggle */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });
});
