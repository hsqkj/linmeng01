const http = require('http');

const data = JSON.stringify({
  phone: '18800000002',
  code: '123456'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/merchant/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
