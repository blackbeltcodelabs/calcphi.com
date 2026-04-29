import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const basic = getInputValue('epfc-basic');
  const vpf = getInputValue('epfc-vpf') / 100;
  const empEpf = basic * 0.12;
  const emplEpf = basic * 0.0367;
  const emplEps = Math.min(basic * 0.0833, 1250);
  const vpfAmt = basic * vpf;
  const totalEmployee = empEpf + vpfAmt;
  const totalEmployer = emplEpf + emplEps;
  setResult('epfc-emp-pf', formatINR(empEpf));
  setResult('epfc-vpf', formatINR(vpfAmt));
  setResult('epfc-empl-pf', formatINR(emplEpf));
  setResult('epfc-empl-eps', formatINR(emplEps));
  setResult('epfc-total-epf', formatINR(totalEmployee + emplEpf));
  setResult('epfc-total', formatINR(totalEmployee + totalEmployer));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['epfc-basic','epfc-vpf'], update);
  update();
});
