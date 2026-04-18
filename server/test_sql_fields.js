// 测试SQL字段与值数量是否匹配
// INSERT字段列表（来自createResource函数）

const insertFields = [
  'merchant_id', 'resource_type', 'title', 'content', 'images', 'tags',
  'min_amount', 'max_amount', 'quantity', 'specs', 'pickup_way', 'staff_count',
  'work_duration', 'manpower_desc', 'service_scope', 'certification',
  'price_range', 'professional_type', 'media_channels', 'media_desc',
  'goods_expiry', 'goods_items', 'fund_scenes', 'space_area', 'capacity', 'facilities', 'open_hours',
  'work_type', 'salary_range',
  'valid_until', 'expected_rewards', 'expected_reward_desc', 'status',
  'ai_audit_level', 'ai_audit_reason'
]

// VALUES数组（来自createResource函数）
const valuesArray = [
  'data.merchant_id', 'resourceType', 'data.title', 'data.content',
  'JSON.stringify(data.images || [])', 'JSON.stringify(data.tags || [])',
  'data.min_amount || 0', 'data.max_amount || 0', 'data.quantity || 0', 'data.specs || \'\'', 'data.pickup_way || \'\'',
  'data.staff_count || 0', 'data.work_duration || 0', 'data.manpower_desc || \'\'',
  'data.service_scope || \'\'', 'data.certification || \'\'', 'data.price_range || \'\'',
  'data.professional_type || \'\'',
  'JSON.stringify(data.media_channels || [])', 'data.media_desc || \'\'',
  'data.goods_expiry || null', 'JSON.stringify(data.goods_items || [])', 'JSON.stringify(data.fund_scenes || [])',
  'data.space_area || 0', 'data.capacity || 0', 'JSON.stringify(data.facilities || [])', 'data.open_hours || \'\'',
  'data.work_type || \'\'', 'data.salary_range || \'\'',
  'data.valid_until || null',
  'JSON.stringify(data.expected_rewards || [])', 'data.expected_reward_desc || \'\'', 'initialStatus',
  'auditResult.level', 'auditResult.reason || null'
]

console.log(`INSERT字段数量: ${insertFields.length}`)
console.log(`VALUES数组长度: ${valuesArray.length}`)

if (insertFields.length === valuesArray.length) {
  console.log('✅ 字段和值数量匹配')
} else {
  console.log('❌ 字段和值数量不匹配!')
  console.log(`差异: ${insertFields.length - valuesArray.length}`)
}

// 检查UPDATE语句
console.log('\n=== UPDATE语句分析 ===')

const updateSetFields = [
  'resource_type', 'title', 'content', 'images', 'tags',
  'min_amount', 'max_amount', 'quantity', 'specs', 'pickup_way',
  'staff_count', 'work_duration', 'manpower_desc',
  'service_scope', 'certification', 'price_range', 'professional_type',
  'media_channels', 'media_desc',
  'goods_expiry', 'fund_scenes',
  'space_area', 'capacity', 'facilities', 'open_hours',
  'work_type', 'salary_range',
  'valid_until', 'expected_rewards', 'expected_reward_desc', 'status'
]

const updateValuesArray = [
  'resourceType', 'data.title', 'data.content', 'JSON.stringify(data.images || [])',
  'JSON.stringify(data.tags || [])', 'data.min_amount || 0', 'data.max_amount || 0',
  'data.quantity || 0', 'data.specs || \'\'', 'data.pickup_way || \'\'', 'data.staff_count || 0',
  'data.work_duration || 0', 'data.manpower_desc || \'\'', 'data.service_scope || \'\'',
  'data.certification || \'\'', 'data.price_range || \'\'', 'data.professional_type || \'\'',
  'JSON.stringify(data.media_channels || [])', 'data.media_desc || \'\'',
  'goodsExpiry', 'JSON.stringify(data.fund_scenes || [])',
  'data.space_area || 0', 'data.capacity || 0', 'JSON.stringify(data.facilities || [])', 'data.open_hours || \'\'',
  'data.work_type || \'\'', 'data.salary_range || \'\'',
  'validUntil', 'JSON.stringify(data.expected_rewards || [])', 'data.expected_reward_desc || \'\'', 'id'
]

console.log(`UPDATE SET字段数量: ${updateSetFields.length}`)
console.log(`UPDATE VALUES数组长度（含WHERE条件）: ${updateValuesArray.length}`)

if (updateSetFields.length === updateValuesArray.length - 1) { // -1 for WHERE id = ?
  console.log('✅ UPDATE字段和值数量匹配（不含WHERE的id）')
} else {
  console.log('❌ UPDATE字段和值数量不匹配!')
}
