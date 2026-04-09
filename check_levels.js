const mysql = require('mysql2/promise');

async function checkConfig() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_levels'");
  if (rows[0]) {
    console.log('member_levels config:');
    console.log(JSON.stringify(JSON.parse(rows[0].config_value), null, 2));
  }

  await pool.end();
}

checkConfig().catch(console.error);
