const mysql = require('mysql2/promise');
async function main() {
  const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });
  const [rows] = await db.query('SELECT id, phone, openid, nickname, avatar, created_at FROM community_user ORDER BY id DESC LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}
main().catch(console.error);
