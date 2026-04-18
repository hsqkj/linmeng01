const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  // 查询长山社区
  console.log('=== regions 表中包含"长山"的社区 ===');
  let [rows] = await pool.query("SELECT id, name, level, parent_id FROM regions WHERE name LIKE '%长山%'");
  console.log(JSON.stringify(rows, null, 2));

  console.log('\n=== communities 表中包含"长山"的记录 ===');
  [rows] = await pool.query("SELECT id, real_name, community, community_name, street FROM communities WHERE community LIKE '%长山%' OR community_name LIKE '%长山%'");
  console.log(JSON.stringify(rows, null, 2));

  console.log('\n=== ID=22 的社区详细信息 ===');
  [rows] = await pool.query("SELECT * FROM communities WHERE id = 22");
  console.log(JSON.stringify(rows, null, 2));

  await pool.end();
}
test().catch(console.error);
