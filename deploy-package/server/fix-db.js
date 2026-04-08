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

    // Verify map_location
    const [mapCols] = await pool.query("SHOW COLUMNS FROM communities LIKE 'map_location'");
    console.log('map_location:', JSON.stringify(mapCols));

    await pool.end();
    console.log('Migration done');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

migrate();
