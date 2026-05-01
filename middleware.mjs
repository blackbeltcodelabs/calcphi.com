/**
 * CalcPhi Geo-Routing — Vercel Edge Middleware
 *
 * Priority order:
 *   1. User-stored cookie  (cp_country)
 *   2. Vercel / Cloudflare geo header
 *   3. Fallback → homepage (no redirect)
 *
 * Only intercepts GET "/" — all other paths pass through untouched.
 * Bots are never redirected (Google-compliant).
 */

export const config = {
  matcher: ['/', '/index.html'],
};

// ── Country → route mapping (add /usa, /uk, /canada when those go live) ──────
const ROUTE_MAP = {
  IN: '/india/',
  AU: '/australia/',
  // US: '/usa/',
  // GB: '/uk/',
  // CA: '/canada/',
};

// ── Known crawlers and bots — extend as needed ────────────────────────────────
const BOT_RE = /googlebot|google-inspectiontool|bingbot|yandex|baiduspider|duckduckbot|slurp|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|whatsapp|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|screaming.frog|gptbot|claudebot/i;

const COOKIE_NAME = 'cp_country';

// ── Parse raw cookie header into key-value map ────────────────────────────────
function parseCookies(header) {
  const map = {};
  if (!header) return map;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    try { map[k] = decodeURIComponent(v); } catch { map[k] = v; }
  }
  return map;
}

export default function middleware(request) {
  const url = new URL(request.url);

  // Only handle root — never touch /india/*, /australia/*, /blog/*, etc.
  if (url.pathname !== '/' && url.pathname !== '/index.html') return;

  // ── 1. Skip bots — serve default page, allow all crawlers ────────────────
  const ua = request.headers.get('user-agent') ?? '';
  if (BOT_RE.test(ua)) return;

  // ── 2. Skip browser prefetch / prerender requests ────────────────────────
  const purpose = request.headers.get('purpose') ?? request.headers.get('sec-purpose') ?? '';
  if (purpose === 'prefetch' || purpose === 'prerender') return;

  const cookies = parseCookies(request.headers.get('cookie'));

  let route = null;

  // ── Priority 1: User-stored cookie preference ─────────────────────────────
  const saved = cookies[COOKIE_NAME]?.toUpperCase();
  if (saved && ROUTE_MAP[saved]) {
    route = ROUTE_MAP[saved];
  }

  // ── Priority 2: Edge geo-detection (Vercel or Cloudflare header) ──────────
  if (!route) {
    const geoCountry = (
      request.headers.get('x-vercel-ip-country') ??
      request.headers.get('cf-ipcountry') ??
      ''
    ).toUpperCase().trim();

    if (geoCountry && geoCountry !== 'XX' && ROUTE_MAP[geoCountry]) {
      route = ROUTE_MAP[geoCountry];
    }
  }

  // ── Priority 3: No match → stay on homepage (don't force unknown users) ───
  if (!route) return;

  // 302 Temporary redirect — NEVER 301 (preserves ability to change routing later)
  return Response.redirect(new URL(route, request.url).toString(), 302);
}
