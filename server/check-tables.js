const mysql = require('mysql2/promise');
async function main() {
  const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });
  const [rows] = await db.query('SHOW TABLES LIKE "%user%"');
  console.log('User tables:', JSON.stringify(rows, null, 2));
  await db.end();
}
main().catch(console.error);
