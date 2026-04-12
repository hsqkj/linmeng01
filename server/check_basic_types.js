const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });
  
  const [rows] = await conn.query(
    "SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'"
  );
  
  if (rows.length > 0) {
    const config = JSON.parse(rows[0].config_value);
    console.log('resourceTypes:', JSON.stringify(config.resourceTypes, null, 2));
    console.log('activityTypes:', JSON.stringify(config.activityTypes, null, 2));
  }
  
  await conn.end();
}

main().catch(console.error);
