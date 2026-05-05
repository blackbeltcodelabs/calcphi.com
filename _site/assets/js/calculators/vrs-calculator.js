import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const basic = getInputValue('vrs-basic');
  const years = getInputValue('vrs-years');
  const remainingYears = getInputValue('vrs-remaining');
  const leaves = getInputValue('vrs-leaves');
  const exGratia = basic * Math.min(years, 25) * 3;
  const gratuity = Math.min(basic * years * 15 / 26, 2000000);
  const leaveEnc = basic / 26 * leaves;
  const total = exGratia + gratuity + leaveEnc;
  const taxFreeGratuity = Math.min(gratuity, 2000000);
  const taxableComponent = exGratia;
  setResult('vrs-ex-gratia', formatINR(exGratia));
  setResult('vrs-gratuity', formatINR(gratuity));
  setResult('vrs-leave', formatINR(leaveEnc));
  setResult('vrs-total', formatINR(total));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['vrs-basic','vrs-years','vrs-remaining','vrs-leaves'], update);
  update();
});
