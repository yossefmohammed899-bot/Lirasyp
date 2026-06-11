// ============================================
// Crypto Page - Single Row Compact Cards
// ============================================

const CRYPTO_ICONS = {
  'BTC': '₿', 'ETH': 'Ξ', 'BNB': 'B', 'SOL': 'S',
  'ADA': 'A', 'TRX': 'T', 'USDT': '₮', 'XAUT': 'AU', 'OIL': '🛢️'
};

const CRYPTO_COLORS = {
  'BTC': { bg: 'rgba(245, 158, 11, 0.12)', accent: '#f59e0b' },
  'ETH': { bg: 'rgba(99, 102, 241, 0.12)', accent: '#6366f1' },
  'BNB': { bg: 'rgba(245, 158, 11, 0.12)', accent: '#f59e0b' },
  'SOL': { bg: 'rgba(139, 92, 246, 0.12)', accent: '#8b5cf6' },
  'ADA': { bg: 'rgba(14, 165, 233, 0.12)', accent: '#0ea5e9' },
  'TRX': { bg: 'rgba(239, 68, 68, 0.12)', accent: '#ef4444' },
  'USDT': { bg: 'rgba(16, 185, 129, 0.12)', accent: '#10b981' },
  'PAXG': { bg: 'rgba(245, 158, 11, 0.12)', accent: '#f59e0b' }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('crypto-cards-grid')) return;
  await loadCryptoCards();
});

async function loadCryptoCards() {
  const crypto = await fetchLatestCrypto();
  const grid = document.getElementById('crypto-cards-grid');
  const lastUpdate = document.getElementById('last-update');

  if (crypto.length === 0) {
    if (grid) grid.innerHTML = '<div class="loading-cell" style="grid-column:1/-1;text-align:center;padding:3rem">لا توجد بيانات متاحة</div>';
    return;
  }

  if (lastUpdate && crypto[0]) {
    lastUpdate.textContent = 'آخر تحديث: ' + formatDate(crypto[0].fetched_at);
  }

  if (grid) {
    grid.innerHTML = crypto.map(c => {
      const icon = CRYPTO_ICONS[c.currency_code] || '💎';
      const colors = CRYPTO_COLORS[c.currency_code] || { bg: 'rgba(139, 92, 246, 0.12)', accent: '#8b5cf6' };

      return `
        <div class="crypto-card-compact" style="--card-accent: ${colors.accent}; --card-bg: ${colors.bg};">
          
          <!-- اليمين: الاسم + الايقونة -->
          <div class="crypto-compact-left">
            <div class="crypto-compact-icon" style="background:${colors.bg}; color:${colors.accent};">
              ${icon}
            </div>
            <div class="crypto-compact-name">
              <span class="crypto-compact-title">${c.currency_name_ar || c.currency_code}</span>
            </div>
          </div>

          <!-- النص: السعر -->
          <div class="crypto-compact-center">
            <span class="crypto-compact-price">$${formatNumber(c.price_usd, c.price_usd < 1 ? 4 : 2)}</span>
          </div>

          <!-- الشمال: التغيير -->
          <div class="crypto-compact-right">
            ${formatChange(c.change_24h_percent)}
          </div>

        </div>
      `;
    }).join('');
  }
}
