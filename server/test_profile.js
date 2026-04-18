const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  // 测试 getCommunityProfile 需要的查询
  console.log('=== 测试 communities 表查询 (id=22) ===');
  const [rows] = await pool.query('SELECT * FROM communities WHERE id = 22');
  console.log('communities:', rows.length, 'rows');

  console.log('\n=== 测试 community_compounds 表查询 ===');
  const [compounds] = await pool.query('SELECT * FROM community_compounds WHERE community_id = 22');
  console.log('compounds:', compounds.length, 'rows');

  console.log('\n=== 测试 community_spaces 表查询 ===');
  const [spaces] = await pool.query('SELECT * FROM community_spaces WHERE community_id = 22');
  console.log('spaces:', spaces.length, 'rows');

  await pool.end();
  console.log('\n所有查询成功！');
}
test().catch(e => {
  console.error('查询失败:', e.message);
  process.exit(1);
});
