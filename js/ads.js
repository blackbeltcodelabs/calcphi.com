/* =========================================================
   CalcPhi Ad Manager
   - Lazy loads AdSense below the fold
   - Shows mobile anchor ad
   - Enables vignette on page transitions
   - Shows mid-calc ad on mobile only
   ========================================================= */

(function() {
  'use strict';

  // ── Replace with your AdSense Publisher ID ──────────────
  var PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXXX';

  // Inject AdSense script once (lazy, after user interaction)
  var adsenseLoaded = false;

  function loadAdSense() {
    if (adsenseLoaded) return;
    adsenseLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUBLISHER_ID;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    s.onload = function() { initAds(); };
  }

  // Trigger AdSense load on first scroll or click
  ['scroll', 'click', 'touchstart'].forEach(function(ev) {
    window.addEventListener(ev, function handler() {
      loadAdSense();
      window.removeEventListener(ev, handler);
    }, { once: true, passive: true });
  });

  // Init all ad slots after AdSense loads
  function initAds() {
    try {
      // Show mid-calc ad on mobile only (< 768px)
      if (window.innerWidth < 768) {
        document.querySelectorAll('.ad-mid-calc').forEach(function(el) {
          el.style.display = 'flex';
        });
      }
      // Push all ad slots
      document.querySelectorAll('.adsbygoogle').forEach(function() {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
      });
    } catch(e) {}
  }

  // Lazy-load ads below fold using IntersectionObserver
  function lazyLoadAds() {
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadAdSense();
          observer.disconnect();
        }
      });
    }, { rootMargin: '400px' });

    var belowFoldSlots = document.querySelectorAll('.ad-after-results, .ad-pre-faq, .ad-multiplex, .ad-in-content');
    if (belowFoldSlots.length > 0) observer.observe(belowFoldSlots[0]);
  }

  document.addEventListener('DOMContentLoaded', lazyLoadAds);

})();
