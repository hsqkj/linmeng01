const http = require('http');

async function api(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3000');
    http.get({ hostname: url.hostname, port: url.port, path: url.pathname + url.search }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function test() {
  const paths = [
    '/api/community/resources?page=1&pageSize=3&sort=match',
    '/api/community/resources?page=1&pageSize=3',
    '/api/merchant/my/resources?page=1&pageSize=3',
    '/api/merchant/profile',
    '/api/ambassador/profile',
  ];
  for (const p of paths) {
    try {
      const r = await api(p);
      console.log(`${r.status >= 400 ? 'FAIL' : 'OK  '} ${r.status} ${p}`);
      if (r.status >= 400) console.log(r.body.substring(0, 150));
    } catch (e) { console.log('ERR', p, e.message); }
  }
}
test();
