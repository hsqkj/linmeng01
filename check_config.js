const mysql = require('mysql2/promise');

async function checkConfig() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  try {
    const [rows] = await pool.query(
      "SELECT config_value FROM sys_configs WHERE config_key = 'ambassador_commission'"
    );
    if (rows.length > 0) {
      console.log('本地数据库配置:');
      console.log(rows[0].config_value);
    } else {
      console.log('本地数据库中没有 ambassador_commission 配置');
    }
  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await pool.end();
  }
}

checkConfig();
