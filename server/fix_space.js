const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng'
  });
  // 直接更新 id=3 的设施数据
  await c.query(
    "UPDATE community_spaces SET facilities = '[\"投影\",\"话筒\",\"wifi\",\"电子屏\",\"桌椅\",\"空调\"]' WHERE id = 3"
  );
  const [r] = await c.query('SELECT id, facilities FROM community_spaces');
  console.log(JSON.stringify(r, null, 2));
  c.end();
})();
