const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  // 检查 expert_types
  const [expert] = await conn.execute(
    'SELECT config_value FROM sys_configs WHERE config_key = ?',
    ['expert_types']
  );
  console.log('=== expert_types ===');
  console.log(expert[0].config_value);
  console.log('\n前50字符:');
  console.log(expert[0].config_value.substring(0, 50));

  // 检查 anti_flying_level
  const [level] = await conn.execute(
    'SELECT config_value FROM sys_configs WHERE config_key = ?',
    ['anti_flying_level']
  );
  console.log('\n=== anti_flying_level ===');
  console.log(level[0].config_value);

  await conn.end();
}

check().catch(console.error);
