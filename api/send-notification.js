import webPush from 'web-push';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@lirasyp.com';

  if (!publicKey || !privateKey) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);

  try {
    // استقبال الـ keys من الطلب
    const { endpoint, keys, title, body, url, icon, badge } = req.body;

    if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
      return res.status(400).json({ error: 'Endpoint and encryption keys (auth, p256dh) are required' });
    }

    // بناء كائن الاشتراك الكامل للتشفير
    const pushSubscription = {
      endpoint: endpoint,
      keys: {
        auth: keys.auth,
        p256dh: keys.p256dh
      }
    };

    const payload = JSON.stringify({
      title: title || 'الليرة عملتنا',
      body: body || 'إشعار جديد',
      url: url || '/',
      icon: icon || '/images/icon-192x192.png',
      badge: badge || '/images/favicon.png'
    });

    // إرسال الإشعار
    await webPush.sendNotification(pushSubscription, payload);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Push Error:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      return res.status(410).json({ error: 'Subscription expired' });
    }
    return res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
}
