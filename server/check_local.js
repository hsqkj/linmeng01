const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const [rows] = await conn.execute(
    'SELECT config_key, LENGTH(config_value) as len FROM sys_configs'
  );

  console.log('配置项长度:');
  rows.forEach(r => {
    console.log(`  ${r.config_key}: ${r.len} 字符`);
  });

  // 检查第一个配置的原始值
  const [first] = await conn.execute(
    'SELECT config_value FROM sys_configs WHERE config_key = ?',
    ['ambassador_commission']
  );
  if (first.length > 0) {
    console.log('\nambassador_commission 前100字符:');
    console.log(first[0].config_value.substring(0, 100));
  }

  await conn.end();
}

check().catch(console.error);
