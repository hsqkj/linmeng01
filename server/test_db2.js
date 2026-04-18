const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'linmeng'
})

async function test() {
  try {
    // 测试连接
    const conn = await pool.getConnection()
    console.log('DB connected')
    conn.release()

    // 测试查询 communities 表
    const [commRows] = await pool.query('SELECT id, real_name, community_name FROM communities WHERE id = 22')
    console.log('comm query OK:', commRows.length)

    // 测试查询 community_compounds 表
    const [compRows] = await pool.query('SELECT * FROM community_compounds WHERE community_id = 22')
    console.log('compounds query OK:', compRows.length)

    // 测试查询 community_spaces 表
    const [spaceRows] = await pool.query('SELECT * FROM community_spaces WHERE community_id = 22')
    console.log('spaces query OK:', spaceRows.length)

    console.log('All tests passed!')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

test()