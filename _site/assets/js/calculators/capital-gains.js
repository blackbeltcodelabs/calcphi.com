import { formatINR, formatPercent, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

function calculate({ buyPrice, sellPrice, years, assetType }) {
  const gain = sellPrice - buyPrice;
  const isLong = assetType === 'equity' ? years >= 1 : years >= 2;
  let tax = 0, taxNote = '';
  if (gain <= 0) { tax = 0; taxNote = 'No tax (loss)'; }
  else if (assetType === 'equity') {
    if (isLong) { const taxable = Math.max(0, gain - 125000); tax = taxable * 0.125; taxNote = '12.5% LTCG above ₹1.25L'; }
    else { tax = gain * 0.20; taxNote = '20% STCG'; }
  } else if (assetType === 'debt') {
    tax = 0; taxNote = 'Taxed at slab rate (debt funds post-Apr 2023)';
  } else {
    if (isLong) { tax = gain * 0.20; taxNote = '20% LTCG with indexation'; }
    else { tax = gain * 0.30; taxNote = 'STCG at slab rate (est. 30%)'; }
  }
  const netGain = gain - tax;
  return { gain, tax, netGain, isLong, taxNote };
}

function update() {
  const buyPrice = getInputValue('cg-buy-price');
  const sellPrice = getInputValue('cg-sell-price');
  const years = getInputValue('cg-years');
  const assetType = getSelectValue('cg-asset-type') || 'equity';
  const { gain, tax, netGain, isLong, taxNote } = calculate({ buyPrice, sellPrice, years, assetType });
  setResult('cg-gain', formatINR(gain));
  setResult('cg-type', isLong ? 'Long-term (LTCG)' : 'Short-term (STCG)');
  setResult('cg-tax', formatINR(tax));
  setResult('cg-net', formatINR(netGain));
  const note = document.getElementById('cg-tax-note');
  if (note) note.textContent = taxNote;
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['cg-buy-price', 'cg-sell-price', 'cg-years'], update);
  const sel = document.getElementById('cg-asset-type');
  if (sel) sel.addEventListener('change', update);
  update();
});
