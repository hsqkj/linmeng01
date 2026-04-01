// 数据库连接池
const mysql = require('mysql2/promise')
const dbConfig = require('./database')

// 创建连接池
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  charset: dbConfig.charset,
  timezone: dbConfig.timezone,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('数据库连接失败:', error.message)
    return false
  }
}

module.exports = { pool, testConnection }
