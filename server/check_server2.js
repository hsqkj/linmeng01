const mysql = require('./node_modules/mysql2/promise');

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
      console.log('SUCCESS: 配置已存在');
      console.log(rows[0].config_value.substring(0, 200));
    } else {
      console.log('ERROR: 配置不存在');
    }
  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await pool.end();
  }
}

checkConfig();
