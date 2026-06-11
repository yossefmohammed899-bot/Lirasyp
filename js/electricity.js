// ============================================
// الليرة - عملتنا | Electricity Page JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('tiers-grid')) return;
  await loadElectricity();
});

function getTierRangeText(tier) {
  if (tier.max_consumption === null) {
    if (tier.min_consumption === 0) return 'غير محدود';
    return `${tier.min_consumption}+ كيلو واط`;
  }
  return `${tier.min_consumption || 0} - ${tier.max_consumption} كيلو واط`;
}

async function loadElectricity() {
  const tiers = await fetchElectricityTiers();
  const grid = document.getElementById('tiers-grid');
  const lastUpdate = document.getElementById('last-update');

  if (tiers.length === 0) {
    if (grid) grid.innerHTML = '<div class="tier-card" style="grid-column:1/-1; text-align:center; padding:2rem;">لا توجد بيانات متاحة</div>';
    return;
  }

  // Update tier cards only
  if (grid) {
    grid.innerHTML = tiers.map((tier, i) => {
      const width = `${Math.round(((i + 1) / tiers.length) * 100)}%`;
      const rangeText = getTierRangeText(tier);
      return `
        <div class="tier-card">
          <div class="tier-name" style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.25rem;">${tier.tier_name}</div>
          <div class="tier-range">${rangeText}</div>
          <div class="tier-price">${formatCurrency(tier.price_per_kwh)} / كيلو واط</div>
          <div class="tier-bar" style="--width:${width}"></div>
        </div>
      `;
    }).join('');
  }

  if (lastUpdate) {
    lastUpdate.textContent = 'آخر تحديث: ' + new Date().toLocaleDateString('ar-SY');
  }
}
