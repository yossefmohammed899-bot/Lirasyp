// ============================================
//  Push Notification Manager - Vercel Ready (ESM)
// ============================================

class PushNotificationManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.subscription = null;
    this.apiBase = ''; // Same domain
  }

  // ============================================
  // INIT
  // ============================================
  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Register the same SW that index.html uses (sw.js)
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration.scope);

      await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('Already subscribed');
        await this.updateSubscriptionOnServer();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Push init error:', err);
      return false;
    }
  }

  // ============================================
  // REQUEST PERMISSION
  // ============================================
  async requestPermission() {
    if (!this.isSupported) return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // ============================================
  // SUBSCRIBE
  // ============================================
  async subscribe() {
    if (!this.isSupported) return null;

    const permission = await this.requestPermission();
    if (!permission) return null;

    try {
      const { publicKey } = await this.getVapidKey();

      if (!publicKey) {
        throw new Error('VAPID public key not available. Check server configuration.');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      this.subscription = subscription;
      await this.saveSubscription(subscription);

      this.showLocalNotification(
        '✅ تم التفعيل!',
        'ستصلك الإشعارات الفورية للأسعار'
      );

      return subscription;
    } catch (err) {
      console.error('Subscribe error:', err);
      throw err;
    }
  }

  // ============================================
  // UNSUBSCRIBE
  // ============================================
  async unsubscribe() {
    if (!this.subscription) return;

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;

      await this.removeSubscription();

      localStorage.removeItem('push-subscription-id');
      localStorage.removeItem('push-subscribed');

      return true;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      throw err;
    }
  }

  // ============================================
  // GET VAPID KEY FROM SERVER
  // ============================================
  async getVapidKey() {
    try {
      const response = await fetch('/api/vapid-public-key');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get VAPID key');
      }
      return await response.json();
    } catch (err) {
      console.error('Failed to get VAPID key:', err);
      throw new Error('Server not ready. Check Vercel Environment Variables.');
    }
  }

  // ============================================
  // SAVE TO SUPABASE
  // ============================================
  async saveSubscription(subscription) {
    const settings = this.getDetailedSettings();

    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: this.arrayBufferToBase64(subscription.getKey('auth')),
      user_agent: navigator.userAgent,
      platform: this.detectPlatform(),
      notif_usd: settings.notif_usd,
      notif_eur: settings.notif_eur,
      notif_try: settings.notif_try,
      notif_sar: settings.notif_sar,
      notif_aed: settings.notif_aed,
      notif_qar: settings.notif_qar,
      notif_jod: settings.notif_jod,
      notif_iqd: settings.notif_iqd,
      notif_gbp: settings.notif_gbp,
      notif_chf: settings.notif_chf,
      notif_all_currencies: settings.notif_all_currencies,
      notif_gold: settings.notif_gold,
      notif_btc: settings.notif_btc,
      notif_eth: settings.notif_eth,
      notif_bnb: settings.notif_bnb,
      notif_sol: settings.notif_sol,
      notif_ada: settings.notif_ada,
      notif_trx: settings.notif_trx,
      notif_usdt: settings.notif_usdt,
      notif_paxg: settings.notif_paxg,
      notif_all_crypto: settings.notif_all_crypto,
      notif_fuel: settings.notif_fuel,
      notif_electricity: settings.notif_electricity,
      notif_news: settings.notif_news,
      notif_daily: settings.notif_daily,
      threshold_percent: settings.threshold_percent,
      is_active: true,
      last_used_at: new Date().toISOString()
    };

    try {
      const url = window.supabase.url + '/rest/v1/push_subscriptions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': window.supabase.key,
          'Authorization': 'Bearer ' + window.supabase.key,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(subscriptionData)
      });

      const data = await response.json();

      if (!response.ok) throw data;

      if (data && data[0] && data[0].id) {
        localStorage.setItem('push-subscription-id', data[0].id);
      }
      localStorage.setItem('push-subscribed', 'true');

      console.log('Subscription saved:', data[0] ? data[0].id : 'unknown');
      return data;
    } catch (err) {
      console.error('Save subscription error:', err);
      localStorage.setItem('push-subscription-local', JSON.stringify(subscriptionData));
      throw err;
    }
  }

  // ============================================
  // UPDATE ON SERVER
  // ============================================
  async updateSubscriptionOnServer() {
    const subId = localStorage.getItem('push-subscription-id');
    if (!subId) return;

    const settings = this.getDetailedSettings();

    try {
      const url = window.supabase.url + '/rest/v1/push_subscriptions?id=eq.' + subId;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': window.supabase.key,
          'Authorization': 'Bearer ' + window.supabase.key,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          notif_usd: settings.notif_usd,
          notif_eur: settings.notif_eur,
          notif_try: settings.notif_try,
          notif_sar: settings.notif_sar,
          notif_aed: settings.notif_aed,
          notif_qar: settings.notif_qar,
          notif_jod: settings.notif_jod,
          notif_iqd: settings.notif_iqd,
          notif_gbp: settings.notif_gbp,
          notif_chf: settings.notif_chf,
          notif_all_currencies: settings.notif_all_currencies,
          notif_gold: settings.notif_gold,
          notif_btc: settings.notif_btc,
          notif_eth: settings.notif_eth,
          notif_bnb: settings.notif_bnb,
          notif_sol: settings.notif_sol,
          notif_ada: settings.notif_ada,
          notif_trx: settings.notif_trx,
          notif_usdt: settings.notif_usdt,
          notif_paxg: settings.notif_paxg,
          notif_all_crypto: settings.notif_all_crypto,
          notif_fuel: settings.notif_fuel,
          notif_electricity: settings.notif_electricity,
          notif_news: settings.notif_news,
          notif_daily: settings.notif_daily,
          threshold_percent: settings.threshold_percent,
          last_used_at: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Update error:', err);
    }
  }

  // ============================================
  // REMOVE FROM SERVER
  // ============================================
  async removeSubscription() {
    const subId = localStorage.getItem('push-subscription-id');

    if (subId) {
      try {
        const url = window.supabase.url + '/rest/v1/push_subscriptions?id=eq.' + subId;
        await fetch(url, {
          method: 'PATCH',
          headers: {
            'apikey': window.supabase.key,
            'Authorization': 'Bearer ' + window.supabase.key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_active: false })
        });
      } catch (err) {
        console.error('Remove error:', err);
      }
    }
  }

  // ============================================
  // GET DETAILED SETTINGS
  // ============================================
  getDetailedSettings() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };

    const getRadioVal = () => {
      const radios = document.querySelectorAll('input[name="threshold"]');
      for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) return parseFloat(radios[i].value);
      }
      return 1;
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

      threshold_percent: getRadioVal()
    };
  }

  // ============================================
  // LOAD SETTINGS FROM SUPABASE
  // ============================================
  async loadSettingsFromServer() {
    const subId = localStorage.getItem('push-subscription-id');
    if (!subId) return;

    try {
      const url = window.supabase.url + '/rest/v1/push_subscriptions?id=eq.' + subId + '&select=*';
      const response = await fetch(url, {
        headers: {
          'apikey': window.supabase.key,
          'Authorization': 'Bearer ' + window.supabase.key
        }
      });
      const data = await response.json();

      if (!data || !data[0]) return;

      const settings = data[0];

      // تطبيق الإعدادات على الـ UI
      const applySetting = (key, value) => {
        if (typeof value !== 'boolean') return;
        const elId = key.replace(/_/g, '-');
        const el = document.getElementById(elId);
        if (el) el.checked = value;
      };

      Object.keys(settings).forEach(key => {
        if (key.indexOf('notif_') === 0) {
          applySetting(key, settings[key]);
        }
      });

      if (settings.threshold_percent) {
        const radios = document.querySelectorAll('input[name="threshold"]');
        for (let i = 0; i < radios.length; i++) {
          if (parseFloat(radios[i].value) === settings.threshold_percent) {
            radios[i].checked = true;
            break;
          }
        }
      }

    } catch (err) {
      console.error('Load settings error:', err);
    }
  }

  // ============================================
  // SEND TEST NOTIFICATION
  // ============================================
  async sendTestNotification() {
    if (!this.subscription) {
      alert('اشترك أولاً!');
      return;
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
          title: '🧪 اختبار إشعار',
          body: 'إذا شايف هاد الإشعار، كل شي شغال! ✅',
          url: '/notifications.html'
        })
      });

      if (response.ok) {
        alert('✅ تم إرسال الإشعار! افحص شريط التنبيهات.');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Server error');
      }
    } catch (err) {
      console.error('Test notification error:', err);
      this.showLocalNotification(
        '🧪 اختبار محلي',
        'السيرفر لسا مو مربوط، بس الإشعارات المحلية شغالة'
      );
    }
  }

  // ============================================
  // LOCAL NOTIFICATION (fallback)
  // ============================================
  showLocalNotification(title, body, options) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    options = options || {};

    const defaultOptions = {
      icon: '/images/logo.svg',
      badge: '/images/favicon.png',
      tag: 'lira-local-' + Date.now(),
      requireInteraction: false,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [100, 50, 100],
      data: { url: '/' }
    };

    const mergedOptions = {};
    Object.keys(defaultOptions).forEach(key => {
      mergedOptions[key] = options[key] !== undefined ? options[key] : defaultOptions[key];
    });

    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: body,
        icon: mergedOptions.icon,
        badge: mergedOptions.badge,
        tag: mergedOptions.tag,
        requireInteraction: mergedOptions.requireInteraction,
        dir: mergedOptions.dir,
        lang: mergedOptions.lang,
        vibrate: mergedOptions.vibrate,
        data: mergedOptions.data,
        actions: [
          { action: 'open', title: '🔍 فتح التطبيق' },
          { action: 'dismiss', title: '✕ تجاهل' }
        ]
      });
    });
  }

  // ============================================
  // BROADCAST NOTIFICATION
  // ============================================
  async broadcastNotification(title, body, options) {
    options = options || {};

    try {
      const url = window.supabase.url + '/rest/v1/push_subscriptions?select=endpoint&is_active=eq.true';
      const response = await fetch(url, {
        headers: {
          'apikey': window.supabase.key,
          'Authorization': 'Bearer ' + window.supabase.key
        }
      });
      const subscribers = await response.json();

      if (!subscribers || !subscribers.length) return;

      const results = await Promise.allSettled(
        subscribers.map(sub =>
          fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: sub.endpoint,
              title: title,
              body: body,
              url: options.url || '/',
              icon: options.icon || '/images/logo.svg',
              badge: options.badge || '/images/favicon.png'
            })
          })
        )
      );

      const success = results.filter(r => r.status === 'fulfilled').length;
      console.log('Broadcast: ' + success + '/' + subscribers.length + ' delivered');

      return { success: success, total: subscribers.length };

    } catch (err) {
      console.error('Broadcast error:', err);
      return { success: 0, total: 0 };
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  detectPlatform() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(ua)) return 'mac';
    return 'other';
  }

  // ============================================
  // STATUS
  // ============================================
  getStatus() {
    return {
      supported: this.isSupported,
      permission: Notification.permission,
      subscribed: this.subscription !== null,
      endpoint: this.subscription ? this.subscription.endpoint : null
    };
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================
const pushManager = new PushNotificationManager();

document.addEventListener('DOMContentLoaded', () => {
  pushManager.init().then(subscribed => {
    console.log('Push status:', pushManager.getStatus());
  });
});

window.pushManager = pushManager;
