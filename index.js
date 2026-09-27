export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
          || req.headers['x-real-ip'] 
          || '0.0.0.0';

  res.status(200).json({
    server: 'DumpOsint_ID',
    version: 'v1.0',
    status: 'ONLINE',
    ip: ip,
    time: new Date().toISOString(),
    endpoints: {
      check: '/api/check?apikey=XXX&fitur=polri&tipe=nama&query=NAMA',
      generate: '/api/generate',
      list: '/api/list',
      admin: '/api/admin',
      ban: '/api/ban'
    }
  });
}
