// 详细检查INSERT字段
const sql = `INSERT INTO resources (merchant_id, resource_type, title, content, images, tags,
 min_amount, max_amount, quantity, specs, pickup_way, staff_count,
 work_duration, manpower_desc, service_scope, certification,
 price_range, professional_type, media_channels, media_desc,
 goods_expiry, goods_items, fund_scenes, space_area, capacity, facilities, open_hours,
 work_type, salary_range,
 valid_until, expected_rewards, expected_reward_desc, status,
 ai_audit_level, ai_audit_reason)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// 提取INSERT字段列表
const match = sql.match(/INSERT INTO \w+ \(([\s\S]+?)\)/);
if (match) {
  const fieldsStr = match[1];
  const fields = fieldsStr.split(',').map(f => f.trim());
  console.log('INSERT字段列表:');
  fields.forEach((f, i) => console.log(`${i+1}. ${f}`));
  console.log(`\n总共 ${fields.length} 个字段`);

  // 检查VALUES问号
  const valuesMatch = sql.match(/VALUES \(([\s\S]+?)\)/);
  if (valuesMatch) {
    const valuesStr = valuesMatch[1];
    const questionMarks = (valuesStr.match(/\?/g) || []).length;
    console.log(`VALUES问号数量: ${questionMarks}`);
    if (fields.length !== questionMarks) {
      console.log(`❌ 不匹配！字段 ${fields.length} 个，问号 ${questionMarks} 个`);
    } else {
      console.log('✅ 匹配');
    }
  }
}
