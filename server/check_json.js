const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const [rows] = await conn.execute(
    'SELECT config_value FROM sys_configs WHERE config_key = ?',
    ['ambassador_commission']
  );

  if (rows.length > 0) {
    console.log('Raw value:');
    console.log(rows[0].config_value);
    console.log('\nLength:', rows[0].config_value.length);
  } else {
    console.log('No config found');
  }

  await conn.end();
}

check().catch(console.error);
