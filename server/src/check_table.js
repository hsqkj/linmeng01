const mysql = require('mysql2/promise');

async function checkTable() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 1
  });

  try {
    const [rows] = await pool.query('DESCRIBE resources');
    console.log('Resources table columns:');
    rows.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTable();
