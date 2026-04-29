import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const corpus = getInputValue('ir-corpus');
  const inflation = getInputValue('ir-inflation') / 100;
  const years = getInputValue('ir-years');
  const realValue = corpus / Math.pow(1 + inflation, years);
  const purchasingPowerLoss = corpus - realValue;
  const breakeven = Math.pow(corpus / (corpus * 0.10), 1 / years) - 1;
  setResult('ir-real-value', formatINR(realValue));
  setResult('ir-loss', formatINR(purchasingPowerLoss));
  setResult('ir-percent-lost', ((1 - realValue / corpus) * 100).toFixed(1) + '%');
  setResult('ir-needed-return', (inflation * 100).toFixed(1) + '% to maintain value');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['ir-corpus','ir-inflation','ir-years'], update);
  update();
});
