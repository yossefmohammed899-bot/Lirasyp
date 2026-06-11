// ============================================
// Currencies Page - Large Rate Cards
// ============================================

const CURRENCY_FLAGS = {
  'USD': '🇺🇸', 'SYP': '🇸🇾', 'EUR': '🇪🇺', 'TRY': '🇹🇷',
  'SAR': '🇸🇦', 'AED': '🇦🇪', 'QAR': '🇶🇦', 'JOD': '🇯🇴',
  'IQD': '🇮🇶', 'GBP': '🇬🇧', 'CHF': '🇨🇭'
};

const CURRENCY_COLORS = {
  'USD': { bg: 'rgba(14, 165, 233, 0.08)', accent: '#0ea5e9' },
  'EUR': { bg: 'rgba(99, 102, 241, 0.08)', accent: '#6366f1' },
  'TRY': { bg: 'rgba(239, 68, 68, 0.08)', accent: '#ef4444' },
  'SAR': { bg: 'rgba(16, 185, 129, 0.08)', accent: '#10b981' },
  'AED': { bg: 'rgba(245, 158, 11, 0.08)', accent: '#f59e0b' },
  'QAR': { bg: 'rgba(139, 92, 246, 0.08)', accent: '#8b5cf6' },
  'JOD': { bg: 'rgba(236, 72, 153, 0.08)', accent: '#ec4899' },
  'IQD': { bg: 'rgba(6, 182, 212, 0.08)', accent: '#06b6d4' },
  'GBP': { bg: 'rgba(249, 115, 22, 0.08)', accent: '#f97316' },
  'CHF': { bg: 'rgba(20, 184, 166, 0.08)', accent: '#14b8a6' }
};

// Sort order: 1=USD, 2=TRY, 3=EUR, 4=AED, 5=SAR, 6=JOD, 7=QAR, 8=GBP, 9=IQD, 10=CHF
const SORT_ORDER = {
  'USD': 1, 'TRY': 2, 'EUR': 3, 'AED': 4, 'SAR': 5,
  'JOD': 6, 'QAR': 7, 'GBP': 8, 'IQD': 9, 'CHF': 10
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('currency-cards-grid')) return;

  await loadCurrencyCards();
});

async function loadCurrencyCards() {
  const rates = await fetchLatestRates();
  const grid = document.getElementById('currency-cards-grid');
  const lastUpdate = document.getElementById('last-update');

  if (rates.length === 0) {
    if (grid) grid.innerHTML = '<div class="loading-cell" style="grid-column:1/-1;text-align:center;padding:3rem">لا توجد بيانات متاحة</div>';
    return;
  }

  // Get USD rate for cross-calculation
  const usdRate = rates.find(r => r.currency_code === 'USD');

  // Sort rates by custom order
  const sortedRates = [...rates].sort((a, b) => {
    const orderA = SORT_ORDER[a.currency_code] || 999;
    const orderB = SORT_ORDER[b.currency_code] || 999;
    return orderA - orderB;
  });

  // Update last update time
  if (lastUpdate && sortedRates[0]) {
    lastUpdate.textContent = 'آخر تحديث: ' + formatDate(sortedRates[0].fetched_at);
  }

  // Render cards
  if (grid) {
    grid.innerHTML = sortedRates.map(rate => {
      const flag = CURRENCY_FLAGS[rate.currency_code] || '💱';
      const colors = CURRENCY_COLORS[rate.currency_code] || { bg: 'rgba(14, 165, 233, 0.08)', accent: '#0ea5e9' };

      // Calculate rate vs USD (for non-USD currencies)
      let usdEquivalent = '';
      if (rate.currency_code !== 'USD' && usdRate && rate.sell_rate > 0) {
        const vsUsd = rate.sell_rate/usdRate.sell_rate ;
        usdEquivalent = `
          <div class="rate-extra" style="background: ${colors.bg}; border-color: ${colors.accent}20;">
            <span class="rate-extra-label">سعر ${rate.currency_name_ar || rate.currency_code} بالدولار</span>
            <span class="rate-extra-value" style="color: ${colors.accent};">${formatNumber(vsUsd, 4)} USD</span>
          </div>
        `;
      }

      return `
        <div class="rate-card-large currency-card" style="--card-accent: ${colors.accent}; --card-bg: ${colors.bg};">
          <div class="rate-card-header">
            <div class="rate-card-icon" style="background: ${colors.bg};">${flag}</div>
            <div class="rate-card-title">
              <h3>${rate.currency_name_ar || rate.currency_code}</h3>
              <span class="rate-card-code">${rate.currency_code} / SYP</span>
            </div>
          </div>
          <div class="rate-card-body">
            <div class="rate-side">
              <span class="rate-side-label">سعر الشراء</span>
              <span class="rate-side-value">${formatCurrency(rate.buy_rate)}</span>
            </div>
            <div class="rate-divider"></div>
            <div class="rate-side">
              <span class="rate-side-label">سعر البيع</span>
              <span class="rate-side-value">${formatCurrency(rate.sell_rate)}</span>
            </div>
          </div>
          ${usdEquivalent}
          <div class="rate-card-footer">
            <span class="rate-change">${formatChange(rate.change_percent, rate.change_amount)}</span>
            <span class="rate-time">${formatDate(rate.fetched_at)}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}
