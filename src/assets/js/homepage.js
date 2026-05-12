(function () {
  'use strict';

  // ── Carousel + widget animations ─────────────────────────────────────────
  var slides = [document.getElementById('hp-slide-0'), document.getElementById('hp-slide-1')];
  var dots   = [document.getElementById('hp-dot-0'),  document.getElementById('hp-dot-1')];
  if (!slides[0] || !slides[1]) return;
  var cur = 0;

  var heroText = [
    {
      sub:     'SIPs, EMIs, taxes, retirement — every calculator you\'ll ever need, free, fast, and tuned for India.',
      cta1:    { text: 'Open SIP calculator →', href: '/india/sip-calculator/' },
      cta2:    { text: 'Browse all 108 →', href: '/india/' },
      metricN: '108',
      metricL: 'India calculators'
    },
    {
      sub:     'Mortgage repayments, superannuation, stamp duty, HECS-HELP — every calculator built for Australian homeowners and investors.',
      cta1:    { text: 'Open Mortgage calculator →', href: '/australia/mortgage-calculator/' },
      cta2:    { text: 'Browse Australia →', href: '/australia/' },
      metricN: '30',
      metricL: 'Australia calculators'
    }
  ];

  var subEl     = document.getElementById('hp-hero-sub');
  var cta1El    = document.getElementById('hp-hero-cta1');
  var cta2El    = document.getElementById('hp-hero-cta2');
  var metricNEl = document.getElementById('hp-metric-n');
  var metricLEl = document.getElementById('hp-metric-l');

  function goTo(idx) {
    slides[cur].classList.remove('active');
    dots[cur].classList.remove('dot-active');
    dots[cur].setAttribute('aria-selected', 'false');
    cur = idx;
    slides[cur].classList.add('active');
    dots[cur].classList.add('dot-active');
    dots[cur].setAttribute('aria-selected', 'true');
    subEl.style.opacity = '0';
    setTimeout(function () {
      var h = heroText[cur];
      subEl.textContent     = h.sub;
      cta1El.textContent    = h.cta1.text;
      cta1El.href           = h.cta1.href;
      cta2El.textContent    = h.cta2.text;
      cta2El.href           = h.cta2.href;
      metricNEl.textContent = h.metricN;
      metricLEl.textContent = h.metricL;
      subEl.style.opacity   = '1';
    }, 200);
  }

  dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });

  var timer = setInterval(function () { goTo((cur + 1) % slides.length); }, 6000);
  var carousel = document.getElementById('hp-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
    carousel.addEventListener('mouseleave', function () {
      timer = setInterval(function () { goTo((cur + 1) % slides.length); }, 6000);
    });
  }

  // ── SIP widget animation ──────────────────────────────────────────────────
  var sipScenarios = [
    [10000, 12, 15],
    [5000,  12, 10],
    [25000, 14, 20],
    [15000, 10, 10]
  ];
  var sCur = 0;

  function calcSIP(monthly, rate, years) {
    var r = rate / 12 / 100, n = years * 12;
    return monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }
  function fmtINR(n) {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(1) + 'Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + 'L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function setSIP(idx) {
    var s = sipScenarios[idx], monthly = s[0], rate = s[1], years = s[2];
    var maturity = calcSIP(monthly, rate, years);
    var invested = monthly * years * 12;
    var returns  = maturity - invested;
    var retPct   = Math.round(returns / maturity * 100);
    var moFill   = document.getElementById('hp-sip-mo-fill');
    var rateFill = document.getElementById('hp-sip-rate-fill');
    var termFill = document.getElementById('hp-sip-term-fill');
    if (moFill)   moFill.style.width   = ((monthly - 500) / 49500 * 100).toFixed(1) + '%';
    if (rateFill) rateFill.style.width = ((rate - 1) / 29 * 100).toFixed(1) + '%';
    if (termFill) termFill.style.width = ((years - 1) / 39 * 100).toFixed(1) + '%';
    var invEl = document.getElementById('hp-sip-invested');
    if (!invEl) return;
    invEl.style.opacity = '0';
    setTimeout(function () {
      var e = function (id) { return document.getElementById(id); };
      e('hp-sip-monthly') && (e('hp-sip-monthly').textContent = '₹' + monthly.toLocaleString('en-IN'));
      e('hp-sip-rate')    && (e('hp-sip-rate').textContent    = rate + '%');
      e('hp-sip-term')    && (e('hp-sip-term').textContent    = years + ' Years');
      e('hp-sip-arc')     && e('hp-sip-arc').setAttribute('stroke-dasharray', retPct + ' ' + (100 - retPct));
      e('hp-sip-pct')     && (e('hp-sip-pct').textContent     = retPct + '%');
      invEl.textContent = fmtINR(invested);
      e('hp-sip-returns') && (e('hp-sip-returns').textContent = fmtINR(returns));
      e('hp-sip-total')   && (e('hp-sip-total').textContent   = fmtINR(maturity));
      invEl.style.opacity = '1';
    }, 280);
  }

  setSIP(0);
  setInterval(function () { sCur = (sCur + 1) % sipScenarios.length; setSIP(sCur); }, 3500);

  // ── Mortgage widget animation ─────────────────────────────────────────────
  var mortgageScenarios = [
    [650000,  6.24, 30],
    [800000,  6.50, 25],
    [450000,  5.99, 20],
    [1100000, 6.74, 30]
  ];
  var mCur = 0;

  function calcMo(loan, rate, term) {
    var r = rate / 100 / 12, n = term * 12;
    var pv = Math.pow(1 + r, n);
    return loan * r * pv / (pv - 1);
  }
  function fmt(n) { return 'A$' + Math.round(n).toLocaleString('en-AU'); }

  function setMortgage(idx) {
    var s = mortgageScenarios[idx], loan = s[0], rate = s[1], term = s[2];
    var mo = calcMo(loan, rate, term), total = mo * term * 12, interest = total - loan;
    var lf = document.getElementById('hp-au-loan-fill');
    var rf = document.getElementById('hp-au-rate-fill');
    var tf = document.getElementById('hp-au-term-fill');
    if (lf) lf.style.width = ((loan - 200000) / 1300000 * 100).toFixed(1) + '%';
    if (rf) rf.style.width = ((rate - 3) / 9 * 100).toFixed(1) + '%';
    if (tf) tf.style.width = ((term - 10) / 20 * 100).toFixed(1) + '%';
    var el = document.getElementById('hp-au-monthly');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(function () {
      var e = function (id) { return document.getElementById(id); };
      e('hp-au-loan')      && (e('hp-au-loan').textContent      = fmt(loan));
      e('hp-au-rate')      && (e('hp-au-rate').textContent      = rate.toFixed(2) + '% p.a.');
      e('hp-au-term')      && (e('hp-au-term').textContent      = term + ' years');
      el.textContent = fmt(mo);
      e('hp-au-principal') && (e('hp-au-principal').textContent = fmt(loan));
      e('hp-au-interest')  && (e('hp-au-interest').textContent  = fmt(interest));
      e('hp-au-total')     && (e('hp-au-total').textContent     = fmt(total));
      el.style.opacity = '1';
    }, 280);
  }

  setMortgage(0);
  setInterval(function () { mCur = (mCur + 1) % mortgageScenarios.length; setMortgage(mCur); }, 3500);

  // ── Count-up stats animation ──────────────────────────────────────────────
  var STATS = [
    { target: 259, suffix: '',  dur: 1400, hold: 1000, delay: 0   },
    { target: 2,   suffix: '',  dur: 600,  hold: 1000, delay: 350 },
    { target: 0,   suffix: '',  dur: 0,    hold: 0,    delay: 0   },
    { target: 100, suffix: '%', dur: 1000, hold: 1000, delay: 700 }
  ];

  function loop(el, s) {
    var t0 = null;
    el.textContent = '0' + s.suffix;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / s.dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * s.target) + s.suffix;
      if (p < 1) { requestAnimationFrame(tick); }
      else { setTimeout(function () { loop(el, s); }, s.hold); }
    }
    requestAnimationFrame(tick);
  }

  function pulseZero(el) {
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = '0.25';
    setTimeout(function () {
      el.style.opacity = '1';
      setTimeout(function () { pulseZero(el); }, 2000);
    }, 600);
  }

  var statEls = document.querySelectorAll('[data-count]');
  statEls.forEach(function (el, i) {
    var s = STATS[i];
    if (!s) return;
    if (s.target === 0) {
      el.textContent = '0';
      pulseZero(el);
    } else {
      el.textContent = '0' + s.suffix;
      setTimeout(function () { loop(el, s); }, s.delay);
    }
  });
})();
