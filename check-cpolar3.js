const http = require('http');

const auth = 'Basic ' + Buffer.from('124941770@qq.com:hsqkj0526').toString('base64');

const opts = {
  hostname: '127.0.0.1',
  port: 4042,
  path: '/api/tunnels',
  headers: { Authorization: auth },
  timeout: 5000
};

const req = http.get(opts, r => {
  console.log('Status:', r.statusCode);
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('Body:', d.substring(0, 5000));
    try {
      const j = JSON.parse(d);
      if (j.tunnels) {
        j.tunnels.forEach(t => console.log('Tunnel:', t.name, '->', t.public_url));
      }
    } catch(e) {}
  });
});
req.on('error', e => console.error('Error:', e.message));
req.on('timeout', () => { req.destroy(); console.log('Timeout'); });
