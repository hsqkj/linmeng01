const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    port: 3306
  });
  
  try {
    // 查找彭黎明的记录
    const [rows] = await pool.query(
      'SELECT id, company_name, company_type, status, member_level, phone, contact_name FROM merchants WHERE company_name LIKE ? OR contact_name LIKE ?',
      ['%彭黎明%', '%彭黎明%']
    );
    
    console.log('找到的记录数:', rows.length);
    rows.forEach(row => {
      console.log('用户数据:', JSON.stringify(row, null, 2));
    });
    
    // 也查找所有 company_type = expert 的记录
    const [experts] = await pool.query(
      'SELECT id, company_name, company_type, contact_name, phone FROM merchants WHERE company_type = ?',
      ['expert']
    );
    console.log('\n所有专家记录:', experts.length);
    experts.forEach(row => {
      console.log('  -', row.company_name, row.contact_name, row.phone);
    });
    
  } catch (err) {
    console.error('查询失败:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
