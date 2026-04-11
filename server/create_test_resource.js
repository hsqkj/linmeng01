// 直接使用 Node.js 内置的 https/http 模块
const http = require('http');

function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  // 登录
  const loginRes = await postJson('http://localhost:3000/api/merchant/login', {
    phone: '13900139001',
    code: '123456'
  });

  if (loginRes.code !== 200) {
    console.log('登录失败:', loginRes);
    return;
  }

  const token = loginRes.data.token;
  console.log('登录成功, merchantId:', loginRes.data.merchant.id);

  // 创建资源 - 使用简化数据
  const createRes = await postJson('http://localhost:3000/api/merchant/resources', {
    resource_type: '专业服务',
    title: '【测试】法律咨询专业服务',
    content: '专业律师团队提供免费法律咨询服务',
    tags: ['连锁品牌'],
    professional_type: '法律咨询',
    service_scope: 'city',
    certification: '执业律师20年',
    price_range: 'free'
  }, { Authorization: `Bearer ${token}` });

  console.log('创建资源结果:', JSON.stringify(createRes, null, 2));
}

main().catch(console.error);
