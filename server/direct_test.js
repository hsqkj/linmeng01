// 直接测试容联云短信服务
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
require('dotenv').config({ path: path.join(__dirname, '.env.local') })

const ACCOUNT_SID = process.env.RONGLIAN_ACCOUNT_SID
const AUTH_TOKEN = process.env.RONGLIAN_AUTH_TOKEN
const APP_ID = process.env.RONGLIAN_APP_ID
const TEMPLATE_ID = process.env.RONGLIAN_TEMPLATE_ID

console.log('=== 配置检查 ===')
console.log('ACCOUNT_SID:', ACCOUNT_SID ? ACCOUNT_SID.slice(0, 10) + '...' : '未配置')
console.log('AUTH_TOKEN:', AUTH_TOKEN ? '已配置' : '未配置')
console.log('APP_ID:', APP_ID ? APP_ID.slice(0, 10) + '...' : '未配置')
console.log('TEMPLATE_ID:', TEMPLATE_ID || '未配置')

const crypto = require('crypto')
const https = require('https')

const phone = process.argv[2] || '13986274017'
const code = '123456'
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const sig = crypto.createHash('md5').update(ACCOUNT_SID + AUTH_TOKEN + timestamp).digest('hex').toUpperCase()

const body = JSON.stringify({
  to: phone,
  appId: APP_ID,
  templateId: parseInt(TEMPLATE_ID),
  datas: [code, '5']
})

const options = {
  hostname: 'app.cloopen.com',
  port: 8883,
  path: `/2013-12-26/Accounts/${ACCOUNT_SID}/SMS/TemplateSMS?sig=${sig}`,
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': Buffer.from(`${ACCOUNT_SID}:${timestamp}`).toString('base64'),
    'Content-Length': Buffer.byteLength(body)
  }
}

console.log('\n=== 发送请求 ===')
console.log('Phone:', phone)
console.log('Timestamp:', timestamp)
console.log('Sig:', sig)

const req = https.request(options, res => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => {
    console.log('\n=== 响应 ===')
    console.log('HTTP Status:', res.statusCode)
    console.log('Body:', data)
  })
})
req.on('error', e => console.error('\n=== 错误 ===', e.message))
req.write(body)
req.end()
