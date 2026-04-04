const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const memberLevels = [
  { level: 1, name: '普通会员', fee: 0,     intent_limit: 5,  view_contact: false, priority: false, homepage: false, activity_count: 2,  customer_service: false,
    benefits: ['每月发起5次意向', '基础匹配展示', '参与活动2次/年'] },
  { level: 2, name: '银牌会员', fee: 999,   intent_limit: 10, view_contact: false, priority: true,  homepage: false, activity_count: 5,  customer_service: false,
    benefits: ['每月发起10次意向', '优先展示排名', '参与活动5次/年'] },
  { level: 3, name: '金牌会员', fee: 2999,  intent_limit: 0,  view_contact: true,  priority: true,  homepage: false, activity_count: 10, customer_service: false,
    benefits: ['不限次数发起意向', '查看社区联系方式', '优先展示排名', '参与活动10次/年'] },
  { level: 4, name: '铂金会员', fee: 5999,  intent_limit: 0,  view_contact: true,  priority: true,  homepage: true,  activity_count: 0,  customer_service: true,
    benefits: ['不限次数发起意向', '查看社区联系方式', '首页推荐展示', '专属客服', '不限次数参与活动'] },
  { level: 5, name: '钻石会员', fee: 12000, intent_limit: 0,  view_contact: true,  priority: true,  homepage: true,  activity_count: 0,  customer_service: true,
    benefits: ['不限次数发起意向', '查看社区联系方式', '首页顶部推荐', '专属VIP客服', '不限次数参与活动', '定制匹配报告'] }
];

const memberBenefits = {
  Lv1: { intent_limit: 5,  view_contact: false, priority: false, homepage: false, customer_service: false },
  Lv2: { intent_limit: 10, view_contact: false, priority: true,  homepage: false, customer_service: false },
  Lv3: { intent_limit: 0,  view_contact: true,  priority: true,  homepage: false, customer_service: false },
  Lv4: { intent_limit: 0,  view_contact: true,  priority: true,  homepage: true,  customer_service: true  },
  Lv5: { intent_limit: 0,  view_contact: true,  priority: true,  homepage: true,  customer_service: true  }
};

async function fix() {
  const pool = await mysql.createPool({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng'
  });

  await pool.execute(
    "UPDATE sys_configs SET config_value = ? WHERE config_key = 'member_levels'",
    [JSON.stringify(memberLevels)]
  );
  console.log('✅ member_levels updated');

  await pool.execute(
    "UPDATE sys_configs SET config_value = ? WHERE config_key = 'member_benefits'",
    [JSON.stringify(memberBenefits)]
  );
  console.log('✅ member_benefits updated');

  // 验证
  const [rows] = await pool.execute(
    "SELECT config_key, SUBSTRING(config_value,1,80) as preview FROM sys_configs WHERE config_key IN ('member_levels','member_benefits')"
  );
  rows.forEach(r => console.log(r.config_key, '→', r.preview));

  await pool.end();
  console.log('\n🎉 Done! member_level=0 的商家前端会自动显示为 Lv1 普通会员（已在前端修复）');
}

fix().catch(err => { console.error('❌', err.message); process.exit(1); });
