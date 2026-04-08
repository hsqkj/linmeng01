require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  console.log('DB connected')

  const [rows] = await conn.query('SELECT * FROM admins WHERE username = ? AND status = 1', ['admin'])
  console.log('Found rows:', rows.length)

  if (rows.length > 0) {
    const admin = rows[0]
    const match = await bcrypt.compare('admin123', admin.password)
    console.log('Password match:', match)

    if (match) {
      const perms = JSON.parse(admin.permissions || '[]')
      console.log('Permissions:', perms)

      const token = jwt.sign({
        id: admin.id,
        username: admin.username,
        role: admin.role,
        permissions: perms
      }, process.env.JWT_SECRET || 'linmeng_jwt_secret_key_2026', { expiresIn: '7d' })
      console.log('Token generated, length:', token.length)
    }
  }

  await conn.end()
  console.log('Test complete!')
}

test().catch(e => console.error('ERROR:', e.message, e.stack))
