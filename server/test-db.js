require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const mysql = require('mysql2/promise')

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'linmeng'
    })
    console.log('Connected OK')
    const [rows] = await conn.query('SHOW TABLES')
    console.log('Tables:', JSON.stringify(rows, null, 2))
    const [admins] = await conn.query('SELECT id, username, real_name, role, status FROM admins LIMIT 5')
    console.log('Admins:', JSON.stringify(admins, null, 2))
    await conn.end()
  } catch (e) {
    console.error('Error:', e.message)
  }
}
test()
