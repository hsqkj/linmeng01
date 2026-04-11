// 测试创建资源
const axios = require('axios');

async function testCreateResource() {
  const API_BASE = 'http://localhost:3000/api';
  
  // 先登录获取token
  const loginRes = await axios.post(`${API_BASE}/merchant/login`, {
    phone: 'shangjia1',
    password: '123456'
  });
  
  const token = loginRes.data.data.token;
  console.log('登录成功，token:', token.substring(0, 20) + '...');
  
  // 创建专业服务类型的资源
  const resourceData = {
    resource_type: '专业服务',
    title: '【测试】法律咨询专业服务',
    content: '专业律师团队提供免费法律咨询服务',
    tags: ['连锁品牌', '公益导向'],
    professional_type: '法律咨询',
    service_scope: 'city',
    certification: '执业律师，执业20年，擅长劳动争议、物业纠纷',
    price_range: 'free',
    expected_rewards: ['活动冠名权', '现场展台'],
    expected_reward_desc: '希望获得社区公众号推文宣传1篇'
  };
  
  try {
    const createRes = await axios.post(`${API_BASE}/merchant/resources`, resourceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('创建资源成功:', createRes.data);
  } catch (err) {
    console.error('创建资源失败:', err.response?.data || err.message);
  }
}

testCreateResource();
