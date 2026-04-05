const http = require('http');

const auth = 'Basic ' + Buffer.from('124941770@qq.com:hsqkj0526').toString('base64');

const opts = {
  hostname: '127.0.0.1',
  port: 4040,
  path: '/api/tunnels',
  headers: { Authorization: auth },
  timeout: 5000
};

const req = http.get(opts, r => {
  console.log('Status:', r.statusCode);
  console.log('Headers:', JSON.stringify(r.headers));
  let d = '';
  r.on('data', c => { d += c; process.stdout.write('.'); });
  r.on('end', () => {
    console.log('\nBody:', d.substring(0, 5000));
  });
});
req.on('error', e => console.error('Error:', e.message));
req.on('timeout', () => { req.destroy(); console.log('Timeout'); });
