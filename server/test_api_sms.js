const http = require('http')

const data = JSON.stringify({ phone: '13986274016', type: 'register' })

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/send-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    console.log('状态码:', res.statusCode)
    console.log('响应:', body)
  })
})

req.on('error', err => console.error('请求错误:', err.message))
req.write(data)
req.end()
