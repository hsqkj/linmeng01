const http = require('http');
const fs = require('fs');
const FormData = require('./server/node_modules/form-data');

const form = new FormData();
form.append('file', fs.createReadStream('D:/test_real.png'), {
  filename: 'test.png',
  contentType: 'image/png'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload/single',
  method: 'POST',
  headers: form.getHeaders()
};

console.log('Testing /api/upload/single with form-data...');
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});
form.pipe(req);
req.on('error', e => console.error(e));
