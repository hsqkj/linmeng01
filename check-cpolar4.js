const http = require('http');

// Try without auth first (new cpolar version)
const check = (port, path, auth) => new Promise((resolve) => {
  const opts = {
    hostname: '127.0.0.1',
    port,
    path,
    timeout: 5000
  };
  if (auth) opts.headers = { Authorization: auth };
  http.get(opts, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => resolve({ port, status: r.statusCode, body: d.substring(0, 3000) }));
  }).on('error', e => resolve({ port, error: e.message })).on('timeout', () => resolve({ port, error: 'timeout' }));
});

(async () => {
  const paths = ['/api/tunnels', '/v2/tunnels', '/tunnels'];
  for (const p of paths) {
    const r = await check(4042, p);
    console.log(`Port 4042, ${p}:`, r.status || r.error, r.body || '');
  }
  // Also check 4040 (service)
  const r2 = await check(4040, '/api/tunnels');
  console.log(`Port 4040, /api/tunnels:`, r2.status || r2.error, r2.body || '');
})();
