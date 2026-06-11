// ============================================
// Notifications Page UI
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('push-status-card')) return;

  initPushStatus();
  initGroupToggles();
  initNotificationSettings();
  initThresholdSettings();

  // حمل الإعدادات من السيرفر إذا مشترك
  if (typeof pushManager !== 'undefined' && pushManager) {
    try {
      await pushManager.loadSettingsFromServer();
    } catch (err) {
      console.error('Error loading settings from server:', err);
    }
  }
});

// ============================================
// PUSH STATUS UI
// ============================================
function initPushStatus() {
  const card = document.getElementById('push-status-card');
  const title = document.getElementById('push-status-title');
  const desc = document.getElementById('push-status-desc');
  const btn = document.getElementById('push-enable-btn');

  // إذا pushManager مش موجود، وضّح للمستخدم
  if (typeof pushManager === 'undefined' || !pushManager) {
    if (title) title.textContent = 'الإشعارات غير متاحة';
    if (desc) desc.textContent = 'المتصفح لا يدعم الإشعارات أو لم يتم تحميل المكتبة';
    if (btn) btn.style.display = 'none';
    return;
  }

  // فحص الحالة الأولية
  updateUIFromStatus();

  if (btn) {
    btn.addEventListener('click', async () => {
      const status = pushManager.getStatus();
      
      if (status.subscribed) {
        // إلغاء الاشتراك
        try {
          btn.disabled = true;
          btn.textContent = 'جاري الإيقاف...';
          await pushManager.unsubscribe();
          updateUIFromStatus();
        } catch (err) {
          console.error(err);
          alert('فشل إيقاف الإشعارات: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'إيقاف الإشعارات';
        }
      } else {
        // اشتراك جديد
        try {
          btn.disabled = true;
          btn.textContent = 'جاري التفعيل...';
          
          await pushManager.subscribe();
          updateUIFromStatus();
          
        } catch (err) {
          console.error(err);
          alert('فشل التفعيل: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'إعادة المحاولة';
        }
      }
    });
  }

  function updateUIFromStatus() {
    const status = pushManager.getStatus();
    
    if (status.subscribed) {
      card.classList.add('enabled');
      title.textContent = 'الإشعارات مفعلة ✅';
      desc.textContent = 'ستصلك التنبيهات الفورية حتى لو التطبيق مسكر';
      btn.textContent = 'إيقاف الإشعارات';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    } else if (status.permission === 'denied') {
      title.textContent = 'الإشعارات محظورة ❌';
      desc.textContent = 'افتح إعدادات المتصفح واسمح بالإشعارات';
      btn.textContent = 'كيفية التفعيل';
      btn.onclick = () => {
        alert('Chrome: Settings > Privacy > Notifications > Allow\nSafari: Preferences > Websites > Notifications');
      };
    } else {
      card.classList.remove('enabled');
      title.textContent = 'الإشعارات معطلة';
      desc.textContent = 'فعلها لتلقي تنبيهات فورية للأسعار';
      btn.textContent = 'تفعيل الإشعارات';
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-secondary');
    }
    
    btn.disabled = false;
  }
}

// ============================================
// GROUP TOGGLES - إصلاح الـ toggle switches
// ============================================
function initGroupToggles() {
  // 🔧 إصلاح: الـ toggle-switch div ما بيمرر الـ click للـ input المخفي
  // نضيف click handler على كل .toggle-switch لنستدعي input.click()
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      // لو الـ click كان على الـ input نفسه، سيبه يشتغل طبيعي
      if (e.target.tagName === 'INPUT') return;
      
      // منع الـ default behavior (text selection, etc.)
      e.preventDefault();
      
      const input = toggle.querySelector('input[type="checkbox"]');
      if (input) {
        input.click(); // this toggles checked AND triggers change event
      }
    });
  });

  // العملات - الكل
  const allCurrencies = document.getElementById('notif-all-currencies');
  const currencyChecks = document.querySelectorAll('.currency-check');
  
  if (allCurrencies) {
    allCurrencies.addEventListener('change', () => {
      currencyChecks.forEach(ch => ch.checked = allCurrencies.checked);
    });
  }

  currencyChecks.forEach(ch => {
    ch.addEventListener('change', () => {
      const allChecked = Array.from(currencyChecks).every(c => c.checked);
      if (allCurrencies) allCurrencies.checked = allChecked;
    });
  });

  // الكريبتو - الكل
  const allCrypto = document.getElementById('notif-all-crypto');
  const cryptoChecks = document.querySelectorAll('.crypto-check');
  
  if (allCrypto) {
    allCrypto.addEventListener('change', () => {
      cryptoChecks.forEach(ch => ch.checked = allCrypto.checked);
    });
  }

  cryptoChecks.forEach(ch => {
    ch.addEventListener('change', () => {
      const allChecked = Array.from(cryptoChecks).every(c => c.checked);
      if (allCrypto) allCrypto.checked = allChecked;
    });
  });
}

// ============================================
// SAVE SETTINGS
// ============================================
function initNotificationSettings() {
  const saveBtn = document.getElementById('save-notif-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري الحفظ...';

    try {
      // حدث بالسيرفر إذا مشترك
      if (typeof pushManager !== 'undefined' && pushManager) {
        await pushManager.updateSubscriptionOnServer();
      }
      
      // حفظ محلي
      const settings = getLocalSettings();
      localStorage.setItem('notification-settings', JSON.stringify(settings));

      saveBtn.textContent = '✅ تم الحفظ';
      setTimeout(() => {
        saveBtn.textContent = 'حفظ الإعدادات';
        saveBtn.disabled = false;
      }, 2000);

    } catch (err) {
      console.error('Save error:', err);
      saveBtn.textContent = '❌ فشل الحفظ';
      setTimeout(() => {
        saveBtn.textContent = 'حفظ الإعدادات';
        saveBtn.disabled = false;
      }, 2000);
    }
  });
}

function getLocalSettings() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  };

  return {
    notif_usd: getVal('notif-usd'),
    notif_eur: getVal('notif-eur'),
    notif_try: getVal('notif-try'),
    notif_sar: getVal('notif-sar'),
    notif_aed: getVal('notif-aed'),
    notif_qar: getVal('notif-qar'),
    notif_jod: getVal('notif-jod'),
    notif_iqd: getVal('notif-iqd'),
    notif_gbp: getVal('notif-gbp'),
    notif_chf: getVal('notif-chf'),
    notif_all_currencies: getVal('notif-all-currencies'),

    notif_gold: getVal('notif-gold'),

    notif_btc: getVal('notif-btc'),
    notif_eth: getVal('notif-eth'),
    notif_bnb: getVal('notif-bnb'),
    notif_sol: getVal('notif-sol'),
    notif_ada: getVal('notif-ada'),
    notif_trx: getVal('notif-trx'),
    notif_usdt: getVal('notif-usdt'),
    notif_paxg: getVal('notif-paxg'),
    notif_all_crypto: getVal('notif-all-crypto'),

    notif_fuel: getVal('notif-fuel'),
    notif_electricity: getVal('notif-electricity'),
    notif_news: getVal('notif-news'),
    notif_daily: getVal('notif-daily'),

    threshold_percent: parseFloat(
      document.querySelector('input[name="threshold"]:checked')?.value || 1
    )
  };
}

// ============================================
// THRESHOLD
// ============================================
function initThresholdSettings() {
  const saved = localStorage.getItem('notification-threshold') || '1';
  const radio = document.querySelector(`input[name="threshold"][value="${saved}"]`);
  if (radio) radio.checked = true;

  document.querySelectorAll('input[name="threshold"]').forEach(r => {
    r.addEventListener('change', () => {
      localStorage.setItem('notification-threshold', r.value);
    });
  });
}
