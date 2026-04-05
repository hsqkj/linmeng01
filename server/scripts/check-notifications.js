// 检查 system_notifications 表结构
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function checkTables() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'linmeng'
  });

  console.log('=== system_notifications 表结构 ===');
  const [notifCols] = await pool.query("DESCRIBE system_notifications");
  notifCols.forEach(col => {
    console.log(col.Field, '-', col.Type, '- Null:', col.Null);
  });

  console.log('\n=== system_notifications 数据 ===');
  const [notifRows] = await pool.query("SELECT * FROM system_notifications LIMIT 5");
  console.log(JSON.stringify(notifRows, null, 2));

  // 检查 ambassadors 表的 notification 相关字段
  console.log('\n=== 检查是否有 ambassador_notifications 表 ===');
  const [tables] = await pool.query("SHOW TABLES LIKE '%ambassador%notif%'");
  console.log(tables);

  await pool.end();
}

checkTables().catch(console.error);
