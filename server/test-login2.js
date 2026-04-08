require('dotenv').config({ path: require('path').join(__dirname, '.env') })

// 测试完整的 adminController.login 流程
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')
const jwtConfig = require('./src/config/jwt')

async function test() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'linmeng',
      port: 3306,
      charset: 'utf8mb4',
      timezone: '+08:00',
      waitForConnections: true,
      connectionLimit: 10
    })

    const username = 'admin'
    const password = 'admin123'

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? AND status = 1', [username])
    console.log('Query result rows:', rows.length)

    if (rows.length === 0) { console.log('NOT FOUND'); return }

    const admin = rows[0]
    console.log('Admin:', admin.id, admin.username)

    const isMatch = await bcrypt.compare(password, admin.password)
    console.log('Match:', isMatch)

    let permissions = []
    if (Array.isArray(admin.permissions)) {
      permissions = admin.permissions
    } else if (typeof admin.permissions === 'string') {
      try { permissions = JSON.parse(admin.permissions) } catch (e) { permissions = [] }
    }
    console.log('Permissions:', permissions)

    const token = jwt.sign({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn })
    console.log('Token generated:', token.substring(0, 50) + '...')

    await pool.query('UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?', ['127.0.0.1', admin.id])
    console.log('Login info updated')

    console.log('ALL PASSED')
    await pool.end()
  } catch (e) {
    console.error('ERROR:', e.message)
    console.error('STACK:', e.stack)
  }
}
test()
