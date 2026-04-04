process.chdir('C:/Users/12494/WorkBuddy/20260331205655/server');
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'linmeng';
process.env.DB_PORT = '3306';

const { pool } = require('./src/config/db');

async function migrate() {
  try {
    // Check if contact_name exists
    const [cols] = await pool.query("SHOW COLUMNS FROM communities LIKE 'contact_name'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE communities ADD COLUMN contact_name VARCHAR(50) NULL AFTER phone");
      console.log('Added contact_name column');
    } else {
      console.log('contact_name already exists');
    }

    // Check map_location format
    const [mapCols] = await pool.query("SHOW COLUMNS FROM communities LIKE 'map_location'");
    console.log('map_location column:', JSON.stringify(mapCols));

    // Check community_name update capability
    const [rows] = await pool.query("SELECT id, community_name, community FROM communities LIMIT 3");
    console.log('Sample data:', JSON.stringify(rows));

    await pool.end();
    console.log('Done');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

migrate();
