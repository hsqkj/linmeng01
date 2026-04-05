const http = require('http');

const auth = 'Basic ' + Buffer.from('124941770@qq.com:hsqkj0526').toString('base64');

const check = (url) => new Promise((resolve) => {
  const opts = {
    hostname: '127.0.0.1',
    port: 4040,
    path: url.path || '/api/tunnels',
    headers: { Authorization: auth },
    timeout: 5000
  };
  http.get(opts, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => resolve({ status: r.statusCode, body: d.substring(0, 3000) }));
  }).on('error', e => resolve({ error: e.message })).on('timeout', () => resolve({ error: 'timeout' }));
});

(async () => {
  // Try different paths
  const paths = ['/api/tunnels', '/api/v1/tunnels'];
  for (const p of paths) {
    const r = await check({ path: p });
    if (r.status === 200 && r.body) {
      try {
        const j = JSON.parse(r.body);
        const tunnels = j.tunnels || [];
        const running = tunnels.filter(t => t.uri);
        if (running.length) {
          console.log('URL:', running[0].public_url);
        } else {
          console.log('No tunnels:', r.body.substring(0, 500));
        }
      } catch (e) {
        console.log('Not JSON:', r.body.substring(0, 500));
      }
    } else {
      console.log('Path', p, 'status:', r.status, 'error:', r.error);
    }
  }
})();
