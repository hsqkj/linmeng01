const http = require('http');

// Try cpolar API with auth token
const authToken = 'MWRhZGU3NWYtYzVhNy00OGExLThmY2QtZjRiYmYyNTNiYTFl';

const post = (data) => new Promise((resolve) => {
  const body = JSON.stringify(data);
  const opts = {
    hostname: 'www.cpolar.com',
    port: 443,
    path: '/api/v3/tunnels',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + authToken,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 10000
  };
  const req = https.request(opts, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => resolve({ status: r.statusCode, body: d.substring(0, 3000) }));
  });
  req.on('error', e => resolve({ error: e.message }));
  req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
  req.end();
});

const check = (port, path) => new Promise((resolve) => {
  const opts = {
    hostname: '127.0.0.1',
    port,
    path,
    timeout: 5000
  };
  const req = http.get(opts, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => resolve({ port, path, status: r.statusCode, body: d.substring(0, 3000) }));
  });
  req.on('error', e => resolve({ port, path, error: e.message }));
  req.on('timeout', () => { req.destroy(); resolve({ port, path, error: 'timeout' }); });
});

// Check all cpolar API endpoints
post({}).then(r => console.log('API Response:', JSON.stringify(r)));

module.exports = {};
