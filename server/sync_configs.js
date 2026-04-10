const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportAndSyncConfigs() {
  // 连接本地数据库
  const localConn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    multipleStatements: true
  });

  console.log('正在导出本地配置...');
  const [rows] = await localConn.query('SELECT config_key, config_value FROM sys_configs ORDER BY config_key');
  await localConn.end();

  console.log(`找到 ${rows.length} 条配置`);

  // 生成更新SQL
  const updates = rows.map(row => {
    const value = row.config_value.replace(/'/g, "''");
    return `UPDATE sys_configs SET config_value = '${value}' WHERE config_key = '${row.config_key}';`;
  }).join('\n');

  const sql = `-- 同步 sys_configs 配置\n${updates}`;

  // 保存SQL文件
  fs.writeFileSync('D:\\WorkBuddy\\20260331205655\\sync_configs_update.sql', sql);
  console.log('SQL文件已保存');

  return rows.length;
}

exportAndSyncConfigs().then(count => {
  console.log(`导出完成，共 ${count} 条配置`);
  process.exit(0);
}).catch(err => {
  console.error('导出失败:', err);
  process.exit(1);
});
