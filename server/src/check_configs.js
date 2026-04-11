const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 10
  });

  const [rows] = await pool.query("SELECT config_key, LEFT(config_value, 200) as value FROM sys_configs");
  console.log('sys_configs:');
  rows.forEach(r => {
    console.log(`- ${r.config_key}: ${r.value}`);
  });

  await pool.end();
}

check().catch(console.error);
