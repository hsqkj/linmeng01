const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const jwtConfig = require('./src/config/jwt');

async function test() {
  // 创建数据库连接
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 2
  });

  // 1. 获取一个社区用户的token
  const [users] = await pool.query("SELECT id FROM communities WHERE status = 1 LIMIT 1");
  if (users.length === 0) {
    console.log('No community user found');
    return;
  }

  const userId = users[0].id;
  const token = jwt.sign(
    { id: userId, role: 'community' },
    jwtConfig.secret,
    { expiresIn: '7d' }
  );

  console.log('Testing with user ID:', userId);
  console.log('Token generated');

  // 2. 模拟getProfile查询
  try {
    const [rows] = await pool.query(
      `SELECT id, username, real_name, community, community_name, position, households,
       family_ratio, elderly_ratio, public_space_area, has_outdoor_plaza, has_commercial,
       has_school, has_park, merchant_count, logo, description, images, address, tags, status,
       ST_X(map_location) as longitude, ST_Y(map_location) as latitude
       FROM communities WHERE id = ?`,
      [userId]
    );

    console.log('Query result:', rows.length, 'rows');

    // 3. 测试统计查询
    const [[demandCount]] = await pool.query('SELECT COUNT(*) as cnt FROM demands WHERE community_id = ?', [userId]);
    const [[intentionCount]] = await pool.query("SELECT COUNT(*) as cnt FROM intentions WHERE community_id = ? AND status = 3", [userId]);
    const [[viewCount]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM demands WHERE community_id = ?', [userId]);

    console.log('Stats: demands:', demandCount?.cnt, 'intentions:', intentionCount?.cnt, 'views:', viewCount?.total);

    console.log('\nAll queries successful!');
  } catch (e) {
    console.error('Error:', e.message);
    console.error('SQL:', e.sql);
  }

  await pool.end();
}

test().catch(console.error);
