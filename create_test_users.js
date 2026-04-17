// 创建测试账号
const mysql = require('mysql2/promise');

async function createTestAccounts() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    // 社区测试账号
    await pool.execute(
      `INSERT IGNORE INTO communities (username, password, real_name, phone, community, district, street, status, member_level, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      ['18800000001', '$2a$10$test', '测试社区用户', '18800000001', '测试社区', '武汉市江岸区', '后湖街道', 1, 1]
    );
    console.log('✓ 社区测试账号已创建: 18800000001');

    // 商家测试账号
    await pool.execute(
      `INSERT IGNORE INTO merchants (username, password, company_name, contact_name, phone, industry, status, member_level, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      ['18800000002', '$2a$10$test', '测试商家公司', '测试商家', '18800000002', '教育培训', 1, 1]
    );
    console.log('✓ 商家测试账号已创建: 18800000002');

    // 大使测试账号
    await pool.execute(
      `INSERT IGNORE INTO ambassadors (username, password, real_name, phone, qr_code, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      ['18800000003', '$2a$10$test', '测试大使', '18800000003', 'LM88888888', 1]
    );
    console.log('✓ 大使测试账号已创建: 18800000003');

    // 验证
    const [c] = await pool.execute('SELECT * FROM communities WHERE phone=?', ['18800000001']);
    const [m] = await pool.execute('SELECT * FROM merchants WHERE phone=?', ['18800000002']);
    const [a] = await pool.execute('SELECT * FROM ambassadors WHERE phone=?', ['18800000003']);

    console.log('\n账号验证:');
    console.log('社区:', c.length ? `${c[0].username} - ${c[0].real_name}` : '❌ 未创建');
    console.log('商家:', m.length ? `${m[0].username} - ${m[0].company_name}` : '❌ 未创建');
    console.log('大使:', a.length ? `${a[0].username} - ${a[0].real_name}` : '❌ 未创建');

  } finally {
    await pool.end();
  }
}

createTestAccounts().catch(console.error);
