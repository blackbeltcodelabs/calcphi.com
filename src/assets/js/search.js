(function () {
  'use strict';

  // ── Search index ──────────────────────────────────────────────────────────
  var INDEX = [
    // Australia — Home Loans
    { t: 'Mortgage Calculator',         k: 'home loan repayment monthly amortization',           c: 'Home Loans',          m: 'AU', u: '/australia/mortgage-calculator/' },
    { t: 'Offset Account Calculator',   k: 'mortgage offset interest savings redraw',             c: 'Home Loans',          m: 'AU', u: '/australia/offset-account-calculator/' },
    { t: 'LMI Calculator',              k: 'lenders mortgage insurance LVR deposit 20%',          c: 'Home Loans',          m: 'AU', u: '/australia/lmi-calculator/' },
    { t: 'Refinance Calculator',        k: 'refinancing break even savings switch lender',        c: 'Home Loans',          m: 'AU', u: '/australia/refinance-calculator/' },
    { t: 'Rent vs Buy Calculator',      k: 'renting buying property cost comparison',             c: 'Home Loans',          m: 'AU', u: '/australia/rent-vs-buy-calculator/' },
    { t: 'First Home Buyer Calculator', k: 'FHOG first home owner grant stamp duty deposit',      c: 'Home Loans',          m: 'AU', u: '/australia/first-home-buyer-calculator/' },
    { t: 'Stamp Duty Calculator',       k: 'transfer duty NSW VIC QLD WA state FHB concession',  c: 'Home Loans',          m: 'AU', u: '/australia/stamp-duty-calculator/' },
    { t: 'Borrowing Power Calculator',  k: 'how much can I borrow APRA serviceability buffer',   c: 'Home Loans',          m: 'AU', u: '/australia/borrowing-power-calculator/' },
    { t: 'Extra Repayment Calculator',  k: 'extra mortgage repayment interest saved years cut',   c: 'Home Loans',          m: 'AU', u: '/australia/extra-repayment-calculator/' },
    // Australia — Tax
    { t: 'Income Tax Calculator',       k: 'ATO tax Stage 3 Medicare levy LITO FY2026',          c: 'Tax',                 m: 'AU', u: '/australia/income-tax-calculator/' },
    { t: 'Capital Gains Tax Calculator',k: 'CGT 50% discount investment property shares',        c: 'Tax',                 m: 'AU', u: '/australia/capital-gains-tax-calculator/' },
    { t: 'Salary Take-Home Calculator', k: 'net pay after tax weekly fortnightly monthly',        c: 'Tax',                 m: 'AU', u: '/australia/salary-take-home-calculator/' },
    { t: 'PAYG Withholding Calculator', k: 'PAYG employer tax withheld schedule 1',              c: 'Tax',                 m: 'AU', u: '/australia/payg-withholding-calculator/' },
    { t: 'Redundancy Calculator',       k: 'genuine redundancy tax free ETP termination payout', c: 'Tax',                 m: 'AU', u: '/australia/redundancy-calculator/' },
    // Australia — Superannuation
    { t: 'Super Balance Calculator',    k: 'superannuation projected balance retirement age',     c: 'Superannuation',      m: 'AU', u: '/australia/super-balance-calculator/' },
    { t: 'Salary Sacrifice Calculator', k: 'salary sacrifice super concessional tax saving',     c: 'Superannuation',      m: 'AU', u: '/australia/salary-sacrifice-calculator/' },
    { t: 'Age Pension Calculator',      k: 'Centrelink age pension entitlement means test',      c: 'Superannuation',      m: 'AU', u: '/australia/age-pension-calculator/' },
    { t: 'Super Fund Comparison',       k: 'compare super funds fee return annual impact',       c: 'Superannuation',      m: 'AU', u: '/australia/super-comparison-calculator/' },
    // Australia — Savings & Investments
    { t: 'Compound Interest Calculator',k: 'compound interest savings future value growth',      c: 'Savings',             m: 'AU', u: '/australia/compound-interest-calculator/' },
    { t: 'Franking Credits Calculator', k: 'franking credits dividend imputation tax offset',    c: 'Savings',             m: 'AU', u: '/australia/franking-credits-calculator/' },
    { t: 'Investment Returns Calculator',k:'CAGR total return inflation adjusted growth ETF',    c: 'Savings',             m: 'AU', u: '/australia/investment-returns-calculator/' },
    { t: 'Term Deposit Calculator',     k: 'term deposit interest maturity CBA Westpac ANZ NAB', c: 'Savings',             m: 'AU', u: '/australia/term-deposit-calculator/' },
    { t: 'Savings Goal Calculator',     k: 'how long to save house deposit emergency fund',      c: 'Savings',             m: 'AU', u: '/australia/savings-goal-calculator/' },
    { t: 'Net Worth Calculator',        k: 'assets liabilities debt ratio wealth property super', c: 'Savings',            m: 'AU', u: '/australia/net-worth-calculator/' },
    { t: 'Budget Calculator (50/30/20)',k: '50 30 20 budget savings rate surplus deficit',       c: 'Savings',             m: 'AU', u: '/australia/budget-calculator/' },
    // Australia — Borrowing
    { t: 'Car Loan Calculator',         k: 'car loan monthly repayment total interest auto',     c: 'Borrowing',           m: 'AU', u: '/australia/car-loan-calculator/' },
    { t: 'Personal Loan Calculator',    k: 'personal loan repayment total interest unsecured',   c: 'Borrowing',           m: 'AU', u: '/australia/personal-loan-calculator/' },
    { t: 'HECS-HELP Repayment',         k: 'HECS HELP student debt repayment years to pay off', c: 'Borrowing',           m: 'AU', u: '/australia/hecs-repayment-calculator/' },
    // Australia — Property Investment
    { t: 'Rental Yield Calculator',     k: 'gross net rental yield cash flow investment property',c: 'Property Investment', m: 'AU', u: '/australia/rental-yield-calculator/' },
    { t: 'Negative Gearing Calculator', k: 'negative gearing tax saving rental loss depreciation',c:'Property Investment',  m: 'AU', u: '/australia/negative-gearing-calculator/' },

    // India — Mutual Funds
    { t: 'SIP Calculator',              k: 'SIP systematic investment plan monthly returns wealth',c: 'Mutual Funds',       m: 'IN', u: '/india/sip-calculator/' },
    { t: 'Step-Up SIP Calculator',      k: 'step up increasing SIP annual top-up growing',        c: 'Mutual Funds',       m: 'IN', u: '/india/step-up-sip-calculator/' },
    { t: 'Lumpsum Calculator',          k: 'lumpsum one time investment mutual fund returns',      c: 'Mutual Funds',       m: 'IN', u: '/india/lumpsum-calculator/' },
    { t: 'Goal-Based SIP Calculator',   k: 'SIP goal based target corpus planning retirement',    c: 'Mutual Funds',       m: 'IN', u: '/india/goal-sip-calculator/' },
    { t: 'SIP vs Lumpsum',              k: 'SIP vs lumpsum comparison which is better',           c: 'Mutual Funds',       m: 'IN', u: '/india/sip-vs-lumpsum-calculator/' },
    { t: 'ELSS Calculator',             k: 'ELSS tax saving mutual fund 80C 3 year lock-in',      c: 'Mutual Funds',       m: 'IN', u: '/india/elss-calculator/' },
    { t: 'CAGR Calculator',             k: 'CAGR compound annual growth rate returns MF',         c: 'Mutual Funds',       m: 'IN', u: '/india/cagr-calculator/' },
    { t: 'Direct vs Regular MF',        k: 'direct regular mutual fund expense ratio difference', c: 'Mutual Funds',       m: 'IN', u: '/india/direct-vs-regular-calculator/' },
    { t: 'MF Returns Calculator',       k: 'mutual fund returns absolute XIRR NAV',              c: 'Mutual Funds',       m: 'IN', u: '/india/mf-returns-calculator/' },
    { t: 'STP Calculator',              k: 'STP systematic transfer plan switch fund',            c: 'Mutual Funds',       m: 'IN', u: '/india/stp-calculator/' },
    { t: 'SWP Calculator',              k: 'SWP systematic withdrawal plan monthly income',       c: 'Mutual Funds',       m: 'IN', u: '/india/swp-calculator/' },
    // India — Tax
    { t: 'Income Tax Calculator',       k: 'income tax India FY 2026-27 AY 2027-28 slabs',       c: 'Tax',                m: 'IN', u: '/india/income-tax-calculator/' },
    { t: 'New vs Old Tax Regime',       k: 'new old tax regime comparison 87A rebate',            c: 'Tax',                m: 'IN', u: '/india/new-vs-old-regime-calculator/' },
    { t: 'HRA Calculator',              k: 'HRA house rent allowance exemption section 10',       c: 'Tax',                m: 'IN', u: '/india/hra-calculator/' },
    { t: 'Capital Gains Tax',           k: 'LTCG STCG capital gains tax India 10% 20%',          c: 'Tax',                m: 'IN', u: '/india/capital-gains-calculator/' },
    { t: 'Section 80C Deductions',      k: '80C deductions PPF ELSS life insurance limit 1.5L',  c: 'Tax',                m: 'IN', u: '/india/section-80c-calculator/' },
    { t: 'Section 80D Deductions',      k: '80D health insurance medical premium deduction',      c: 'Tax',                m: 'IN', u: '/india/section-80d-calculator/' },
    { t: 'GST Calculator',              k: 'GST goods services tax 5% 12% 18% 28% India',        c: 'Tax',                m: 'IN', u: '/india/gst-calculator/' },
    { t: 'TDS Calculator',              k: 'TDS tax deducted at source form 16',                  c: 'Tax',                m: 'IN', u: '/india/tds-calculator/' },
    { t: 'Advance Tax Calculator',      k: 'advance tax quarterly payment self assessment',       c: 'Tax',                m: 'IN', u: '/india/advance-tax-calculator/' },
    { t: 'Home Loan Tax Benefit',       k: 'home loan tax benefit 24b 80EEA interest deduction', c: 'Tax',                m: 'IN', u: '/india/home-loan-tax-calculator/' },
    // India — Banking & Fixed Income
    { t: 'FD Calculator',               k: 'fixed deposit FD interest maturity bank India',       c: 'Banking',            m: 'IN', u: '/india/fd-calculator/' },
    { t: 'RD Calculator',               k: 'recurring deposit RD monthly interest maturity',      c: 'Banking',            m: 'IN', u: '/india/rd-calculator/' },
    { t: 'Compound Interest',           k: 'compound interest daily monthly annual principal',    c: 'Banking',            m: 'IN', u: '/india/compound-interest-calculator/' },
    { t: 'Senior Citizen FD Calculator',k: 'senior citizen FD extra interest 0.5% bank',         c: 'Banking',            m: 'IN', u: '/india/senior-citizen-fd-calculator/' },
    { t: 'Tax Saver FD Calculator',     k: 'tax saver FD 80C 5 year lock-in fixed deposit',      c: 'Banking',            m: 'IN', u: '/india/tax-saver-fd-calculator/' },
    // India — Government Schemes
    { t: 'PPF Calculator',              k: 'PPF public provident fund 7.1% 15 year India',       c: 'Govt Schemes',       m: 'IN', u: '/india/ppf-calculator/' },
    { t: 'NPS Calculator',              k: 'NPS national pension scheme 80CCD retirement',        c: 'Govt Schemes',       m: 'IN', u: '/india/nps-calculator/' },
    { t: 'EPF Calculator',              k: 'EPF provident fund employer employee contribution',   c: 'Govt Schemes',       m: 'IN', u: '/india/epf-calculator/' },
    { t: 'SSY Calculator',              k: 'SSY Sukanya Samriddhi Yojana girl child scheme',      c: 'Govt Schemes',       m: 'IN', u: '/india/ssy-calculator/' },
    { t: 'APY Calculator',              k: 'APY Atal Pension Yojana monthly pension 60',         c: 'Govt Schemes',       m: 'IN', u: '/india/apy-calculator/' },
    { t: 'NSC Calculator',              k: 'NSC national savings certificate post office',        c: 'Govt Schemes',       m: 'IN', u: '/india/nsc-calculator/' },
    { t: 'SCSS Calculator',             k: 'SCSS senior citizen savings scheme quarterly',        c: 'Govt Schemes',       m: 'IN', u: '/india/scss-calculator/' },
    // India — Loans
    { t: 'EMI Calculator',              k: 'EMI loan monthly installment interest principal',     c: 'Loans',              m: 'IN', u: '/india/emi-calculator/' },
    { t: 'Home Loan EMI Calculator',    k: 'home loan EMI housing loan SBI HDFC India',          c: 'Loans',              m: 'IN', u: '/india/home-loan-emi-calculator/' },
    { t: 'Car Loan EMI Calculator',     k: 'car loan EMI vehicle auto finance India',            c: 'Loans',              m: 'IN', u: '/india/car-loan-emi-calculator/' },
    { t: 'Personal Loan EMI Calculator',k: 'personal loan EMI unsecured interest India',         c: 'Loans',              m: 'IN', u: '/india/personal-loan-emi-calculator/' },
    { t: 'Education Loan EMI Calculator',k:'education loan EMI student moratorium',              c: 'Loans',              m: 'IN', u: '/india/education-loan-emi-calculator/' },
    { t: 'Loan Prepayment Calculator',  k: 'loan prepayment part payment interest saved',        c: 'Loans',              m: 'IN', u: '/india/loan-prepayment-calculator/' },
    { t: 'Credit Card EMI Calculator',  k: 'credit card EMI no cost interest conversion',        c: 'Loans',              m: 'IN', u: '/india/credit-card-emi-calculator/' },
    { t: 'Loan Eligibility Calculator', k: 'loan eligibility income based how much can I get',   c: 'Loans',              m: 'IN', u: '/india/loan-eligibility-calculator/' },
    // India — Salary & Employment
    { t: 'CTC to In-Hand Salary',       k: 'CTC in-hand take-home salary breakdown India',       c: 'Salary',             m: 'IN', u: '/india/ctc-to-in-hand-calculator/' },
    { t: 'Gratuity Calculator',         k: 'gratuity payment 15 days years service India',       c: 'Salary',             m: 'IN', u: '/india/gratuity-calculator/' },
    { t: 'Salary Hike Calculator',      k: 'salary hike increment percentage new CTC',           c: 'Salary',             m: 'IN', u: '/india/salary-hike-calculator/' },
    { t: 'Leave Encashment Calculator', k: 'leave encashment PL EL tax India',                   c: 'Salary',             m: 'IN', u: '/india/leave-encashment-calculator/' },
    { t: 'Bonus After Tax Calculator',  k: 'bonus tax net in-hand India marginal rate',          c: 'Salary',             m: 'IN', u: '/india/bonus-after-tax-calculator/' },
    // India — Retirement
    { t: 'Retirement Corpus Calculator',k: 'retirement corpus planning inflation India',         c: 'Retirement',         m: 'IN', u: '/india/retirement-corpus-calculator/' },
    { t: 'FIRE Number Calculator',      k: 'FIRE financial independence retire early India',      c: 'Retirement',         m: 'IN', u: '/india/fire-number-calculator/' },
    // India — Real Estate
    { t: 'Stamp Duty Calculator',       k: 'stamp duty registration property India state',       c: 'Real Estate',        m: 'IN', u: '/india/stamp-duty-calculator/' },
    { t: 'Rent vs Buy Calculator',      k: 'rent vs buy property cost India breakeven',          c: 'Real Estate',        m: 'IN', u: '/india/rent-vs-buy-calculator/' },
    { t: 'Rental Yield Calculator',     k: 'rental yield gross net investment property India',   c: 'Real Estate',        m: 'IN', u: '/india/rental-yield-calculator/' },
  ];

  // ── Inject modal into DOM ─────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'cp-search-overlay';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Search calculators');
  wrap.innerHTML =
    '<div class="cp-search-modal">' +
      '<div class="cp-search-input-wrap">' +
        '<svg class="cp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
        '<input id="cp-search-input" type="text" placeholder="Search 130+ calculators — Australia & India…" autocomplete="off" spellcheck="false">' +
        '<button class="cp-search-close-btn" aria-label="Close search">ESC</button>' +
      '</div>' +
      '<ul id="cp-search-results" class="cp-search-results" role="listbox" aria-label="Search results"></ul>' +
      '<div class="cp-search-footer">' +
        '<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
        '<span><kbd>↵</kbd> open</span>' +
        '<span><kbd>Esc</kbd> close</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var overlay = document.getElementById('cp-search-overlay');
  var input   = document.getElementById('cp-search-input');
  var results = document.getElementById('cp-search-results');
  var active  = -1;

  function isOpen() { return overlay.classList.contains('is-open'); }

  // ── Open / close ──────────────────────────────────────────────────────────
  function open() {
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    active = -1;
    renderDefault();
    setTimeout(function() { input.focus(); }, 20);
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    active = -1;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function highlight(text, query) {
    if (!query) return esc(text);
    var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return esc(text).replace(re, '<mark>$1</mark>');
  }

  function getMarket() {
    var path = window.location.pathname;
    if (path.startsWith('/australia/')) return 'AU';
    if (path.startsWith('/india/')) return 'IN';
    try { return localStorage.getItem('cp_market') || null; } catch(e) { return null; }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderResults(items, query) {
    active = -1;
    results.innerHTML = '';
    if (!items.length) {
      var empty = document.createElement('li');
      empty.className = 'cp-search-empty';
      empty.innerHTML = 'No results for <strong>' + esc(query) + '</strong>';
      results.appendChild(empty);
      return;
    }
    var shown = items.slice(0, 9);
    shown.forEach(function(item, i) {
      var li = document.createElement('li');
      li.className = 'cp-search-item';
      li.setAttribute('role', 'option');
      li.setAttribute('data-url', item.u);
      li.setAttribute('data-idx', String(i));
      li.innerHTML =
        '<span class="cp-search-item__icon">' + (item.m === 'AU' ? '🇦🇺' : '🇮🇳') + '</span>' +
        '<span class="cp-search-item__body">' +
          '<span class="cp-search-item__title">' + highlight(item.t, query) + '</span>' +
          '<span class="cp-search-item__cat">' + esc(item.c) + ' · ' + (item.m === 'AU' ? 'Australia' : 'India') + '</span>' +
        '</span>' +
        '<svg class="cp-search-item__arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>';
      li.addEventListener('click', function() { go(item.u); });
      li.addEventListener('mouseenter', function() { setActive(i); });
      results.appendChild(li);
    });
  }

  function renderDefault() {
    var market = getMarket();
    var sorted = INDEX.slice().sort(function(a, b) {
      if (market && a.m === market && b.m !== market) return -1;
      if (market && b.m === market && a.m !== market) return 1;
      return 0;
    });
    renderResults(sorted, '');
  }

  function search(query) {
    var q = query.trim().toLowerCase();
    if (!q) { renderDefault(); return; }
    var market = getMarket();
    var hits = INDEX.filter(function(item) {
      return (item.t + ' ' + item.c + ' ' + item.k).toLowerCase().indexOf(q) !== -1;
    });
    hits.sort(function(a, b) {
      var aT = a.t.toLowerCase().indexOf(q) !== -1 ? 0 : 1;
      var bT = b.t.toLowerCase().indexOf(q) !== -1 ? 0 : 1;
      if (aT !== bT) return aT - bT;
      // secondary: prefer current market
      if (market) {
        if (a.m === market && b.m !== market) return -1;
        if (b.m === market && a.m !== market) return 1;
      }
      return 0;
    });
    renderResults(hits, q);
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  function items() { return results.querySelectorAll('.cp-search-item'); }

  function setActive(idx) {
    var els = items();
    els.forEach(function(el) { el.classList.remove('is-active'); el.removeAttribute('aria-selected'); });
    if (!els.length) return;
    active = Math.max(0, Math.min(idx, els.length - 1));
    els[active].classList.add('is-active');
    els[active].setAttribute('aria-selected', 'true');
    els[active].scrollIntoView({ block: 'nearest' });
  }

  function go(url) { window.location.href = url; }

  // ── Wire events ───────────────────────────────────────────────────────────

  // Header search button
  var btn = document.getElementById('cp-search-btn');
  if (btn) btn.addEventListener('click', function(e) { e.preventDefault(); open(); });

  // Close button inside modal
  var closeBtn = wrap.querySelector('.cp-search-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', close);

  // ⌘K / Ctrl+K — global shortcut
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (!isOpen()) return;
    switch (e.key) {
      case 'Escape':    close(); break;
      case 'ArrowDown': e.preventDefault(); setActive(active < 0 ? 0 : active + 1); break;
      case 'ArrowUp':   e.preventDefault(); setActive(active <= 0 ? 0 : active - 1); break;
      case 'Enter': {
        var els = items();
        var target = els[active >= 0 ? active : 0];
        if (target) go(target.getAttribute('data-url'));
        break;
      }
    }
  });

  // Click outside modal to close
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  // Real-time filtering
  input.addEventListener('input', function() { search(input.value); });

})();
