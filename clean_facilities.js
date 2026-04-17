const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng'
  });
  const [r] = await c.query('SELECT id, facilities FROM community_spaces');
  for (const row of r) {
    const original = row.facilities;
    if (original && Array.isArray(original)) {
      const cleaned = original.filter(f => f !== '?');
      if (cleaned.length !== original.length) {
        await c.query('UPDATE community_spaces SET facilities=? WHERE id=?',
          [JSON.stringify(cleaned), row.id]);
        console.log('Cleaned id', row.id, ':', JSON.stringify(original), '->', JSON.stringify(cleaned));
      }
    }
  }
  const [r2] = await c.query('SELECT facilities FROM community_spaces');
  console.log('After:', JSON.stringify(r2, null, 2));
  c.end();
})();
