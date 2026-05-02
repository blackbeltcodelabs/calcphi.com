/**
 * CalcPhi — client-side geo utilities
 *
 * Responsibilities:
 *   • Read / write the cp_country cookie (30-day user preference)
 *   • Populate and show the geo banner ONLY on a genuine market mismatch
 *   • Wire header/footer market links so clicking them saves the cookie
 *   • Expose switchCountry() globally for inline onclick use
 *
 * Banner logic:
 *   Show ONLY when the user has an explicit saved preference for a
 *   DIFFERENT market than the one they are currently viewing.
 *   If no cookie → they arrived via geo-redirect or direct URL → no banner.
 *   If cookie matches current market → they are exactly where they want to be → no banner.
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const COOKIE_COUNTRY   = 'cp_country';
const COOKIE_DISMISSED = 'cp_banner_v2'; // bump to force re-show after logic change
const COOKIE_TTL_DAYS  = 30;
const DISMISS_TTL_DAYS = 30;

const MARKETS = {
  india: {
    code: 'IN',
    flag: '🇮🇳',
    name: 'India',
    path: '/india/',
  },
  australia: {
    code: 'AU',
    flag: '🇦🇺',
    name: 'Australia',
    path: '/australia/',
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

// ── Detect current market from URL ───────────────────────────────────────────
function getCurrentMarket() {
  const path = window.location.pathname;
  if (path.startsWith('/india'))     return 'india';
  if (path.startsWith('/australia')) return 'australia';
  return null;
}

// ── Switch country: save cookie + navigate ───────────────────────────────────
function switchCountry(code, path) {
  setCookie(COOKIE_COUNTRY, code.toUpperCase(), COOKIE_TTL_DAYS);
  window.location.href = path;
}

window.CP = window.CP || {};
window.CP.switchCountry = switchCountry;

// ── Geo banner ───────────────────────────────────────────────────────────────
function initBanner() {
  const banner = document.getElementById('geo-banner');
  if (!banner) return;

  const market = getCurrentMarket();
  if (!market) { banner.hidden = true; return; }

  const current = MARKETS[market];
  const savedCountry = (getCookie(COOKIE_COUNTRY) || '').toUpperCase();

  // No banner if: no saved preference, or preference matches current market
  if (!savedCountry || savedCountry === current.code) {
    banner.hidden = true;
    return;
  }

  // Dismissed permanently for this mismatch?
  if (getCookie(COOKIE_DISMISSED) === savedCountry) { banner.hidden = true; return; }

  // Find the market the user actually prefers
  const preferred = Object.values(MARKETS).find(m => m.code === savedCountry);
  if (!preferred) { banner.hidden = true; return; }

  // Populate banner
  const switchBtn = banner.querySelector('[data-geo-switch]');
  const closeBtn  = banner.querySelector('[data-geo-close]');
  const textEl    = banner.querySelector('[data-geo-text]');

  if (textEl) {
    textEl.innerHTML = `Your saved preference is <strong>${preferred.flag} ${preferred.name}</strong>`;
  }
  if (switchBtn) {
    switchBtn.textContent = `Go to ${preferred.name} →`;
  }

  banner.hidden = false;

  switchBtn?.addEventListener('click', () => switchCountry(preferred.code, preferred.path));

  closeBtn?.addEventListener('click', () => {
    // Dismiss until they switch markets again
    setCookie(COOKIE_DISMISSED, savedCountry, DISMISS_TTL_DAYS);
    banner.style.transition = 'opacity .2s';
    banner.style.opacity = '0';
    setTimeout(() => { banner.hidden = true; banner.style.opacity = ''; }, 220);
  });
}

// ── Wire market links to save cookie on click ─────────────────────────────────
function wireMarketLinks() {
  document.querySelectorAll('[data-market-code]').forEach(el => {
    el.addEventListener('click', () => {
      const code = el.dataset.marketCode;
      if (code) setCookie(COOKIE_COUNTRY, code.toUpperCase(), COOKIE_TTL_DAYS);
    });
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBanner();
  wireMarketLinks();
});
