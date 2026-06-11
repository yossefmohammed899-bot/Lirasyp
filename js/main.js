// ============================================
// الليرة - عملتنا | Main JavaScript
// ============================================
const SUPABASE_URL = 'https://tsjaamvnykinbafujiny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamFhbXZueWtpbmJhZnVqaW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzIwODQsImV4cCI6MjA5NjMwODA4NH0.lcn_lWSYDD4ToutH8gPketvg4fT-_sxan4-nwD84XOw';

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  from(table) {
    const self = this;
    const state = {
      table: table,
      columns: '*',
      filters: [],
      order: null,
      limit: null,
      single: false,
      method: 'GET',
      body: null
    };

    const chain = {
      select(columns = '*') {
        state.columns = columns;
        return chain;
      },
      eq(column, value) {
        state.filters.push({ column, op: 'eq', value });
        return chain;
      },
      in(column, values) {
        state.filters.push({ column, op: 'in', values });
        return chain;
      },
      order(column, opts = {}) {
        state.order = { column, ascending: opts.ascending !== false };
        return chain;
      },
      limit(n) {
        state.limit = n;        return chain;
      },
      single() {
        state.single = true;
        return chain;
      },
      insert(data) {
        state.method = 'POST';
        state.body = data;
        return chain;
      },
      update(data) {
        state.method = 'PATCH';
        state.body = data;
        return chain;
      },
      delete() {
        state.method = 'DELETE';
        return chain;
      },
      async execute() {
        let url = `${self.url}/rest/v1/${state.table}`;

        if (state.method === 'GET') {
          url += `?select=${state.columns || '*'}`;
          for (const f of state.filters) {
            if (f.op === 'eq') {
              url += `&${f.column}=eq.${encodeURIComponent(f.value)}`;
            } else if (f.op === 'in') {
              url += `&${f.column}=in.(${f.values.map(v => encodeURIComponent(v)).join(',')})`;
            }
          }
          if (state.order) {
            url += `&order=${state.order.column}.${state.order.ascending ? 'asc' : 'desc'}`;
          }
          if (state.limit) {
            url += `&limit=${state.limit}`;
          }
          if (state.single) {
            url += '&limit=1';
          }
        } else {
          for (const f of state.filters) {
            if (f.op === 'eq') {
              url += (url.includes('?') ? '&' : '?') + `${f.column}=eq.${encodeURIComponent(f.value)}`;
            }
          }
        }

        const options = {           method: state.method,
          headers: self.headers 
        };

        if (state.body) {
          options.body = JSON.stringify(state.body);
        }

        const res = await fetch(url, options);

        if (state.method === 'DELETE') {
          return { data: null, error: res.ok ? null : { message: 'Delete failed' } };
        }

        const data = await res.json();

        if (!res.ok) {
          return { data: null, error: data };
        }

        return { data: state.single ? (Array.isArray(data) ? data[0] : data) : data, error: null };
      },
      then(resolve, reject) {
        return chain.execute().then(resolve, reject);
      }
    };

    return chain;
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);





// ============================================
// THEME MANAGEMENT
// ============================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcons(next);
}
function updateThemeIcons(theme) {
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
  document.querySelectorAll('.theme-text').forEach(el => {
    el.textContent = theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي';
  });
}

// ============================================
// SIDEBAR
// ============================================
function initSidebar() {
  const openBtn = document.getElementById('open-sidebar');
  const closeBtn = document.getElementById('close-sidebar');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
}



// ============================================
// PUSH NOTIFICATION POPUP
// ============================================
function initPushPopup() {
  const popup = document.getElementById('push-popup');
  if (!popup) return;
  const pushDismissed = localStorage.getItem('push-dismissed');
  const pushSubscribed = localStorage.getItem('push-subscribed');

  if (pushSubscribed === 'true' || pushDismissed === 'true') {
    popup.classList.add('hidden');
    return;
  }

  setTimeout(() => {
    popup.classList.remove('hidden');
  }, 3000);

  const enableBtn = document.getElementById('enable-push');
  const dismissBtn = document.getElementById('dismiss-push');

  if (enableBtn) {
    enableBtn.addEventListener('click', async () => {
      popup.classList.add('hidden');
      localStorage.setItem('push-subscribed', 'true');
      window.location.href = 'notifications.html';
    });
  }
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      popup.classList.add('hidden');
      localStorage.setItem('push-dismissed', 'true');
    });
  }
}
// ============================================
// FORMATTERS - أرقام إنجليزية فقط
// ============================================

/**
 * تنسيق الأرقام بالإنجليزية
 */
function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '--';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * تنسيق العملات بالإنجليزية
 */
function formatCurrency(num, currency = 'ل.س') {
  if (num === null || num === undefined || isNaN(num)) return '--';
  return `${formatNumber(num)} ${currency}`; // ← احذف , 0
}

/**
 * تنسيق التاريخ بالإنجليزية مع الحفاظ على أسماء الأشهر بالعربية
 */
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * تنسيق نسبة التغيير بالإنجليزية
 */
function formatChange(change, amount = null) {
  if (change === null || change === undefined || isNaN(change)) return '<span class="change-neutral">--</span>';
  const isUp = change >= 0;
  const arrow = isUp ? '▲' : '▼';
  const className = isUp ? 'change-up' : 'change-down';
  const sign = isUp ? '+' : '';

  let html = `<span class="${className}">${arrow} ${sign}${formatNumber(change)}%</span>`;
  if (amount !== null && amount !== undefined) {
    html += ` <span class="${className}" style="font-size:0.75rem">(${sign}${formatNumber(amount)})</span>`;
  }
  return html;
}

/**
 * دالة مساعدة: تحويل أي نص يحتوي أرقاماً عربية إلى إنجليزية (احتياط)
 */
function toEnglishNumbers(str) {
  if (!str) return str;
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = String(str);
  arabicNums.forEach((ar, i) => {
    result = result.replace(new RegExp(ar, 'g'), i);
  });
  return result;
}



// ============================================
// CURRENCY FLAGS
// ============================================
const CURRENCY_FLAGS = {
  'USD': '🇺🇸', 'SYP': '🇸🇾', 'EUR': '🇪🇺', 'TRY': '🇹🇷',
  'SAR': '🇸🇦', 'AED': '🇦🇪', 'QAR': '🇶🇦', 'JOD': '🇯🇴',
  'IQD': '🇮🇶', 'GBP': '🇬🇧', 'CHF': '🇨🇭',
  'BTC': '₿', 'ETH': 'Ξ', 'BNB': 'BNB', 'SOL': 'SOL',
  'ADA': 'ADA', 'TRX': 'TRX', 'USDT': '₮', 'PAXG': 'PAXG',
  'XAU': '🥇'
};

function getFlag(code) {
  return CURRENCY_FLAGS[code] || '💱';
}

// ============================================
// FETCH DATA FROM SUPABASE
// ============================================
async function fetchLatestRates() {
  try {
    const { data, error } = await supabase.from('v_latest_exchange_rates').select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching rates:', e);
    return [];
  }}

async function fetchLatestGold() {
  try {
    const { data, error } = await supabase.from('v_latest_gold').select('*');
    if (error) throw error;
    return data?.[0] || null;
  } catch (e) {
    console.error('Error fetching gold:', e);
    return null;
  }
}

async function fetchLatestCrypto() {
  try {
    const { data, error } = await supabase.from('v_latest_crypto').select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching crypto:', e);
    return [];
  }
}

async function fetchLatestNews(limit = 6) {
  try {
    const { data, error } = await supabase.from('news_articles').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching news:', e);
    return [];
  }
}

async function fetchLatestFuel() {
  try {
    const { data, error } = await supabase.from('fuel_prices').select('*').eq('is_latest', true).order('fetched_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching fuel:', e);
    return [];
  }
}







async function fetchElectricityTiers() {
  try {
    const { data, error } = await supabase.from('electricity_tariffs').select('*').eq('is_active', true).order('min_consumption', { ascending: true });
    if (error) throw error;    return data || [];
  } catch (e) {
    console.error('Error fetching electricity:', e);
    return [];
  }
}









// ============================================
// UPDATE HOMEPAGE HERO
// ============================================
async function updateHero() {
  const rates = await fetchLatestRates();
  const gold = await fetchLatestGold();
  const crypto = await fetchLatestCrypto();

  const usdRate = rates.find(r => r.currency_code === 'USD');
  if (usdRate) {
    const el = document.getElementById('hero-usd');
    if (el) el.textContent = formatCurrency(usdRate.sell_rate);
  }

  if (gold) {
    const el = document.getElementById('hero-gold');
    if (el) el.textContent = formatCurrency(gold.karat_21);
  }

  const btcRate = crypto.find(c => c.currency_code === 'BTC');
  if (btcRate) {
    const el = document.getElementById('hero-btc');
    if (el) el.textContent = formatCurrency(btcRate.price_syp);
  }
}

// ============================================
// UPDATE MAIN RATE CARDS (USD & TRY)
// ============================================
async function updateMainRates() {
  const rates = await fetchLatestRates();

  const usd = rates.find(r => r.currency_code === 'USD');
  if (usd) {
    const buyEl = document.getElementById('usd-buy');
    const sellEl = document.getElementById('usd-sell');
    const changeEl = document.getElementById('usd-change');
    const timeEl = document.getElementById('usd-time');
    if (buyEl) buyEl.textContent = formatCurrency(usd.buy_rate);
    if (sellEl) sellEl.textContent = formatCurrency(usd.sell_rate);
    if (changeEl) changeEl.innerHTML = formatChange(usd.change_percent, usd.change_amount);
    if (timeEl) timeEl.textContent = 'آخر تحديث: ' + formatDate(usd.fetched_at);
  }
  const tryRate = rates.find(r => r.currency_code === 'TRY');
  const usdRate = rates.find(r => r.currency_code === 'USD');
  if (tryRate) {
    const buyEl = document.getElementById('try-buy');
    const sellEl = document.getElementById('try-sell');
    const changeEl = document.getElementById('try-change');
    const timeEl = document.getElementById('try-time');
    const tryUsdEl = document.getElementById('try-usd');
    
    if (buyEl) buyEl.textContent = formatCurrency(tryRate.buy_rate);
    if (sellEl) sellEl.textContent = formatCurrency(tryRate.sell_rate);
    if (changeEl) changeEl.innerHTML = formatChange(tryRate.change_percent, tryRate.change_amount);
    if (timeEl) timeEl.textContent = 'آخر تحديث: ' + formatDate(tryRate.fetched_at);

    if (tryUsdEl && usdRate && tryRate.sell_rate > 0) {
      const tryUsd = tryRate.sell_rate / usdRate.sell_rate;
      tryUsdEl.textContent = formatNumber(tryUsd, 4) + ' USD';
    }
  }
}

// ============================================
// UPDATE NEWS ON HOMEPAGE
// ============================================
async function updateHomeNews() {
  const news = await fetchLatestNews(3);
  const grid = document.getElementById('news-grid');
  if (!grid || news.length === 0) return;

  grid.innerHTML = news.map(article => `
    <article class="news-card">
      <img src="${article.image_url || 'images/news-placeholder.jpg'}" alt="${article.title}" loading="lazy">
      <div class="news-card-content">
        <span class="news-card-category ${article.category}">${article.category}</span>
        <h3>${article.title}</h3>
        <p>${article.summary || ''}</p>
        <div class="news-card-meta">
          <span>${article.author || 'مصدر'}</span>
          <span>${formatDate(article.published_at)}</span>
        </div>
      </div>
    </article>
  `).join('');
}




// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {  initTheme();
  initSidebar();
  initPushPopup();

  document.querySelectorAll('#theme-toggle, #theme-toggle-sidebar').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  if (document.getElementById('usd-buy')) {
    updateHero();
    updateMainRates();
    updateHomeNews();
  }
});

// Export for other modules
window.SupabaseClient = SupabaseClient;
window.supabase = supabase;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatChange = formatChange;
window.getFlag = getFlag;
window.fetchLatestRates = fetchLatestRates;
window.fetchLatestGold = fetchLatestGold;
window.fetchLatestCrypto = fetchLatestCrypto;
window.fetchLatestNews = fetchLatestNews;
window.fetchLatestFuel = fetchLatestFuel;
window.fetchElectricityTiers = fetchElectricityTiers;