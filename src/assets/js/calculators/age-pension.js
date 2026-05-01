import { formatAUD, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

// 2025-26 age pension rates (per fortnight)
const MAX_PENSION = { single: 1144.40, couple: 862.60 };
// Assets test free area
const ASSETS_FREE = {
  'single-homeowner': 301750,
  'single-non-homeowner': 521500,
  'couple-homeowner': 451500,
  'couple-non-homeowner': 671250,
};
// Income test free area (per fortnight)
const INCOME_FREE = { single: 204, couple: 360 };

function calculate({ age, relationshipStatus, superAssets, nonFinancialAssets, homeOwner, incomePerFortnight }) {
  if (age < 67) {
    return { maxPension: 0, assetsTestResult: 0, incomeTestResult: 0, pensionPayable: 0, pensionFortnightly: 0, note: 'Below pension age (67)' };
  }
  const isCouple = relationshipStatus === 'couple';
  const isHomeowner = homeOwner === 'yes';
  const maxPension = isCouple ? MAX_PENSION.couple : MAX_PENSION.single;
  const totalAssets = superAssets + nonFinancialAssets;

  const assetKey = `${isCouple ? 'couple' : 'single'}-${isHomeowner ? 'homeowner' : 'non-homeowner'}`;
  const assetsFree = ASSETS_FREE[assetKey];
  const assetsAboveFree = Math.max(0, totalAssets - assetsFree);
  // Pension reduces by $3 per fortnight per $1,000 of assets above free area
  const assetsTestResult = Math.max(0, maxPension - (assetsAboveFree / 1000) * 3);

  const incomeFree = isCouple ? INCOME_FREE.couple / 2 : INCOME_FREE.single;
  const incomeAboveFree = Math.max(0, incomePerFortnight - incomeFree);
  // Pension reduces by 50c per $1 of income above free area
  const incomeTestResult = Math.max(0, maxPension - incomeAboveFree * 0.5);

  const pensionFortnightly = Math.min(assetsTestResult, incomeTestResult);
  const pensionPayable = pensionFortnightly * 26;

  return { maxPension, assetsTestResult, incomeTestResult, pensionPayable, pensionFortnightly };
}

function update() {
  const age = getInputValue('age');
  const relationshipStatus = getSelectValue('relationship-status');
  const superAssets = getInputValue('super-assets');
  const nonFinancialAssets = getInputValue('non-financial-assets');
  const homeOwner = getSelectValue('home-owner');
  const incomePerFortnight = getInputValue('income-per-fortnight');
  const { maxPension, assetsTestResult, incomeTestResult, pensionPayable, pensionFortnightly } = calculate({ age, relationshipStatus, superAssets, nonFinancialAssets, homeOwner, incomePerFortnight });
  setResult('max-pension', formatAUD(maxPension) + '/fortnight');
  setResult('assets-test-result', formatAUD(assetsTestResult) + '/fortnight');
  setResult('income-test-result', formatAUD(incomeTestResult) + '/fortnight');
  setResult('pension-payable', formatAUD(pensionPayable) + '/year');
  setResult('pension-fortnightly', formatAUD(pensionFortnightly) + '/fortnight');
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['age', 'relationship-status', 'super-assets', 'non-financial-assets', 'home-owner', 'income-per-fortnight'], update);
  update();
});
