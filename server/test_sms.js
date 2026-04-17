/**
 * 容联云短信发送测试脚本
 * 运行: node test_sms.js <手机号>
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
require('dotenv').config({ path: path.join(__dirname, '.env.local') })

const https = require('https')
const crypto = require('crypto')

const ACCOUNT_SID = process.env.RONGLIAN_ACCOUNT_SID
const AUTH_TOKEN = process.env.RONGLIAN_AUTH_TOKEN
const APP_ID = process.env.RONGLIAN_APP_ID
const TEMPLATE_ID = process.env.RONGLIAN_TEMPLATE_ID

console.log('===== 容联云短信配置检查 =====')
console.log('ACCOUNT_SID:', ACCOUNT_SID ? ACCOUNT_SID.slice(0, 8) + '...' : '❌ 未配置')
console.log('AUTH_TOKEN: ', AUTH_TOKEN  ? AUTH_TOKEN.slice(0, 8) + '...'  : '❌ 未配置')
console.log('APP_ID:     ', APP_ID      ? APP_ID.slice(0, 8) + '...'      : '❌ 未配置')
console.log('TEMPLATE_ID:', TEMPLATE_ID ? TEMPLATE_ID                     : '❌ 未配置')
console.log('')

const phone = process.argv[2]
if (!phone) {
  console.log('用法: node test_sms.js <手机号>')
  console.log('示例: node test_sms.js 13800138000')
  process.exit(0)
}

if (!ACCOUNT_SID || !AUTH_TOKEN || !TEMPLATE_ID) {
  console.error('❌ 配置不完整，请检查 server/.env.local')
  process.exit(1)
}

// 生成时间戳
const now = new Date()
const timestamp = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0')

console.log('时间戳:', timestamp)

// SigParameter = MD5(AccountSid + AuthToken + Timestamp).toUpperCase()
const sig = crypto.createHash('md5')
  .update(ACCOUNT_SID + AUTH_TOKEN + timestamp)
  .digest('hex')
  .toUpperCase()

console.log('SigParameter:', sig.slice(0, 8) + '...')

// Authorization = Base64(AccountSid:Timestamp)，不加 Basic 前缀
const auth = Buffer.from(`${ACCOUNT_SID}:${timestamp}`).toString('base64')

// 生成6位验证码
const code = '123456' // 测试用固定验证码

const body = JSON.stringify({
  to: phone,
  appId: APP_ID,
  templateId: parseInt(TEMPLATE_ID),
  datas: [code, '5']
})

console.log('\n===== 发送请求 =====')
console.log('目标手机:', phone)
console.log('验证码:', code)
console.log('模板ID:', TEMPLATE_ID)
console.log('请求Body:', body)

const apiPath = `/2013-12-26/Accounts/${ACCOUNT_SID}/SMS/TemplateSMS?sig=${sig}`
console.log('\nAPI路径:', apiPath.slice(0, 60) + '...')

const options = {
  hostname: 'app.cloopen.com',
  port: 8883,
  path: apiPath,
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': auth,
    'Content-Length': Buffer.byteLength(body)
  }
}

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', chunk => { data += chunk })
  res.on('end', () => {
    console.log('\n===== 响应结果 =====')
    console.log('HTTP状态码:', res.statusCode)
    try {
      const result = JSON.parse(data)
      console.log('响应内容:', JSON.stringify(result, null, 2))
      if (result.statusCode === '000000') {
        console.log('\n✅ 短信发送成功！')
      } else {
        console.log('\n❌ 短信发送失败')
        console.log('错误码:', result.statusCode)
        console.log('错误信息:', result.statusMsg)
      }
    } catch {
      console.log('原始响应:', data)
    }
  })
})

req.on('error', (err) => {
  console.error('\n❌ 请求失败:', err.message)
})

req.setTimeout(10000, () => {
  req.destroy()
  console.error('\n❌ 请求超时（10秒）')
})

req.write(body)
req.end()
