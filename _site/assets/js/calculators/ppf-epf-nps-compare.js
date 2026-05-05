import { formatINR, setResult, getInputValue, buildTableRows, bindInputs } from '../ui.js';

function calcFV(annual, rate, years) {
  let v = 0;
  for (let y = 0; y < years; y++) v = (v + annual) * (1 + rate);
  return v;
}

function update() {
  const annual = getInputValue('penc-annual');
  const years = getInputValue('penc-years');
  const ppf = calcFV(annual, 0.071, years);
  const epf = calcFV(annual, 0.0825, years);
  const nps = calcFV(annual, 0.10, years);
  setResult('penc-ppf', formatINR(ppf));
  setResult('penc-epf', formatINR(epf));
  setResult('penc-nps', formatINR(nps));
  setResult('penc-invested', formatINR(annual * years));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['penc-annual','penc-years'], update);
  update();
});
