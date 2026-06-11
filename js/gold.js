// ============================================
// Gold Page - Large Rate Cards
// ============================================

const GOLD_KARATS = [
  { karat: 24, name: 'عيار 24', purity: '999', sort: 1 },
  { karat: 22, name: 'عيار 22', purity: '916', sort: 2 },
  { karat: 21, name: 'عيار 21', purity: '875', sort: 3 },
  { karat: 18, name: 'عيار 18', purity: '750', sort: 4 },
  { karat: 14, name: 'عيار 14', purity: '585', sort: 5 }
];

const GOLD_COLORS = {
  24: { bg: 'rgba(245, 158, 11, 0.12)', accent: '#f59e0b' },
  22: { bg: 'rgba(251, 191, 36, 0.12)', accent: '#fbbf24' },
  21: { bg: 'rgba(217, 119, 6, 0.12)', accent: '#d97706' },
  18: { bg: 'rgba(180, 83, 9, 0.12)', accent: '#b45309' },
  14: { bg: 'rgba(146, 64, 14, 0.12)', accent: '#92400e' }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('gold-cards-grid')) return;

  await loadGoldCards();
});

async function loadGoldCards() {
  const gold = await fetchLatestGold();
  const grid = document.getElementById('gold-cards-grid');
  const lastUpdate = document.getElementById('last-update');

  if (!gold) {
    if (grid) grid.innerHTML = '<div class="loading-cell" style="grid-column:1/-1;text-align:center;padding:3rem">لا توجد بيانات متاحة</div>';
    return;
  }

  // Karat prices from database (with fallback calculation from ounce_syp)
  const karatPrices = {
    24: gold.karat_24 || (gold.ounce_syp ? gold.ounce_syp / 31.1035 : 0),
    22: gold.karat_22 || (gold.ounce_syp ? (gold.ounce_syp / 31.1035) * 22 / 24 : 0),
    21: gold.karat_21 || (gold.ounce_syp ? (gold.ounce_syp / 31.1035) * 21 / 24 : 0),
    18: gold.karat_18 || (gold.ounce_syp ? (gold.ounce_syp / 31.1035) * 18 / 24 : 0),
    14: gold.karat_14 || (gold.ounce_syp ? (gold.ounce_syp / 31.1035) * 14 / 24 : 0)
  };

  // Debug: log what we got
  console.log('Gold data:', {
    karat_24: gold.karat_24,
    karat_22: gold.karat_22,
    karat_21: gold.karat_21,
    karat_18: gold.karat_18,
    karat_14: gold.karat_14,
    ounce_usd: gold.ounce_usd,
    ounce_syp: gold.ounce_syp
  });

  // Update last update time
  if (lastUpdate) {
    lastUpdate.textContent = 'آخر تحديث: ' + formatDate(gold.fetched_at);
  }

  // Render cards - Ounce first, then karats
  if (grid) {
    let cardsHTML = '';

    // Ounce Card (Featured) - Prices stacked vertically
    cardsHTML += `
      <div class="rate-card-large gold-card ounce-card" style="--card-accent: #f59e0b; --card-bg: rgba(245, 158, 11, 0.15);">
        <div class="rate-card-header">
          <div class="rate-card-icon" style="background: rgba(245, 158, 11, 0.15); font-size: 1.5rem;">🥇</div>
          <div class="rate-card-title">
            <h3>الأونصة العالمية</h3>
            <span class="rate-card-code">Gold Ounce (XAU)</span>
          </div>
        </div>
        <div class="ounce-prices">
          <div class="ounce-price-row">
            <span class="ounce-price-label">السعر بالليرة السورية</span>
            <span class="ounce-price-value">${formatCurrency(gold.ounce_syp)}</span>
          </div>
          <div class="ounce-price-row">
            <span class="ounce-price-label">السعر بالدولار الأمريكي</span>
            <span class="ounce-price-value-usd">$${formatNumber(gold.ounce_usd, 2)}</span>
          </div>
        </div>
        <div class="rate-card-footer">
          <span class="rate-change">${formatChange(gold.change_24h_percent, gold.change_24h_amount)}</span>
          <span class="rate-time">${formatDate(gold.fetched_at)}</span>
        </div>
      </div>
    `;

    // Karat Cards - Prices from database directly
    cardsHTML += GOLD_KARATS.map(k => {
      const priceSYP = karatPrices[k.karat];
      const hasPrice = priceSYP > 0;
      const priceUSD = gold.ounce_usd ? (gold.ounce_usd *( k.karat / 24) /31.1035): 0;
      const colors = GOLD_COLORS[k.karat] || { bg: 'rgba(245, 158, 11, 0.12)', accent: '#f59e0b' };

      return `
        <div class="rate-card-large gold-card" style="--card-accent: ${colors.accent}; --card-bg: ${colors.bg};">
          <div class="rate-card-header">
            <div class="rate-card-icon" style="background: ${colors.bg}; font-size: 1.5rem;">🥇</div>
            <div class="rate-card-title">
              <h3>ذهب ${k.name}</h3>
              <span class="rate-card-code">نقاء ${k.purity}‰</span>
            </div>
          </div>
          <div class="rate-card-body">
            <div class="rate-side">
              <span class="rate-side-label">السعر بالليرة</span>
              <span class="rate-side-value">${hasPrice ? formatCurrency(priceSYP) : "--"}</span>
            </div>
            <div class="rate-divider"></div>
            <div class="rate-side">
              <span class="rate-side-label">السعر بالدولار</span>
              <span class="rate-side-value" style="font-size: 1.25rem;">$${formatNumber(priceUSD, 2)}</span>
            </div>
          </div>
          <div class="rate-card-footer">
            <span class="rate-change">${formatChange(gold.change_24h_percent, gold.change_24h_amount)}</span>
            <span class="rate-time">${formatDate(gold.fetched_at)}</span>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = cardsHTML;
  }
}
