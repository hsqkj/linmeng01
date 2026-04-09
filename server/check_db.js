const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 2
  });

  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM communities');
    console.log('Communities table columns:');
    rows.forEach(r => console.log(r.Field));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
