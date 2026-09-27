import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '0.0.0.0';
  const { apikey, fitur, tipe, query, mode } = req.query;

  const banned = await kv.get('banned') || [];
  if (banned.includes(ip)) return res.status(403).json({ status:'error', message:'IP banned' });
  if (!apikey) return res.status(401).json({ status:'error', message:'API key required' });

  const keys = await kv.get('apikeys') || [];
  const found = keys.find(k => k.apikey === apikey);
  if (!found) return res.status(401).json({ status:'error', message:'API key invalid' });
  if (!found.active) return res.status(403).json({ status:'error', message:'API key inactive' });
  if (found.expired_at !== 'permanent' && new Date(found.expired_at) < new Date())
    return res.status(403).json({ status:'error', message:'API key expired' });
  if (found.ip_locked && found.ip_locked !== ip)
    return res.status(403).json({ status:'error', message:'API key locked to another IP' });
  if (found.limit <= 0) return res.status(402).json({ status:'error', message:'Limit habis' });

  const folder = String(fitur || '').replace(/[^a-z0-9_\-]/gi, '');
  const dbFile = path.join(process.cwd(), 'database', folder, 'data.json');

  let db = [];
  try { db = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch(e) {}

  let result = [];
  if (mode === 'dump') {
    result = db.slice(0, 500);
  } else {
    const q = String(query || '').toLowerCase();
    for (const row of db) {
      if (JSON.stringify(row).toLowerCase().includes(q)) {
        result.push(row);
        if (result.length >= 200) break;
      }
    }
  }

  for (const k of keys) {
    if (k.apikey === apikey) { k.limit--; k.used++; k.last_used = new Date().toISOString(); break; }
  }
  await kv.set('apikeys', keys);

  res.status(200).json({
    status: 'success', fitur: folder, tipe, query,
    total: result.length, data: result, time: new Date().toISOString()
  });
}
