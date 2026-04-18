const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          console.error('JSON parse error:', e.message);
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== /api/admin/community/scores ===');
  const scores = await get('http://localhost:3000/api/admin/community/scores');
  if (Array.isArray(scores)) {
    console.log('数组长度:', scores.length);
    const changshan = scores.find(c => c.community && c.community.includes('长山'));
    console.log('长山社区:', JSON.stringify(changshan, null, 2));
  } else {
    console.log('返回数据:', JSON.stringify(scores).substring(0, 500));
  }
  
  console.log('\n=== /api/admin/regions ===');
  const regions = await get('http://localhost:3000/api/admin/regions?level=4');
  if (Array.isArray(regions)) {
    const changshanRegion = regions.find(r => r.name && r.name.includes('长山'));
    console.log('regions表长山社区:', JSON.stringify(changshanRegion, null, 2));
  }
}

main().catch(console.error);
