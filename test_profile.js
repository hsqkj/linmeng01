const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve({ raw: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  // 1. Login
  const login = await post('/api/admin/login', { username: 'admin', password: 'admin123' });
  console.log('Login:', login.code === 200 ? 'OK' : 'FAIL', login.message || '');
  if (login.code !== 200) return;
  const token = login.data?.token;
  console.log('Token:', token ? token.slice(0, 30) + '...' : 'NONE');

  // 2. Test community scores
  const scores = await get('/api/admin/community/scores', token);
  console.log('\n=== Community Scores ===');
  console.log('Code:', scores.code);
  if (scores.data && scores.data.length > 0) {
    scores.data.forEach(c => {
      console.log(`[${c.id}] ${c.realName} - ${c.communityName}`);
      console.log(`  Scale:${c.scores.scale} Family:${c.scores.family} Facility:${c.scores.facility} Activity:${c.scores.activity} Matching:${c.scores.matching} Exposure:${c.scores.exposure}`);
      console.log(`  Overall: ${c.overall}`);
    });
  } else {
    console.log('Data:', JSON.stringify(scores.data || scores));
  }

  // 3. Test profile for community 1
  const profile = await get('/api/admin/community/profile/1', token);
  console.log('\n=== Community Profile (ID=1) ===');
  console.log('Code:', profile.code);
  if (profile.data) {
    console.log('Community:', profile.data.community?.name, '-', profile.data.community?.communityName);
    console.log('Overall:', profile.data.overall);
    console.log('Scores:', JSON.stringify(profile.data.scores));
    console.log('Raw:', JSON.stringify(profile.data.raw));
  } else {
    console.log('Error:', profile.message || JSON.stringify(profile));
  }
}

test().catch(console.error);
