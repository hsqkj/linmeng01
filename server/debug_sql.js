// 调试INSERT语句
require('dotenv').config({ path: '.env.local' });

const sql = `INSERT INTO resources (merchant_id, resource_type, title, content, images, tags,
 min_amount, max_amount, quantity, specs, pickup_way, staff_count,
 work_duration, manpower_desc, service_scope, certification,
 price_range, professional_type, media_channels, media_desc,
 goods_expiry, goods_items, fund_scenes, space_area, capacity, facilities, open_hours,
 work_type, salary_range,
 valid_until, expected_rewards, expected_reward_desc, status,
 ai_audit_level, ai_audit_reason)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const params = [1, 0, 'Test Resource', 'Test content description',
  JSON.stringify(['test.jpg']), JSON.stringify(['test']),
  100, 500, 10, '规格说明', '自提',
  5, '2小时', '需要专业人员',
  '武汉市', '资质证书', '面议',
  '咨询服务',
  JSON.stringify(['电视', '网络']), '媒体报道说明',
  null, JSON.stringify(['物品1', '物品2']), JSON.stringify(['教育', '医疗']),
  '100平米', 50, JSON.stringify(['空调', '投影']), '9:00-18:00',
  '全职', '5000-8000',
  null,
  JSON.stringify(['宣传推广', '物资赞助']), '希望获得媒体报道', 0,
  'low', null
];

console.log('SQL:', sql);
console.log('\nSQL问号数量:', (sql.match(/\?/g) || []).length);
console.log('Params数量:', params.length);

// 逐行检查SQL
const lines = sql.split('\n');
console.log('\n逐行检查:');
lines.forEach((line, i) => {
  const qs = (line.match(/\?/g) || []).length;
  if (qs > 0 || line.trim().startsWith('VALUES') || line.trim().startsWith('(')) {
    console.log(`Line ${i+1}: ${qs}个?, ${line.trim().substring(0, 80)}`);
  }
});

// 检查VALUES部分的行
console.log('\n检查VALUES行的问号:');
const valuesLine = lines.filter(l => l.includes('VALUES'))[0];
console.log('VALUES行问号数:', (valuesLine.match(/\?/g) || []).length);
