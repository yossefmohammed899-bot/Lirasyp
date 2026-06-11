// ============================================
// Wallet Page
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('assets-list')) return;
  await loadLatestPrices();
  loadWallet();
  initAssetForm();
});

async function loadLatestPrices() {
  const rates = await fetchLatestRates();
  const gold = await fetchLatestGold();
  const crypto = await fetchLatestCrypto();

  window._latestRates = {};
  rates.forEach(r => {
    window._latestRates[r.currency_code] = r.sell_rate || r.price_syp || 0;
  });

  window._goldPrice = gold?.karat_21 || 0;
  window._goldOuncePrice = gold?.ounce_syp || 0; // إضافة سعر الأونصة

  window._cryptoPrices = {};
  crypto.forEach(c => {
    window._cryptoPrices[c.currency_code] = c.price_syp || 0;
  });
}

function loadWallet() {
  const wallet = JSON.parse(localStorage.getItem('wallet') || '[]');
  const list = document.getElementById('assets-list');
  const totalSypEl = document.getElementById('wallet-total-syp');
  const totalUsdEl = document.getElementById('wallet-total-usd');

  if (!list) return;

  if (wallet.length === 0) {
    list.innerHTML = `
      <div class="empty-wallet">
        <div class="empty-icon">👛</div>
        <p>المحفظة فارغة</p>
        <p>أضف أصولك لتتبع قيمتها</p>
      </div>`;
    if (totalSypEl) totalSypEl.textContent = '--';
    if (totalUsdEl) totalUsdEl.textContent = '--';
    return;
  }

  let totalSYP = 0;  const usdRate = window._latestRates?.['USD'] || 1;

  list.innerHTML = wallet.map((asset, index) => {
    let valueSYP = 0;
    let icon = '💵';
    let name = '';
    let meta = '';

    if (asset.type === 'currency') {
      // SYP is the base currency, rate = 1
      const rate = asset.currency === 'SYP' ? 1 : (window._latestRates?.[asset.currency] || 0);
      valueSYP = (asset.amount || 0) * rate;
      icon = getFlag(asset.currency);
      name = asset.currency;
      meta = `${formatNumber(asset.amount)} ${asset.currency}`;

    } else if (asset.type === 'gold') {
      let karatPrice = 0;
      // التحقق مما إذا كان العيار هو "أونصة"
      if (String(asset.karat).toLowerCase() === 'ounce') {
        karatPrice = window._goldOuncePrice || 0;
        name = 'أونصة ذهب';
        meta = `${formatNumber(asset.amount)} أونصة`;
      } else {
        karatPrice = window._goldPrice * (Number(asset.karat) / 21);
        name = `ذهب عيار ${asset.karat}`;
        meta = `${formatNumber(asset.amount)} غرام`;
      }
      valueSYP = (asset.amount || 0) * karatPrice;
      icon = '🥇';

    } else if (asset.type === 'crypto') {
      const price = window._cryptoPrices?.[asset.crypto] || 0;
      valueSYP = (asset.amount || 0) * price;
      icon = getFlag(asset.crypto);
      name = asset.crypto;
      meta = `${formatNumber(asset.amount)} ${asset.crypto}`;
    }

    totalSYP += valueSYP;

    return `
      <div class="asset-item">
        <div class="asset-icon">${icon}</div>
        <div class="asset-details">
          <span class="asset-name">${name}</span>
          <span class="asset-meta">${meta}</span>
        </div>
        <div class="asset-value">
          <span class="asset-value-main">${formatCurrency(valueSYP)}</span>
          <span class="asset-value-sub">≈ $${formatNumber(valueSYP / usdRate, 2)}</span>        </div>
        <button class="asset-delete" onclick="removeAsset(${index})" aria-label="حذف">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  // تحديث عرض الرصيد في المربعات الجديدة الكبيرة
  if (totalSypEl) totalSypEl.textContent = formatCurrency(totalSYP, 'SYP');
  if (totalUsdEl) totalUsdEl.textContent = '$' + formatNumber(totalSYP / usdRate, 2);

  updateWalletChart(wallet, totalSYP);
}
function updateWalletChart(wallet, total) {
  const container = document.getElementById('wallet-chart');
  if (!container || total === 0) return;

  const distribution = {};
  wallet.forEach(asset => {
    let value = 0;
    if (asset.type === 'currency') {
      const rate = asset.currency === 'SYP' ? 1 : (window._latestRates?.[asset.currency] || 0);
      value = (asset.amount || 0) * rate;
    } else if (asset.type === 'gold') {
      let karatPrice = 0;
      if (String(asset.karat).toLowerCase() === 'ounce') {
        karatPrice = window._goldOuncePrice || 0;
      } else {
        karatPrice = window._goldPrice * (Number(asset.karat) / 21);
      }
      value = (asset.amount || 0) * karatPrice;
    } else if (asset.type === 'crypto') {
      const price = window._cryptoPrices?.[asset.crypto] || 0;
      value = (asset.amount || 0) * price;
    }

    const key = asset.type === 'currency' ? asset.currency 
               : asset.type === 'gold' ? (String(asset.karat).toLowerCase() === 'ounce' ? 'أونصة ذهب' : `ذهب عيار ${asset.karat}`) 
               : asset.crypto;

    distribution[key] = (distribution[key] || 0) + value;
  });

  const colors = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  
  // إنشاء SVG للرسم البياني الدائري (Donut Chart)
  let currentAngle = -90; // البدء من الأعلى
  const svgParts = Object.entries(distribution).map(([key, value], i) => {
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const color = colors[i % colors.length];
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // تحويل الزوايا إلى إحداثيات
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const x3 = 50 + 25 * Math.cos(endRad);
    const y3 = 50 + 25 * Math.sin(endRad);
    const x4 = 50 + 25 * Math.cos(startRad);
    const y4 = 50 + 25 * Math.sin(startRad);
    
    const largeArc = angle > 180 ? 1 : 0;

    return `
      <path d="M ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A 25 25 0 ${largeArc} 0 ${x4} ${y4} Z" 
            fill="${color}" 
            stroke="var(--bg-card)" 
            stroke-width="1">
        <title>${key}: ${percentage.toFixed(1)}% (${formatCurrency(value)})</title>
      </path>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:1rem">
      <svg viewBox="0 0 100 100" width="220" height="220" style="max-width:100%">
        ${svgParts}
      </svg>
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;max-width:100%">
        ${Object.entries(distribution).map(([key, value], i) => `
          <span style="display:flex;align-items:center;gap:0.35rem;font-size:0.85rem;background:var(--bg-body);padding:0.35rem 0.625rem;border-radius:var(--border-radius-sm)">
            <span style="width:14px;height:14px;border-radius:3px;background:${colors[i % colors.length]};flex-shrink:0"></span>
            <span style="white-space:nowrap">${key} (${((value/total)*100).toFixed(1)}%)</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}
function initAssetForm() {
  const typeSelect = document.getElementById('asset-type');
  const currencyGroup = document.getElementById('asset-currency-group');
  const goldGroup = document.getElementById('asset-gold-group');
  const cryptoGroup = document.getElementById('asset-crypto-group');
  const btn = document.getElementById('add-asset-btn');

  if (!typeSelect) return;

  typeSelect.addEventListener('change', () => {
    const type = typeSelect.value;    currencyGroup.classList.toggle('hidden', type !== 'currency');
    goldGroup.classList.toggle('hidden', type !== 'gold');
    cryptoGroup.classList.toggle('hidden', type !== 'crypto');
  });

  if (btn) {
    btn.addEventListener('click', () => {
      const type = typeSelect.value;
      const amount = parseFloat(document.getElementById('asset-amount').value) || 0;

      if (amount <= 0) {
        alert('الرجاء إدخال كمية صحيحة أكبر من صفر');
        return;
      }

      let asset = { type, amount };

      if (type === 'currency') {
        asset.currency = document.getElementById('asset-currency').value;
      } else if (type === 'gold') {
        // حفظ القيمة كما هي (رقم أو النص 'ounce')
        asset.karat = document.getElementById('asset-gold-karat').value;
      } else if (type === 'crypto') {
        asset.crypto = document.getElementById('asset-crypto').value;
      }

      const wallet = JSON.parse(localStorage.getItem('wallet') || '[]');
      wallet.push(asset);
      localStorage.setItem('wallet', JSON.stringify(wallet));

      loadWallet();
      document.getElementById('asset-amount').value = '';
    });
  }
}

function removeAsset(index) {
  if (!confirm('هل أنت متأكد من حذف هذا الأصل من المحفظة؟')) return;
  const wallet = JSON.parse(localStorage.getItem('wallet') || '[]');
  wallet.splice(index, 1);
  localStorage.setItem('wallet', JSON.stringify(wallet));
  loadWallet();
}

window.removeAsset = removeAsset;