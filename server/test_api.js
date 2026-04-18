const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== /api/admin/community/scores ===');
  const scores = await get('http://localhost:3000/api/admin/community/scores');
  const changshan = scores.find(c => c.community && c.community.includes('长山'));
  console.log('包含长山的社区:', JSON.stringify(changshan, null, 2));
  
  console.log('\n=== /api/admin/regions?level=1,2,3,4 ===');
  const regions = await get('http://localhost:3000/api/admin/regions?level=1,2,3,4');
  const guandong = regions.find(r => r.name && r.name.includes('关东') && r.level === 3);
  const changshanRegion = regions.find(r => r.name && r.name.includes('长山'));
  console.log('关东街道:', JSON.stringify(guandong, null, 2));
  console.log('长山社区:', JSON.stringify(changshanRegion, null, 2));
}

main().catch(console.error);
