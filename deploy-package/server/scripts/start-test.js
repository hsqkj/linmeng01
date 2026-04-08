/**
 * 启动测试脚本 - 捕获所有错误
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

console.log('ENV loaded:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'EMPTY!',
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'EMPTY!'
})

// 捕获未处理异常
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err.message)
  console.error(err.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
  process.exit(1)
})

try {
  const app = require('../src/app')
  console.log('App module loaded OK')
} catch (e) {
  console.error('LOAD ERROR:', e.message)
  console.error(e.stack)
  process.exit(1)
}

// 等待5秒后自动退出
setTimeout(() => {
  console.log('5s timeout - test complete')
  process.exit(0)
}, 5000)
