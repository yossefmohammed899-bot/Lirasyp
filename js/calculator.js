// ============================================
// Calculator Page - Comprehensive Calculator
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('panel-currency')) return;

  initCalcTabs();
  initCurrencyConverter();
  initGoldCalculator();
  initFuelCalculator();
  initElectricityCalculator();

  // Load latest prices from Supabase
  await loadLatestPrices();
});

// ============================================
// LOAD LATEST PRICES FROM SUPABASE
// ============================================
async function loadLatestPrices() {
  const rates = await fetchLatestRates();
  const gold = await fetchLatestGold();
  const fuel = await fetchLatestFuel();
  const tiers = await fetchElectricityTiers();
  const usdRate = rates.find(r => r.currency_code === 'USD');

  // === GOLD ===
  window._goldPrice21 = gold?.karat_21 || 0;
  window._usdRate = usdRate?.sell_rate || 14300;

  const goldPriceEl = document.getElementById('gold-calc-price');
  if (goldPriceEl && window._goldPrice21 > 0) {
    goldPriceEl.value = window._goldPrice21;
  }

  // === FUEL ===
  window._fuelPrices = {};
  fuel.forEach(f => {
    if ((f.fuel_type?.includes('95') || f.subtype?.includes('95')) && f.subtype?.includes('95')) {
      window._fuelPrices['95'] = f.price;
    }
    if ((f.fuel_type?.includes('90') || f.subtype?.includes('90')) && f.subtype?.includes('90')) {
      window._fuelPrices['90'] = f.price;
    }
    if (f.fuel_type?.includes('مازوت') || f.fuel_type?.includes('ديزل') || f.subtype?.includes('ديزل')) {
      window._fuelPrices['mazot'] = f.price;
    }
    if (f.fuel_type?.includes('غاز') && f.subtype?.includes('منزلي')) {
      window._fuelPrices['gas'] = f.price;
    }
  });

  // === ELECTRICITY ===
  window._electricityTiers = tiers
    .filter(t => t.is_active !== false)
    .sort((a, b) => (a.min_consumption || 0) - (b.min_consumption || 0));
}

// ============================================
// TABS
// ============================================
function initCalcTabs() {
  const tabs = document.querySelectorAll('.calc-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${target}`).classList.add('active');
    });
  });

  // Check URL params for tab
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam) {
    const tab = document.querySelector(`.calc-tab[data-tab="${tabParam}"]`);
    if (tab) tab.click();
  }
}

// ============================================
// CURRENCY CONVERTER
// ============================================
function initCurrencyConverter() {
  const amount = document.getElementById('cur-amount');
  const from = document.getElementById('cur-from');
  const to = document.getElementById('cur-to');
  const swap = document.getElementById('cur-swap');
  const result = document.getElementById('cur-result');
  const rateInfo = document.getElementById('cur-rate-info');
  const quickAmounts = document.querySelectorAll('.quick-amount');

  if (!amount || !from || !to || !result) return;

  async function convert() {
    const rates = await fetchLatestRates();
    const val = parseFloat(amount.value) || 0;
    const fromCode = from.value;
    const toCode = to.value;

    if (fromCode === toCode) {
      result.textContent = formatNumber(val);
      rateInfo.textContent = `1 ${fromCode} = 1 ${toCode}`;
      return;
    }

    const fromRate = rates.find(r => r.currency_code === fromCode);
    const toRate = rates.find(r => r.currency_code === toCode);

    let converted = 0;
    let rate = 0;

    if (fromCode === 'SYP') {
      if (toRate && toRate.sell_rate > 0) {
        converted = val / toRate.sell_rate;
        rate = 1 / toRate.sell_rate;
      }
    } else if (toCode === 'SYP') {
      if (fromRate && fromRate.sell_rate > 0) {
        converted = val * fromRate.sell_rate;
        rate = fromRate.sell_rate;
      }
    } else {
      if (fromRate && toRate && fromRate.sell_rate > 0 && toRate.sell_rate > 0) {
        const sypVal = val * fromRate.sell_rate;
        converted = sypVal / toRate.sell_rate;
        rate = fromRate.sell_rate / toRate.sell_rate;
      }
    }

    result.textContent = formatNumber(converted);
    rateInfo.textContent = `1 ${fromCode} ≈ ${formatNumber(rate, 4)} ${toCode}`;
  }

  amount.addEventListener('input', convert);
  from.addEventListener('change', convert);
  to.addEventListener('change', convert);

  if (swap) {
    swap.addEventListener('click', () => {
      const temp = from.value;
      from.value = to.value;
      to.value = temp;
      convert();
    });
  }

  quickAmounts.forEach(btn => {
    btn.addEventListener('click', () => {
      amount.value = btn.dataset.amount;
      convert();
    });
  });

  convert();
}

// ============================================
// GOLD CALCULATOR
// ============================================
function initGoldCalculator() {
  const weight = document.getElementById('gold-calc-weight');
  const karat = document.getElementById('gold-calc-karat');
  const price = document.getElementById('gold-calc-price');
  const btn = document.getElementById('calc-gold-btn');

  if (!btn) return;

  function calculate() {
    const w = parseFloat(weight.value) || 0;
    const k = parseInt(karat.value) || 21;
    const price21 = parseFloat(price.value) || window._goldPrice21 || 0;
    const usdRate = window._usdRate || 14300;

    if (price21 <= 0 || w <= 0) return;

    // حساب السعر لكل عيار
    // عيار 21 هو الأساس، عيار 24 = عيار 21 * (24/21)
    const pricePerGram = price21 * (k / 21);
    const totalSYP = pricePerGram * w;
    const totalUSD = totalSYP / usdRate;

    const totalEl = document.getElementById('gold-calc-total');
    const perGramEl = document.getElementById('gold-calc-per-gram');
    const usdEl = document.getElementById('gold-calc-usd');

    if (totalEl) totalEl.textContent = formatCurrency(totalSYP);
    if (perGramEl) perGramEl.textContent = formatCurrency(pricePerGram) + ' / غرام';
    if (usdEl) usdEl.textContent = '$' + formatNumber(totalUSD, 2);
  }

  btn.addEventListener('click', calculate);
  weight.addEventListener('input', calculate);
  karat.addEventListener('change', calculate);

  // Calculate when price loads
  setTimeout(() => {
    if (window._goldPrice21 > 0) calculate();
  }, 1500);
}

// ============================================
// FUEL CALCULATOR (بسيط - التكلفة الإجمالية فقط)
// ============================================
function initFuelCalculator() {
  const type = document.getElementById('fuel-calc-type');
  const quantity = document.getElementById('fuel-calc-quantity');
  const btn = document.getElementById('calc-fuel-full-btn');

  if (!btn) return;

  async function calculate() {
    // تأكد إن الأسعار محملة
    if (!window._fuelPrices || Object.keys(window._fuelPrices).length === 0) {
      await loadLatestPrices();
    }

    const t = type.value;
    const q = parseFloat(quantity.value) || 0;
    const priceUSD = window._fuelPrices?.[t] || 0;
    const usdRate = window._usdRate || 14300;

    if (priceUSD <= 0 || q <= 0) {
      const totalEl = document.getElementById('fuel-calc-total');
      if (totalEl) totalEl.textContent = '--';
      return;
    }

    // التكلفة الإجمالية بالليرة
    const totalSYP = priceUSD * usdRate * q;

    const totalEl = document.getElementById('fuel-calc-total');
    if (totalEl) totalEl.textContent = formatCurrency(totalSYP);
  }

  btn.addEventListener('click', calculate);
  type.addEventListener('change', calculate);
  quantity.addEventListener('input', calculate);

  setTimeout(() => {
    if (Object.keys(window._fuelPrices || {}).length > 0) calculate();
  }, 1500);
}

// ============================================
// ELECTRICITY CALCULATOR (مربوط بـ Supabase)
// ============================================
function initElectricityCalculator() {
  const consumption = document.getElementById('elec-calc-consumption');
  const btn = document.getElementById('calc-elec-full-btn');

  if (!btn) return;

  async function calculate() {
    // تأكد إن الشرائح محملة
    if (!window._electricityTiers || window._electricityTiers.length === 0) {
      await loadLatestPrices();
    }

    const tiers = window._electricityTiers || [];
    const cons = parseFloat(consumption?.value) || 0;

    if (tiers.length === 0 || cons <= 0) {
      const totalEl = document.getElementById('elec-calc-total');
      const avgEl = document.getElementById('elec-calc-avg');
      const tierEl = document.getElementById('elec-calc-tier');
      if (totalEl) totalEl.textContent = '--';
      if (avgEl) avgEl.textContent = '--';
      if (tierEl) tierEl.textContent = '--';
      return;
    }

    let totalCost = 0;
    let remaining = cons;
    let appliedTier = '';
    const breakdown = [];

    for (const tier of tiers) {
      const min = tier.min_consumption || 0;
      const max = tier.max_consumption === null ? Infinity : tier.max_consumption;
      const range = max === Infinity ? Infinity : max - min + 1;
      const tierPrice = parseFloat(tier.price_per_kwh) || 0;

      if (remaining <= 0) break;

      const used = Math.min(remaining, range === Infinity ? remaining : range);
      const cost = used * tierPrice;
      totalCost += cost;
      remaining -= used;

      if (used > 0) {
        appliedTier = tier.tier_name;
        breakdown.push({
          label: tier.tier_name,
          used: used,
          cost: cost,
          price: tierPrice
        });
      }
    }

    const avgPrice = cons > 0 ? totalCost / cons : 0;

    const totalEl = document.getElementById('elec-calc-total');
    const avgEl = document.getElementById('elec-calc-avg');
    const tierEl = document.getElementById('elec-calc-tier');

    if (totalEl) totalEl.textContent = formatCurrency(totalCost);
    if (avgEl) avgEl.textContent = formatCurrency(avgPrice) + ' / كيلو واط';
    if (tierEl) tierEl.textContent = appliedTier || '--';

    // Breakdown
    const breakdownEl = document.getElementById('elec-calc-breakdown');
    if (breakdownEl) {
      if (breakdown.length > 1) {
        breakdownEl.innerHTML = `
          <h3 style="font-size:1rem;font-weight:700;margin:1rem 0 0.5rem">📊 تفصيل الفاتورة</h3>
          ${breakdown.map(b => `
            <div class="tier-breakdown-item">
              <span class="tier-breakdown-label">${b.label}</span>
              <span class="tier-breakdown-value">${formatNumber(b.used)} كيلو واط × ${formatCurrency(b.price)} = ${formatCurrency(b.cost)}</span>
            </div>
          `).join('')}
          <div class="tier-breakdown-item" style="background:var(--primary);color:white;margin-top:0.5rem">
            <span class="tier-breakdown-label" style="color:white;font-weight:800">الإجمالي</span>
            <span class="tier-breakdown-value" style="color:white;font-weight:800">${formatCurrency(totalCost)}</span>
          </div>
        `;
      } else {
        breakdownEl.innerHTML = '';
      }
    }
  }

  btn.addEventListener('click', calculate);
  consumption.addEventListener('input', calculate);

  setTimeout(() => {
    if (window._electricityTiers?.length > 0) calculate();
  }, 1500);
}
