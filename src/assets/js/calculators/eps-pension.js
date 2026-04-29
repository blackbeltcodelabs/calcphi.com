import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

function update() {
  const salary = Math.min(getInputValue('eps-salary'), 15000);
  const years = getInputValue('eps-years');
  const pensionableSalary = salary;
  const pension = (pensionableSalary * years) / 70;
  const empContrib = salary * 0.0833;
  const totalContrib = empContrib * 12 * years;
  setResult('eps-monthly-pension', formatINR(pension));
  setResult('eps-annual-pension', formatINR(pension * 12));
  setResult('eps-employer-contrib', formatINR(empContrib));
  setResult('eps-total-contrib', formatINR(totalContrib));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['eps-salary','eps-years'], update);
  update();
});
