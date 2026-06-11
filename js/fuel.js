// ============================================
// الليرة - عملتنا | Fuel Page JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('fuel-cards')) return;
  await loadFuel();
});

const FUEL_ICONS = {
  'بنزين': '⛽',
  'مازوت': '🛢️',
  'ديزل': '🛢️',
  'غاز': '🔥',
  'default': '⛽'
};

function getFuelIcon(fuelType, subtype) {
  const type = (fuelType || '').toLowerCase();
  if (type.includes('بنزين')) return '⛽';
  if (type.includes('مازوت') || type.includes('ديزل')) return '🛢️';
  if (type.includes('غاز')) return '🔥';
  return FUEL_ICONS.default;
}

function getFuelLabel(fuelType, subtype) {
  let label = fuelType || '';
  if (subtype && subtype.trim() !== '') {
    label += ' - ' + subtype;
  }
  return label;
}

async function loadFuel() {
  const fuel = await fetchLatestFuel();
  const rates = await fetchLatestRates();
  const container = document.getElementById('fuel-cards');
  const lastUpdate = document.getElementById('last-update');

  if (!container) return;

  const usdRate = rates.find(r => r.currency_code === 'USD');
  const usdSellRate = usdRate?.sell_rate || 14300;

  if (fuel.length === 0) {
    container.innerHTML = `
      <div class="fuel-card" style="grid-column:1/-1; justify-content:center; flex-direction:column; gap:0.5rem; padding:2rem;">
        <div style="font-size:2.5rem;">⚠️</div>
        <div class="fuel-info" style="text-align:center;">
          <span class="fuel-name" style="font-size:1rem;">لا توجد بيانات متاحة</span>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = fuel.map(f => {
    const priceSYP = f.price * usdSellRate;
    return `
    <div class="fuel-card">
      <div class="fuel-icon">${getFuelIcon(f.fuel_type, f.subtype)}</div>
      <div class="fuel-info">
        <span class="fuel-name">${getFuelLabel(f.fuel_type, f.subtype)}</span>
        <div class="fuel-prices">
          <span class="fuel-price-syp">${formatCurrency(priceSYP)}</span>
          <span class="fuel-price-usd">${f.price} $</span>
        </div>
        <span class="fuel-unit">${f.unit || 'لتر'}</span>
      </div>
    </div>
  `}).join('');

  if (lastUpdate && fuel[0]) {
    let updateText = 'آخر تحديث: ' + formatDate(fuel[0].fetched_at);
    if (usdRate) {
      updateText += ` <span style="margin:0 0.5rem;">|</span> الدولار: ${formatCurrency(usdRate.sell_rate)}`;
    }
    lastUpdate.innerHTML = updateText;
  }
}
