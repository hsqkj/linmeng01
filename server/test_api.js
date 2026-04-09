const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 2
  });

  try {
    // 模拟后端getProfile查询
    const communityId = 1;  // 假设第一个社区用户的ID是1

    const [rows] = await pool.query(
      `SELECT id, username, real_name, community, community_name, position, households,
       family_ratio, elderly_ratio, public_space_area, has_outdoor_plaza, has_commercial,
       has_school, has_park, merchant_count, logo, description, images, address, tags, status,
       ST_X(map_location) as longitude, ST_Y(map_location) as latitude
       FROM communities WHERE id = ?`,
      [communityId]
    );

    if (rows.length === 0) {
      console.log('User not found');
    } else {
      console.log('Query successful, rows:', rows.length);
      console.log('First row:', JSON.stringify(rows[0], null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
    console.error('SQL State:', e.sqlState);
    console.error('SQL:', e.sql);
  } finally {
    await pool.end();
  }
}

test();
