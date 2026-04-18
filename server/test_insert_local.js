// 测试INSERT语句参数
require('dotenv').config({ path: '.env.local' });
const pool = require('./src/config/db').pool;

async function testInsert() {
  try {
    const data = {
      merchant_id: 1,
      resource_type: 0,
      title: 'Test Resource',
      content: 'Test content description',
      images: ['test.jpg'],
      tags: ['test'],
      min_amount: 100,
      max_amount: 500,
      quantity: 10,
      specs: '规格说明',
      pickup_way: '自提',
      staff_count: 5,
      work_duration: '2小时',
      manpower_desc: '需要专业人员',
      service_scope: '武汉市',
      certification: '资质证书',
      price_range: '面议',
      professional_type: '咨询服务',
      media_channels: ['电视', '网络'],
      media_desc: '媒体报道说明',
      goods_expiry: null,
      goods_items: ['物品1', '物品2'],
      fund_scenes: ['教育', '医疗'],
      space_area: '100平米',
      capacity: 50,
      facilities: ['空调', '投影'],
      open_hours: '9:00-18:00',
      work_type: '全职',
      salary_range: '5000-8000',
      valid_until: null,
      expected_rewards: ['宣传推广', '物资赞助'],
      expected_reward_desc: '希望获得媒体报道'
    };

    const resourceType = data.resource_type;
    const initialStatus = 0;
    const auditResult = { level: 'low', reason: null };

    console.log('VALUES数组长度:', [
      data.merchant_id, resourceType, data.title, data.content,
      JSON.stringify(data.images || []), JSON.stringify(data.tags || []),
      data.min_amount || 0, data.max_amount || 0, data.quantity || 0, data.specs || '', data.pickup_way || '',
      data.staff_count || 0, data.work_duration || 0, data.manpower_desc || '',
      data.service_scope || '', data.certification || '', data.price_range || '',
      data.professional_type || '',
      JSON.stringify(data.media_channels || []), data.media_desc || '',
      data.goods_expiry || null, JSON.stringify(data.goods_items || []), JSON.stringify(data.fund_scenes || []),
      data.space_area || 0, data.capacity || 0, JSON.stringify(data.facilities || []), data.open_hours || '',
      data.work_type || '', data.salary_range || '',
      data.valid_until || null,
      JSON.stringify(data.expected_rewards || []), data.expected_reward_desc || '', initialStatus,
      auditResult.level, auditResult.reason || null
    ].length);

    const [result] = await pool.query(
      `INSERT INTO resources (merchant_id, resource_type, title, content, images, tags,
       min_amount, max_amount, quantity, specs, pickup_way, staff_count,
       work_duration, manpower_desc, service_scope, certification,
       price_range, professional_type, media_channels, media_desc,
       goods_expiry, goods_items, fund_scenes, space_area, capacity, facilities, open_hours,
       work_type, salary_range,
       valid_until, expected_rewards, expected_reward_desc, status,
       ai_audit_level, ai_audit_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.merchant_id, resourceType, data.title, data.content,
       JSON.stringify(data.images || []), JSON.stringify(data.tags || []),
       data.min_amount || 0, data.max_amount || 0, data.quantity || 0, data.specs || '', data.pickup_way || '',
       data.staff_count || 0, data.work_duration || 0, data.manpower_desc || '',
       data.service_scope || '', data.certification || '', data.price_range || '',
       data.professional_type || '',
       JSON.stringify(data.media_channels || []), data.media_desc || '',
       data.goods_expiry || null, JSON.stringify(data.goods_items || []), JSON.stringify(data.fund_scenes || []),
       data.space_area || 0, data.capacity || 0, JSON.stringify(data.facilities || []), data.open_hours || '',
       data.work_type || '', data.salary_range || '',
       data.valid_until || null,
       JSON.stringify(data.expected_rewards || []), data.expected_reward_desc || '', initialStatus,
       auditResult.level, auditResult.reason || null]
    );

    console.log('Insert成功, ID:', result.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testInsert();
