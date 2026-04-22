/* =========================================================
   BLACK BELT CODE LABS — CalcPhi Shared JS Utilities
   ========================================================= */

// ── FORMAT HELPERS ──────────────────────────────────────────
function formatINR(n) {
  n = Math.round(n);
  if (n >= 1e7)  return '₹' + (n / 1e7).toFixed(2)  + ' Cr';
  if (n >= 1e5)  return '₹' + (n / 1e5).toFixed(2)  + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

function formatINRFull(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function formatINRShort(n) {
  if (n >= 1e7)  return '₹' + (n / 1e7).toFixed(1)  + 'Cr';
  if (n >= 1e5)  return '₹' + (n / 1e5).toFixed(1)  + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}

function formatNum(n) {
  return Math.round(n).toLocaleString('en-IN');
}

function formatPct(n, decimals = 1) {
  return n.toFixed(decimals) + '%';
}

// ── CHART FACTORY ────────────────────────────────────────────
function makeAreaChart(ctx, labels, datasets) {
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: sharedChartOptions()
  });
}

function makeBarChart(ctx, labels, datasets) {
  const opts = sharedChartOptions();
  opts.scales.x.stacked = true;
  opts.scales.y.stacked = true;
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: opts
  });
}

function sharedChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#94a3b8',
          font: { family: 'DM Sans', size: 12 },
          boxWidth: 10, boxHeight: 10, borderRadius: 3
        }
      },
      tooltip: {
        backgroundColor: '#161f35',
        borderColor: '#1e2d4a', borderWidth: 1,
        titleColor: '#f1f5f9', bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${formatINR(ctx.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 }, maxTicksLimit: 10 }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 }, callback: v => formatINRShort(v) }
      }
    }
  };
}

function gradientFill(ctx, color, alpha = 0.35) {
  const g = ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
  g.addColorStop(1, color.replace(')', ',0)').replace('rgb', 'rgba'));
  return g;
}

// ── FAQ TOGGLE ────────────────────────────────────────────────
function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── NAV ACTIVE LINK ───────────────────────────────────────────
(function() {
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();
