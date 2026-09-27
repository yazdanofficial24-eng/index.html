import { kv } from '@vercel/kv';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'DMP-ADMIN-X7K9-2M4P-8Q1Z';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { secret, action, apikey } = req.query;

  if (secret !== ADMIN_SECRET) return res.status(401).json({ status:'error', message:'Unauthorized' });

  const keys = await kv.get('apikeys') || [];
  const banned = await kv.get('banned') || [];
  const logs = await kv.get('logs') || [];
  const now = new Date();

  if (action === 'status') {
    let active = 0, expired = 0;
    for (const k of keys) {
      if (k.active) active++;
      if (k.expired_at !== 'permanent' && new Date(k.expired_at) < now) expired++;
    }
    return res.status(200).json({
      status: 'success', server: 'DumpOsint_ID',
      total_keys: keys.length, active_keys: active, expired_keys: expired,
      banned_ips: banned.length, total_requests: logs.length,
      last_request: logs.length ? logs[logs.length-1].time : '-',
      time: now.toISOString()
    });
  }

  if (action === 'delete') {
    const filtered = keys.filter(k => k.apikey !== apikey);
    await kv.set('apikeys', filtered);
    return res.status(200).json({ status: 'success' });
  }

  if (action === 'toggle') {
    for (const k of keys) { if (k.apikey === apikey) { k.active = !k.active; break; } }
    await kv.set('apikeys', keys);
    return res.status(200).json({ status: 'success' });
  }

  if (action === 'logs') {
    return res.status(200).json({ status: 'success', data: logs.slice(-100) });
  }

  res.status(400).json({ status: 'error', message: 'Unknown action' });
}
