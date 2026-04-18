const mysql = require('mysql2/promise')

async function test() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'linmeng'
  })
  
  try {
    const [commRows] = await pool.query('SELECT * FROM communities WHERE id = ?', [22])
    console.log('commRows:', commRows.length)
    
    const [compoundsRows] = await pool.query('SELECT id, name, households FROM community_compounds WHERE community_id = ?', [22])
    console.log('compoundsRows:', compoundsRows.length)
    
    const [spacesRows] = await pool.query('SELECT * FROM community_spaces WHERE community_id = ?', [22])
    console.log('spacesRows:', spacesRows.length)
    
    console.log('OK')
  } catch (e) {
    console.error(e)
  } finally {
    await pool.end()
  }
}

test()