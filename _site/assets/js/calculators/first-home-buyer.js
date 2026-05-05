import { formatAUD, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

const STAMP_DUTY = {
  NSW: (v, fhb, type) => {
    if (fhb === 'yes' && type === 'new' && v <= 800000) return 0;
    if (fhb === 'yes' && type === 'new' && v <= 1000000) return Math.round((v - 800000) / 200000 * calcNSWDuty(v));
    return calcNSWDuty(v);
  },
  VIC: (v, fhb, type) => {
    if (fhb === 'yes' && v <= 600000) return 0;
    if (fhb === 'yes' && v <= 750000) return Math.round(calcVICDuty(v) * (v - 600000) / 150000);
    return calcVICDuty(v);
  },
  QLD: (v, fhb) => {
    if (fhb === 'yes' && v <= 500000) return 0;
    return calcQLDDuty(v);
  },
  SA:  (v) => calcSADuty(v),
  WA:  (v, fhb) => { const d = calcWADuty(v); return fhb === 'yes' && v <= 430000 ? 0 : d; },
  TAS: (v) => calcTASDuty(v),
  NT:  (v) => calcNTDuty(v),
  ACT: (v, fhb) => fhb === 'yes' ? 0 : calcACTDuty(v),
};

function calcNSWDuty(v) {
  if (v <= 16000) return Math.round(v * 0.0125);
  if (v <= 35000) return Math.round(200 + (v - 16000) * 0.015);
  if (v <= 93000) return Math.round(485 + (v - 35000) * 0.0175);
  if (v <= 351000) return Math.round(1500 + (v - 93000) * 0.035);
  if (v <= 1168000) return Math.round(10530 + (v - 351000) * 0.045);
  return Math.round(47295 + (v - 1168000) * 0.07);
}
function calcVICDuty(v) {
  if (v <= 25000) return Math.round(v * 0.014);
  if (v <= 130000) return Math.round(350 + (v - 25000) * 0.024);
  if (v <= 440000) return Math.round(2870 + (v - 130000) * 0.05);
  if (v <= 960000) return Math.round(18370 + (v - 440000) * 0.06);
  return Math.round(55000 + (v - 960000) * 0.065);
}
function calcQLDDuty(v) {
  if (v <= 5000) return 0;
  if (v <= 75000) return Math.round((v - 5000) * 0.015);
  if (v <= 540000) return Math.round(1050 + (v - 75000) * 0.035);
  if (v <= 1000000) return Math.round(17325 + (v - 540000) * 0.045);
  return Math.round(38025 + (v - 1000000) * 0.0575);
}
function calcSADuty(v) {
  if (v <= 12000) return Math.round(v * 0.01);
  if (v <= 30000) return Math.round(120 + (v - 12000) * 0.02);
  if (v <= 50000) return Math.round(480 + (v - 30000) * 0.03);
  if (v <= 100000) return Math.round(1080 + (v - 50000) * 0.035);
  if (v <= 200000) return Math.round(2830 + (v - 100000) * 0.04);
  if (v <= 250000) return Math.round(6830 + (v - 200000) * 0.0425);
  if (v <= 300000) return Math.round(8955 + (v - 250000) * 0.05);
  if (v <= 500000) return Math.round(11455 + (v - 300000) * 0.055);
  return Math.round(22455 + (v - 500000) * 0.055);
}
function calcWADuty(v) {
  if (v <= 80000) return Math.round(v * 0.019);
  if (v <= 100000) return Math.round(1520 + (v - 80000) * 0.019);
  if (v <= 250000) return Math.round(2090 + (v - 100000) * 0.028);
  if (v <= 500000) return Math.round(6290 + (v - 250000) * 0.038);
  return Math.round(15790 + (v - 500000) * 0.055);
}
function calcTASDuty(v) {
  if (v <= 3000) return Math.round(v * 0.01);
  if (v <= 25000) return Math.round(50 + (v - 3000) * 0.015);
  if (v <= 75000) return Math.round(380 + (v - 25000) * 0.025);
  if (v <= 200000) return Math.round(1630 + (v - 75000) * 0.04);
  if (v <= 375000) return Math.round(6630 + (v - 200000) * 0.04);
  if (v <= 725000) return Math.round(13630 + (v - 375000) * 0.04);
  return Math.round(27630 + (v - 725000) * 0.04);
}
function calcNTDuty(v) {
  return Math.round(0.065 * v);
}
function calcACTDuty(v) {
  if (v <= 200000) return Math.round(v * 0.02);
  if (v <= 300000) return Math.round(4000 + (v - 200000) * 0.035);
  if (v <= 500000) return Math.round(7500 + (v - 300000) * 0.05);
  if (v <= 750000) return Math.round(17500 + (v - 500000) * 0.062);
  if (v <= 1000000) return Math.round(33000 + (v - 750000) * 0.062);
  return Math.round(48500 + (v - 1000000) * 0.065);
}

const FHOG = {
  NSW: (v, type) => type === 'new' && v <= 600000 ? 10000 : 0,
  VIC: (v, type) => type === 'new' && v <= 750000 ? 10000 : 0,
  QLD: (v, type) => type === 'new' && v <= 750000 ? 30000 : 0,
  SA:  (v, type) => type === 'new' ? 15000 : 0,
  WA:  (v, type) => type === 'new' && v <= 750000 ? 10000 : 0,
  TAS: (v, type) => type === 'new' ? 30000 : 0,
  NT:  (v, type) => type === 'new' ? 10000 : 0,
  ACT: () => 0,
};

function calculate({ propertyPrice, state, firstHome, propertyType, depositPercent }) {
  const dutyFn = STAMP_DUTY[state] || calcNSWDuty;
  const stampDuty = typeof dutyFn === 'function'
    ? dutyFn(propertyPrice, firstHome, propertyType)
    : 0;
  const fhogFn = FHOG[state] || (() => 0);
  const fhog = firstHome === 'yes' ? fhogFn(propertyPrice, propertyType) : 0;
  const deposit = Math.round(propertyPrice * depositPercent / 100);
  const totalUpfront = deposit + stampDuty - fhog;
  return { stampDuty, fhog, depositRequired: deposit, totalUpfront };
}

function update() {
  const propertyPrice = getInputValue('property-price');
  const state = getSelectValue('state');
  const firstHome = getSelectValue('first-home-owner');
  const propertyType = getSelectValue('property-type');
  const depositPercent = getInputValue('deposit-percent');
  const { stampDuty, fhog, depositRequired, totalUpfront } = calculate({ propertyPrice, state, firstHome, propertyType, depositPercent });
  setResult('stamp-duty', stampDuty === 0 ? 'Nil (exemption)' : formatAUD(stampDuty));
  setResult('fhog', fhog > 0 ? formatAUD(fhog) : 'Not eligible');
  setResult('deposit-required', formatAUD(depositRequired));
  setResult('total-upfront', formatAUD(Math.max(0, totalUpfront)));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['property-price', 'state', 'first-home-owner', 'property-type', 'deposit-percent'], update);
  update();
});
