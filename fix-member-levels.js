// 修复数据库中 member_levels 和 member_benefits 配置
const mysql = require('mysql2/promise')
require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') })

async function fix() {
  const pool = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'linmeng'
  })

  const memberLevels = [
    { level: 1, name: '普通会员', fee: 0, intent_limit: 5, view_contact: false, priority: false, homepage: false, activity_count: 2, customer_service: false,
      benefits: ['每月发起5次意向', '基础匹配展示', '参与活动2次/年'] },
    { level: 2, name: '银牌会员', fee: 999, intent_limit: 10, view_contact: false, priority: true, homepage: false, activity_count: 5, customer_service: false,
      benefits: ['每月发起10次意向', '优先展示排名', '参与活动5次/年'] },
    { level: 3, name: '金牌会员', fee: 2999, intent_limit: 0, view_contact: true, priority: true, homepage: false, activity_count: 10, customer_service: false,
      benefits: ['不限次数发起意向', '查看社区联系方式', '优先展示排名', '参与活动10次/年'] },
    { level: 4, name: '铂金会员', fee: 5999, intent_limit: 0, view_contact: true, priority: true, homepage: true, activity_count: 0, customer_service: true,
      benefits: ['不限次数发起意向', '查看社区联系方式', '首页推荐展示', '专属客服', '不限次数参与活动'] },
    { level: 5, name: '钻石会员', fee: 12000, intent_limit: 0, view_contact: true, priority: true, homepage: true, activity_count: 0, customer_service: true,
      benefits: ['不限次数发起意向', '查看社区联系方式', '首页顶部推荐', '专属VIP客服', '不限次数参与活动', '定制匹配报告'] }
  ]

  const memberBenefits = {
    Lv1: { intent_limit: 5, view_contact: false, priority: false, homepage: false, customer_service: false },
    Lv2: { intent_limit: 10, view_contact: false, priority: true, homepage: false, customer_service: false },
    Lv3: { intent_limit: 0, view_contact: true, priority: true, homepage: false, customer_service: false },
    Lv4: { intent_limit: 0, view_contact: true, priority: true, homepage: true, customer_service: true },
    Lv5: { intent_limit: 0, view_contact: true, priority: true, homepage: true, customer_service: true }
  }

  await pool.execute(
    "UPDATE sys_configs SET config_value = ? WHERE config_key = 'member_levels'",
    [JSON.stringify(memberLevels)]
  )
  console.log('✅ member_levels 更新成功')

  await pool.execute(
    "UPDATE sys_configs SET config_value = ? WHERE config_key = 'member_benefits'",
    [JSON.stringify(memberBenefits)]
  )
  console.log('✅ member_benefits 更新成功')

  // 验证
  const [rows] = await pool.execute("SELECT config_key, config_value FROM sys_configs WHERE config_key IN ('member_levels','member_benefits')")
  rows.forEach(r => {
    const parsed = JSON.parse(r.config_value)
    console.log(`\n[${r.config_key}]:`, Array.isArray(parsed) ? `${parsed.length} 条记录` : Object.keys(parsed).join(', '))
    if (Array.isArray(parsed)) {
      parsed.forEach(l => console.log(`  Lv${l.level} ${l.name}: fee=${l.fee}, intent_limit=${l.intent_limit}, view_contact=${l.view_contact}`))
    }
  })

  await pool.end()
  console.log('\n✅ 全部修复完成')
}

fix().catch(console.error)
