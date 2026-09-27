import { kv } from '@vercel/kv';

function genKey() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n) => Array(n).fill(0).map(() => c[Math.floor(Math.random()*c.length)]).join('');
  return `DMP-${part(6)}-${part(6)}-${part(6)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { label, durasi, limit, lock_ip } = req.query;
  const now = new Date();
  let expired_at = 'permanent';
  if (durasi === '1d')  expired_at = new Date(now.getTime() + 86400000).toISOString();
  if (durasi === '7d')  expired_at = new Date(now.getTime() + 604800000).toISOString();
  if (durasi === '30d') expired_at = new Date(now.getTime() + 2592000000).toISOString();

  const apikey = genKey();
  const keys = await kv.get('apikeys') || [];
  const baseUrl = `https://${req.headers.host}`;

  const newKey = {
    apikey,
    label: label || 'user',
    limit: parseInt(limit) || 100,
    used: 0,
    active: true,
    ip_locked: lock_ip || '',
    created_at: now.toISOString(),
    expired_at,
    durasi: durasi || 'permanent',
    last_used: '-',
    base_url: `${baseUrl}/api/check`,
    full_url: `${baseUrl}/api/check?apikey=${apikey}&fitur=polri&tipe=nama&query=NAMA_TARGET`
  };

  keys.push(newKey);
  await kv.set('apikeys', keys);

  res.status(200).json({ status: 'success', data: newKey });
}
