import { kv } from '@vercel/kv';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'DMP-ADMIN-X7K9-2M4P-8Q1Z';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { secret, action, ip } = req.query;

  if (secret !== ADMIN_SECRET) return res.status(401).json({ status:'error', message:'Unauthorized' });

  let banned = await kv.get('banned') || [];

  if (action === 'ban') {
    if (!banned.includes(ip)) banned.push(ip);
    await kv.set('banned', banned);
    return res.status(200).json({ status:'success', message:'IP banned', ip });
  }
  if (action === 'unban') {
    banned = banned.filter(i => i !== ip);
    await kv.set('banned', banned);
    return res.status(200).json({ status:'success', message:'IP unbanned', ip });
  }
  if (action === 'list') {
    return res.status(200).json({ status:'success', data: banned });
  }
  res.status(400).json({ status:'error', message:'Unknown action' });
}
