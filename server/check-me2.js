const mysql = require('mysql2/promise');
async function main() {
  const db = mysql.createPool({ host: '127.0.0.1', user: 'root', password: 'root', database: 'linmeng' });
  const [desc] = await db.query('DESCRIBE community_user');
  console.log('Columns:', desc.map(x => x.Field).join(', '));
  const [rows] = await db.query('SELECT * FROM community_user ORDER BY id DESC LIMIT 3');
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}
main().then(() => process.exit()).catch(e => { console.error(e.message); process.exit(1); });
