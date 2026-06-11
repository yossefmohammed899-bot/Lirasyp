// ============================================
// Service Worker - الليرة عملتنا
// Merged: sw.js + service-worker.js
// ============================================

const CACHE_NAME = 'lira-amlatna-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/currencies.html',
  '/gold.html',
  '/crypto.html',
  '/fuel.html',
  '/electricity.html',
  '/news.html',
  '/calculator.html',
  '/wallet.html',
  '/notifications.html',
  '/css/style.css',
  '/js/main.js',
  '/js/currencies.js',
  '/js/gold.js',
  '/js/crypto.js',
  '/js/fuel.js',
  '/js/electricity.js',
  '/js/news.js',
  '/js/calculator.js',
  '/js/wallet.js',
  '/js/notifications.js',
  '/js/push-notifications.js',
  '/images/logo.svg',
  '/images/favicon.png'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {
      return Promise.resolve();
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - cache first, network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Supabase API
  if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      }).catch(() => {
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ============================================
// PUSH NOTIFICATIONS (merged from service-worker.js)
// ============================================
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'تنبيه جديد من الليرة عملتنا',
    icon: data.icon || '/images/logo.svg',
    badge: data.badge || '/images/favicon.png',
    tag: data.tag || 'lira-' + Date.now(),
    requireInteraction: false,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    renotify: true,
    data: {
      url: data.url || '/',
      ...data.extraData
    },
    actions: [
      { action: 'open', title: '🔍 فتح التطبيق' },
      { action: 'dismiss', title: '✕ تجاهل' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'الليرة عملتنا 📊',
      options
    )
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(c => c.navigate(url));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rates') {
    event.waitUntil(syncRates());
  }
});

async function syncRates() {
  try {
    const response = await fetch('https://tsjaamvnykinbafujiny.supabase.co/rest/v1/v_latest_exchange_rates?select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamFhbXZueWtpbmJhZnVqaW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzIwODQsImV4cCI6MjA5NjMwODA4NH0.lcn_lWSYDD4ToutH8gPketvg4fT-_sxan4-nwD84XOw',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamFhbXZueWtpbmJhZnVqaW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzIwODQsImV4cCI6MjA5NjMwODA4NH0.lcn_lWSYDD4ToutH8gPketvg4fT-_sxan4-nwD84XOw'
      }
    });
    const data = await response.json();
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/latest-rates', new Response(JSON.stringify(data)));
  } catch (e) {
    console.error('Sync failed:', e);
  }
}
