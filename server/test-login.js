require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const bcrypt = require('bcryptjs')
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
    const [rows] = await conn.query('SELECT * FROM admins WHERE username = ?', ['admin'])
    if (rows.length === 0) { console.log('User not found'); return }
    const admin = rows[0]
    console.log('Admin found:', { id: admin.id, username: admin.username, password_hash: admin.password })
    const isMatch = await bcrypt.compare('admin123', admin.password)
    console.log('Password match:', isMatch)
    await conn.end()
  } catch (e) {
    console.error('Error:', e.message, e.stack)
  }
}
test()
