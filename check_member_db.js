const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function t() {
  const pool = await mysql.createPool({ host: 'localhost', user: 'root', password: 'root', database: 'linmeng' });
  const [rows] = await pool.query(
    "SELECT config_key, config_value FROM sys_configs WHERE config_key IN ('member_levels','member_benefits')"
  );
  rows.forEach(r => {
    console.log('\n=== ' + r.config_key + ' ===');
    try {
      const parsed = JSON.parse(r.config_value);
      console.log(JSON.stringify(parsed, null, 2).substring(0, 500));
    } catch(e) {
      console.log('RAW:', r.config_value.substring(0, 200));
    }
  });
  
  // 同时查一下测试商家的会员等级
  const [merchants] = await pool.query("SELECT id, name, member_level FROM merchants LIMIT 5");
  console.log('\n=== merchants ===');
  merchants.forEach(m => console.log(`id=${m.id} name=${m.name} level=${m.member_level}`));
  
  await pool.end();
}
t().catch(console.error);
