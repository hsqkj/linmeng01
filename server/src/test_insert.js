const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 1
  });

  try {
    // 获取一个商家的token（模拟登录）
    const [merchants] = await pool.query('SELECT id, phone FROM merchants LIMIT 1');
    if (merchants.length === 0) {
      console.log('No merchant found');
      return;
    }

    const merchant = merchants[0];
    console.log('Testing with merchant:', merchant.phone);

    // 生成JWT token
    const jwt = require('jsonwebtoken');
    const jwtConfig = require('./config/jwt');
    const token = jwt.sign(
      { id: merchant.id, phone: merchant.phone, type: 'merchant' },
      jwtConfig.secret,
      { expiresIn: '7d' }
    );
    console.log('Token:', token);

    // 测试插入资源
    const testData = {
      merchant_id: merchant.id,
      resource_type: 1,
      title: '测试资源-' + Date.now(),
      content: '测试内容',
      images: JSON.stringify([]),
      tags: JSON.stringify(['标签1', '标签2']),
      min_amount: 100,
      max_amount: 500,
      quantity: '1',
      specs: '',
      pickup_way: '配送',
      staff_count: 5,
      work_duration: '3天',
      skill_requirements: '',
      service_scope: '武汉市',
      certification: '',
      price_range: '',
      media_type: '',
      coverage: '',
      status: 0
    };

    const fields = Object.keys(testData).join(', ');
    const placeholders = Object.keys(testData).map(() => '?').join(', ');
    const values = Object.values(testData);

    const [result] = await pool.query(
      `INSERT INTO resources (${fields}) VALUES (${placeholders})`,
      values
    );
    console.log('Insert successful, ID:', result.insertId);

    // 删除测试数据
    await pool.query('DELETE FROM resources WHERE id = ?', [result.insertId]);
    console.log('Test data cleaned up');

  } catch (err) {
    console.error('Error:', err.message);
    console.error('SQL State:', err.sqlState);
    console.error('SQL Message:', err.sqlMessage);
  } finally {
    await pool.end();
  }
}

test();
