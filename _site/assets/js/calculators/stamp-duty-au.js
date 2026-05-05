import { formatAUD, setResult, getInputValue, getSelectValue, bindInputs } from '../ui.js';

// State stamp duty bracket calculators (2026 rates, approximate)
function calcNSW(price) {
  if (price <= 16000)       return price * 0.0125;
  if (price <= 35000)       return 200 + (price - 16000) * 0.015;
  if (price <= 93000)       return 490 + (price - 35000) * 0.0175;
  if (price <= 351000)      return 1505 + (price - 93000) * 0.035;
  if (price <= 1168000)     return 10535 + (price - 351000) * 0.045;
  if (price <= 3505000)     return 47300 + (price - 1168000) * 0.055;
  return 175735 + (price - 3505000) * 0.07;
}

function calcVIC(price) {
  if (price <= 25000)       return price * 0.014;
  if (price <= 130000)      return 350 + (price - 25000) * 0.024;
  if (price <= 960000)      return 2870 + (price - 130000) * 0.06;
  return 55870 + (price - 960000) * 0.055;
}

function calcQLD(price) {
  if (price <= 5000)        return 0;
  if (price <= 75000)       return (price - 5000) * 0.015;
  if (price <= 540000)      return 1050 + (price - 75000) * 0.035;
  if (price <= 1000000)     return 17325 + (price - 540000) * 0.045;
  return 38025 + (price - 1000000) * 0.0575;
}

function calcWA(price) {
  if (price <= 80000)       return price * 0.019;
  if (price <= 100000)      return 1520 + (price - 80000) * 0.0285;
  if (price <= 250000)      return 2090 + (price - 100000) * 0.038;
  if (price <= 500000)      return 7790 + (price - 250000) * 0.0475;
  return 19665 + (price - 500000) * 0.0515;
}

function calcSA(price) {
  if (price <= 12000)       return price * 0.01;
  if (price <= 30000)       return 120 + (price - 12000) * 0.02;
  if (price <= 50000)       return 480 + (price - 30000) * 0.03;
  if (price <= 100000)      return 1080 + (price - 50000) * 0.035;
  if (price <= 200000)      return 2830 + (price - 100000) * 0.04;
  if (price <= 250000)      return 6830 + (price - 200000) * 0.0425;
  if (price <= 300000)      return 8955 + (price - 250000) * 0.0475;
  if (price <= 500000)      return 11330 + (price - 300000) * 0.05;
  return 21330 + (price - 500000) * 0.055;
}

function calcTAS(price) {
  if (price <= 3000)        return 50;
  if (price <= 25000)       return 50 + (price - 3000) * 0.0175;
  if (price <= 75000)       return 435 + (price - 25000) * 0.0225;
  if (price <= 200000)      return 1560 + (price - 75000) * 0.035;
  if (price <= 375000)      return 5935 + (price - 200000) * 0.04;
  if (price <= 725000)      return 12935 + (price - 375000) * 0.0425;
  return 27810 + (price - 725000) * 0.045;
}

function calcACT(price) {
  if (price <= 200000)      return price * 0.006;
  if (price <= 300000)      return 1200 + (price - 200000) * 0.012;
  if (price <= 500000)      return 2400 + (price - 300000) * 0.022;
  if (price <= 750000)      return 6800 + (price - 500000) * 0.034;
  if (price <= 1000000)     return 15300 + (price - 750000) * 0.04;
  return 25300 + (price - 1000000) * 0.0454;
}

function calcNT(price) {
  // NT uses: D = (0.06571441 × V² + 15V) where V = price / 1000
  const v = price / 1000;
  return (0.06571441 * v * v + 15 * v);
}

function calcStampDuty(price, state) {
  const fns = { NSW: calcNSW, VIC: calcVIC, QLD: calcQLD, WA: calcWA, SA: calcSA, TAS: calcTAS, ACT: calcACT, NT: calcNT };
  return (fns[state] || calcNSW)(price);
}

function calcFHBConcession(price, state, duty) {
  // Returns amount of concession (reduction from standard duty)
  if (state === 'NSW') {
    if (price <= 800000) return duty; // full exemption
    if (price <= 1000000) {
      // Linear concession from 100% at $800k to 0% at $1M
      const frac = (1000000 - price) / 200000;
      return duty * frac;
    }
    return 0;
  }
  if (state === 'VIC') {
    if (price <= 600000) return duty; // full exemption (established)
    if (price <= 750000) {
      const frac = (750000 - price) / 150000;
      return duty * frac;
    }
    return 0;
  }
  if (state === 'QLD') {
    if (price <= 500000) return duty; // full concession
    if (price <= 550000) {
      const frac = (550000 - price) / 50000;
      return duty * frac;
    }
    return 0;
  }
  if (state === 'WA') {
    if (price <= 430000) return duty; // full exemption
    if (price <= 530000) {
      const frac = (530000 - price) / 100000;
      return duty * frac;
    }
    return 0;
  }
  if (state === 'SA') {
    // SA: no stamp duty for first home buyers of new homes up to $650k
    if (price <= 650000) return duty;
    return 0;
  }
  if (state === 'TAS') {
    // TAS: 50% concession for FHB on established homes up to $600k
    if (price <= 600000) return duty * 0.5;
    return 0;
  }
  if (state === 'ACT') {
    // ACT: Home Buyer Concession Scheme — income and property value tested
    if (price <= 500000) return duty;
    return 0;
  }
  if (state === 'NT') {
    // NT: FHB discount of up to $18,601
    return Math.min(duty, 18601);
  }
  return 0;
}

function calculate({ price, state, buyerType }) {
  const grossDuty = calcStampDuty(price, state);
  const concession = buyerType === 'fhb' ? calcFHBConcession(price, state, grossDuty) : 0;
  const netDuty = Math.max(0, grossDuty - concession);
  const otherCosts = 3500; // conveyancing + inspections estimate
  const totalUpfront = netDuty + otherCosts;
  return { grossDuty, concession, netDuty, totalUpfront };
}

function update() {
  const price = getInputValue('property-price');
  const state = getSelectValue('state');
  const buyerType = getSelectValue('buyer-type');
  const { grossDuty, concession, netDuty, totalUpfront } = calculate({ price, state, buyerType });
  setResult('stamp-duty-gross', formatAUD(grossDuty));
  setResult('fhb-concession', concession > 0 ? '− ' + formatAUD(concession) : 'None');
  setResult('stamp-duty-net', formatAUD(netDuty));
  setResult('total-upfront', formatAUD(totalUpfront));
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputs(['property-price', 'state', 'buyer-type'], update);
  update();
});
