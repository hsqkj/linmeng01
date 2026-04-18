// 检查VALUES行的具体内容
const sql = `INSERT INTO resources (merchant_id, resource_type, title, content, images, tags,
 min_amount, max_amount, quantity, specs, pickup_way, staff_count,
 work_duration, manpower_desc, service_scope, certification,
 price_range, professional_type, media_channels, media_desc,
 goods_expiry, goods_items, fund_scenes, space_area, capacity, facilities, open_hours,
 work_type, salary_range,
 valid_until, expected_rewards, expected_reward_desc, status,
 ai_audit_level, ai_audit_reason)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// 找到VALUES部分
const lines = sql.split('\n');
console.log('所有行:');
lines.forEach((line, i) => {
  const qs = (line.match(/\?/g) || []).length;
  console.log(`Line ${i+1} (${qs}个?): ${JSON.stringify(line)}`);
});
