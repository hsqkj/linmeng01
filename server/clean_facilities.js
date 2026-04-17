const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng'
  });
  // 清理所有设施中的 "?" 字符
  const [rows] = await c.query('SELECT id, facilities FROM community_spaces');
  for (const row of rows) {
    if (row.facilities && Array.isArray(row.facilities)) {
      const cleaned = row.facilities.filter(f => f !== '?');
      if (cleaned.length !== row.facilities.length) {
        await c.query('UPDATE community_spaces SET facilities = ? WHERE id = ?', [JSON.stringify(cleaned), row.id]);
        console.log('Cleaned space id:', row.id);
      }
    }
  }
  // 验证
  const [r] = await c.query('SELECT id, name, facilities FROM community_spaces');
  console.log(JSON.stringify(r, null, 2));
  c.end();
})();
