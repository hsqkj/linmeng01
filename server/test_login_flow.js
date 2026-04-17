// 完整测试：发送验证码 -> 提取验证码 -> 登录
const http = require('http')

const BASE = 'http://150.158.12.243'
const phone = '13986274018'  // 新手机号，未超限

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : ''
    const opts = { hostname: '150.158.12.243', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } }
    if (b) opts.headers['Content-Length'] = Buffer.byteLength(b)
    const req = http.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }))
    })
    req.on('error', reject)
    if (b) req.write(b)
    req.end()
  })
}

;(async () => {
  // 1. 发送验证码
  console.log('>>> 1. 发送验证码到', phone)
  const sms = await request('POST', '/api/public/sms/send', { phone, type: 'login' })
  console.log('状态:', sms.status, '| 响应:', JSON.stringify(sms.body))

  // 提取验证码（降级时在 data.code，生产时不在响应里）
  const code = sms.body.data?.code
  if (!code) { console.log('真实短信发送成功（验证码不返回前端），请查收手机短信'); return }

  console.log('模拟验证码:', code)

  // 2. 登录
  console.log('\n>>> 2. 登录测试')
  const login = await request('POST', '/api/community/login', { phone, code })
  console.log('状态:', login.status, '| 响应:', JSON.stringify(login.body))
})()
