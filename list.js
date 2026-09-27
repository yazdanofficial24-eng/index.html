import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const keys = await kv.get('apikeys') || [];
  const now = new Date();

  const list = keys.map(k => {
    let status = 'active';
    if (!k.active) status = 'inactive';
    else if (k.expired_at !== 'permanent' && new Date(k.expired_at) < now) status = 'expired';
    else if (k.limit <= 0) status = 'limit_habis';
    return { ...k, status };
  });

  res.status(200).json({ status: 'success', total: list.length, data: list });
}
