const https = require('https');

const options = {
  hostname: '150.158.12.243',
  port: 3000,
  path: '/api/merchant/member',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('服务器API响应:');
      console.log('member_level:', json.data?.member_level);
      console.log('validityPeriod:', json.data?.validityPeriod);
      console.log('currentLevel:', JSON.stringify(json.data?.currentLevel, null, 2));
    } catch (e) {
      console.log('响应数据:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

req.end();
