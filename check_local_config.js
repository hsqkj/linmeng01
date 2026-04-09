const mysql = require('mysql2/promise');

async function checkLocalConfig() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // 本地无密码
    database: 'linmeng'
  });

  console.log('=== 本地数据库 member_levels 配置 ===\n');

  const [rows] = await connection.query(
    "SELECT * FROM sys_configs WHERE config_key = 'member_levels'"
  );

  if (rows.length > 0) {
    console.log('配置值:');
    console.log(rows[0].config_value);
  } else {
    console.log('未找到 member_levels 配置！');
  }

  await connection.end();
}

checkLocalConfig().catch(console.error);
