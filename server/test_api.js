// 测试服务器 API（使用 http 模块避免 shell 转义问题）
const http = require('http')
const path = require('path')
const baseDir = '/var/www/linmeng/server'
require(path.join(baseDir, 'node_modules', 'dotenv')).config({ path: path.join(baseDir, '.env') })
require(path.join(baseDir, 'node_modules', 'dotenv')).config({ path: path.join(baseDir, '.env.local') })

const phone = process.argv[2] || '13986274015'
const body = JSON.stringify({ phone, type: 'login' })
console.log('[POST] /api/public/sms/send')
console.log('[BODY]', body)

const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/api/public/sms/send', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, r => {
  let d = ''
  r.on('data', c => d += c)
  r.on('end', () => {
    console.log('[HTTP]', r.statusCode)
    console.log('[RESP]', d)
  })
})
req.on('error', e => console.error('[ERR]', e.message))
req.write(body)
req.end()
