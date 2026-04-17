const http = require('http');
const fs = require('fs');

const boundary = '----FormBoundary' + Date.now();
const fileName = 'test_real.png';
const fileContent = fs.readFileSync('D:/test_real.png');

let header = '--' + boundary + '\r\n';
header += 'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n';
header += 'Content-Type: image/png\r\n\r\n';

const body = Buffer.concat([
  Buffer.from(header),
  fileContent,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload/single',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
};

console.log('Testing /api/upload/single with real PNG...');
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});
req.on('error', e => console.error(e));
req.write(body);
req.end();
