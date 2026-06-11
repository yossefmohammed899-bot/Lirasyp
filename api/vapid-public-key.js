//  ============================================
// API: Get VAPID Public Key
// Vercel Serverless Function - /api/vapid-public-key
// ============================================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(500).json({ 
      error: 'VAPID_PUBLIC_KEY not configured',
      hint: 'Add VAPID_PUBLIC_KEY to Vercel Environment Variables'
    });
  }

  res.status(200).json({ publicKey });
}
