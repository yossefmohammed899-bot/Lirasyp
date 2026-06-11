//  ============================================
// API: Send Push Notification
// Vercel Serverless Function - /api/send-notification
// ============================================

import webPush from 'web-push';

export default async function handler(req, res) {
  // CORS
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
    return res.status(500).json({
      error: 'VAPID keys not configured',
      hint: 'Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to Vercel Environment Variables'
    });
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);

  try {
    const { endpoint, title, body, url, icon, badge } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    const payload = JSON.stringify({
      title: title || 'الليرة عملتنا 📊',
      body: body || 'تنبيه جديد',
      url: url || '/',
      icon: icon || '/images/logo.svg',
      badge: badge || '/images/favicon.png'
    });

    await webPush.sendNotification({ endpoint }, payload);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Push error:', error);

    if (error.statusCode === 410) {
      return res.status(410).json({
        error: 'Subscription expired',
        shouldRemove: true
      });
    }

    res.status(500).json({ error: error.message });
  }
}
