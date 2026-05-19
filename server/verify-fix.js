const jwt = require('jsonwebtoken');
const https = require('https');

const token = jwt.sign(
  { openid: 'test', id: 21, role: 'community' },
  'linmeng_jwt_secret_2026_secure_key',
  { expiresIn: '1h' }
);

console.log('Token generated:', token.substring(0, 50) + '...');

const req = https.request({
  hostname: '3qall.com',
  path: '/api/community/profile',
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('HTTP', res.statusCode, d.substring(0, 400)));
});
req.on('error', e => console.error(e.message));
req.end();
