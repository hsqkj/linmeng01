const mysql = require('mysql2/promise');
async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    port: 3306
  });
  const [rows] = await pool.query('SELECT id, company_name, company_type, status, member_level, phone, contact_name, social_identity, honors, description FROM merchants WHERE phone = "13900139000"');
  console.log('User data:', JSON.stringify(rows[0], null, 2));
  process.exit(0);
}
check().catch(console.error);
