const mysql = require('mysql2/promise')
const pool = mysql.createPool({
  host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'linmeng'
})

async function test() {
  const conn = await pool.getConnection()
  
  // 查找关东街道在regions表中的信息
  const [streets] = await conn.query("SELECT id, name, level, parent_id FROM regions WHERE name LIKE '%关东%'")
  console.log('关东相关区域:', JSON.stringify(streets, null, 2))
  
  // 测试 communities 表中 street 字段为空的那些社区
  const [emptyStreet] = await conn.query("SELECT id, community_name, street FROM communities WHERE street IS NULL OR street = '' LIMIT 5")
  console.log('street为空的社区:', JSON.stringify(emptyStreet, null, 2))
  
  conn.release()
  await pool.end()
}

test().catch(e => console.error(e.message))