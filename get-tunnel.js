const http = require('http');
const auth = 'Basic ' + Buffer.from('124941770@qq.com:hsqkj0526').toString('base64');

const check = (url) => new Promise((resolve) => {
  http.get(url, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => resolve({ status: r.statusCode, body: d.substring(0, 3000) }));
  }).on('error', e => resolve({ error: e.message }));
});

(async () => {
  const r = await check({ hostname: '127.0.0.1', port: 4040, path: '/api/tunnels', headers: { Authorization: auth } });
  if (r.error) {
    // Try port 9200
    const r2 = await check({ hostname: '127.0.0.1', port: 9200, path: '/api/v1/tunnels', headers: { Authorization: auth } });
    if (r2.body) {
      try {
        const j = JSON.parse(r2.body);
        const tunnels = j.tunnels || [];
        const running = tunnels.filter(t => t.uri);
        if (running.length) {
          console.log('Running tunnel URL:', running[0].public_url);
        } else {
          console.log('No running tunnels found');
        }
      } catch (e) { console.log('Parse error, raw:', r2.body); }
    } else { console.log('Port 9200 error:', r2.error); }
  } else {
    try {
      const j = JSON.parse(r.body);
      const tunnels = j.tunnels || [];
      const running = tunnels.filter(t => t.uri);
      if (running.length) { console.log('Running tunnel URL:', running[0].public_url); }
      else { console.log('No running tunnels. Body:', r.body.substring(0, 500)); }
    } catch (e) { console.log('Raw:', r.body.substring(0, 300)); }
  }
})();
