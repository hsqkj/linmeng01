const mysql = require('mysql2')

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'linmeng'
  })

  // 查询关东街道的所有社区
  const [rows] = await pool.query("SELECT id, real_name, community, street, district FROM communities WHERE street='关东街道'")
  console.log('communities表 关东街道社区:', JSON.stringify(rows, null, 2))

  // 查询 regions 表中的街道
  const [streets] = await pool.query("SELECT id, name, parent_id, level FROM regions WHERE level=3 AND name LIKE '%关东%'")
  console.log('regions关东街道:', JSON.stringify(streets, null, 2))

  await pool.end()
}

test().catch(e => console.error(e))