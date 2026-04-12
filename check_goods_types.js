const mysql = require('./server/node_modules/mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng'
  });
  const [rows] = await conn.execute("SELECT config_value FROM sys_configs WHERE config_key='basic_types'");
  if (!rows.length) { console.log('basic_types NOT FOUND'); conn.end(); return; }
  const v = JSON.parse(rows[0].config_value);
  console.log('goodsTypes raw:', JSON.stringify(v.goodsTypes, null, 2));
  // 模拟API过滤
  const filtered = v.goodsTypes ? v.goodsTypes.filter(t => t.enabled !== false).map(t => t.name || t) : [];
  console.log('filtered result:', filtered);
  conn.end();
})().catch(e => console.error(e.message));
