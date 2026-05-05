import { formatINR, setResult, getInputValue, bindInputs } from '../ui.js';

// Monthly contribution table: [age, pension1000, pension2000, pension3000, pension4000, pension5000]
const APY_TABLE = {
  18:[42,84,126,168,210], 20:[50,100,150,198,248], 22:[59,117,177,234,292],
  25:[76,151,226,301,376], 28:[97,194,292,388,485], 30:[116,231,347,462,577],
  35:[181,362,543,722,902], 40:[291,582,873,1164,1454]
};

function update() {
  const age = parseInt(getInputValue('apy-age')) || 25;
  const pension = parseInt(document.getElementById('apy-pension')?.value || '3000');
  const closestAge = Object.keys(APY_TABLE).reduce((a, b) => Math.abs(b - age) < Math.abs(a - age) ? b : a);
  const row = APY_TABLE[closestAge];
  const idx = [1000,2000,3000,4000,5000].indexOf(pension);
  const monthly = idx >= 0 ? row[idx] : row[2];
  const years = 60 - age;
  const totalContrib = monthly * 12 * years;
  setResult('apy-monthly', formatINR(monthly));
  setResult('apy-years', years.toString());
  setResult('apy-total-contrib', formatINR(totalContrib));
  setResult('apy-pension-out', formatINR(pension));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['apy-age'], update);
  const sel = document.getElementById('apy-pension');
  if (sel) sel.addEventListener('change', update);
  update();
});
