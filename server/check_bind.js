const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'root', database: 'linmeng', waitForConnections: true, connectionLimit: 1 });
const db = pool;

async function main() {
  // 1. Check wechat_user_bind for community users
  const [binds] = await db.query(
    'SELECT user_type, user_id, phone, openid FROM wechat_user_bind WHERE user_type=? LIMIT 5',
    ['community']
  );
  console.log('wechat_user_bind community records:');
  binds.forEach(r => console.log(r));

  console.log();

  // 2. Check wechat_user_bind full data
  const [binds2] = await db.query('SELECT * FROM wechat_user_bind LIMIT 5');
  console.log('all wechat_user_bind records:', binds2);

  // 3. Check communities table structure
  const [cols] = await db.query('DESCRIBE communities');
  console.log('communities columns:', cols.map(c => c.Field));

  // 4. Check communities data
  const [comms] = await db.query('SELECT id, username FROM communities LIMIT 5');
  console.log('communities:', comms);

  // 5. Cross check - is user_id from wechat_user_bind matching communities.id?
  const [binds3] = await db.query("SELECT user_type, user_id FROM wechat_user_bind WHERE user_type='community'");
  console.log('community binds:', binds3);
  if (binds3.length > 0) {
    const [c] = await db.query('SELECT id, username FROM communities WHERE id IN (?)', [binds3.map(b => b.user_id)]);
    console.log('matched communities:', c);
  }

  pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
