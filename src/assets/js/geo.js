/**
 * CalcPhi — client-side geo utilities
 *
 * Responsibilities:
 *   • Read / write the cp_country cookie (30-day user preference)
 *   • Populate and show the geo banner on market-specific pages
 *   • Wire header market links so clicking them saves the cookie
 *   • Expose switchCountry() globally for inline onclick use
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const COOKIE_COUNTRY   = 'cp_country';
const COOKIE_DISMISSED = 'cp_banner_v1'; // bump version to force re-show after a change
const COOKIE_TTL_DAYS  = 30;
const DISMISS_TTL_DAYS = 7;

const MARKETS = {
  india: {
    code: 'IN',
    flag: '🇮🇳',
    name: 'India',
    path: '/india/',
    hreflang: 'en-in',
  },
  australia: {
    code: 'AU',
    flag: '🇦🇺',
    name: 'Australia',
    path: '/australia/',
    hreflang: 'en-au',
  },
};

// ── Cookie helpers ───────────────────────────────────────────────────────────
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

// ── Detect which market the user is currently browsing ───────────────────────
function getCurrentMarket() {
  const path = window.location.pathname;
  if (path.startsWith('/india'))     return 'india';
  if (path.startsWith('/australia')) return 'australia';
  return null; // homepage or other page
}

// ── Switch country: save cookie + navigate ───────────────────────────────────
function switchCountry(code, path) {
  setCookie(COOKIE_COUNTRY, code.toUpperCase(), COOKIE_TTL_DAYS);
  window.location.href = path;
}

// Expose for potential inline use (e.g. onclick="CP.switchCountry('IN','/india/')")
window.CP = window.CP || {};
window.CP.switchCountry = switchCountry;

// ── Geo banner ───────────────────────────────────────────────────────────────
function initBanner() {
  const banner = document.getElementById('geo-banner');
  if (!banner) return;

  const market = getCurrentMarket();
  if (!market) { banner.hidden = true; return; }

  // Suppressed by user for this market?
  if (getCookie(COOKIE_DISMISSED) === market) { banner.hidden = true; return; }

  const current = MARKETS[market];
  const other   = market === 'india' ? MARKETS.australia : MARKETS.india;

  // Fill in dynamic text
  const currentEl = banner.querySelector('[data-geo-current]');
  const switchBtn  = banner.querySelector('[data-geo-switch]');
  const closeBtn   = banner.querySelector('[data-geo-close]');

  if (currentEl) currentEl.textContent = `${current.flag} ${current.name}`;
  if (switchBtn) {
    switchBtn.textContent = `${other.flag} Switch to ${other.name}`;
  }

  banner.hidden = false;

  switchBtn?.addEventListener('click', () => switchCountry(other.code, other.path));

  closeBtn?.addEventListener('click', () => {
    setCookie(COOKIE_DISMISSED, market, DISMISS_TTL_DAYS);
    banner.style.transition = 'opacity .2s';
    banner.style.opacity = '0';
    setTimeout(() => { banner.hidden = true; banner.style.opacity = ''; }, 220);
  });
}

// ── Wire header / footer market links to save cookie ─────────────────────────
function wireMarketLinks() {
  document.querySelectorAll('[data-market-code]').forEach(el => {
    el.addEventListener('click', () => {
      const code = el.dataset.marketCode;
      if (code) setCookie(COOKIE_COUNTRY, code.toUpperCase(), COOKIE_TTL_DAYS);
      // href navigation proceeds normally
    });
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBanner();
  wireMarketLinks();
});
