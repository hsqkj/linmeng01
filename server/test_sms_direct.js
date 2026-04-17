// 在 /var/www/linmeng/server 目录下运行
const path = require('path')
const baseDir = '/var/www/linmeng/server'
require(path.join(baseDir, 'node_modules', 'dotenv')).config({ path: path.join(baseDir, '.env') })
require(path.join(baseDir, 'node_modules', 'dotenv')).config({ path: path.join(baseDir, '.env.local') })
const https = require('https')
const crypto = require('crypto')
const phone = process.argv[2] || '13986274015'
const ACCOUNT_SID = process.env.RONGLIAN_ACCOUNT_SID
const AUTH_TOKEN = process.env.RONGLIAN_AUTH_TOKEN
const APP_ID = process.env.RONGLIAN_APP_ID
const TEMPLATE_ID = process.env.RONGLIAN_TEMPLATE_ID
console.log('[ENV] ACCOUNT_SID:', ACCOUNT_SID)
console.log('[ENV] APP_ID:', APP_ID)
console.log('[ENV] TEMPLATE_ID:', TEMPLATE_ID)
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const sig = crypto.createHash('md5').update(ACCOUNT_SID + AUTH_TOKEN + ts).digest('hex').toUpperCase()
const body = JSON.stringify({ to: phone, appId: APP_ID, templateId: parseInt(TEMPLATE_ID), datas: ['888888', '5'] })
const opts = {
  hostname: 'app.cloopen.com', port: 8883,
  path: '/2013-12-26/Accounts/' + ACCOUNT_SID + '/SMS/TemplateSMS?sig=' + sig,
  method: 'POST',
  headers: {
    'Accept': 'application/json', 'Content-Type': 'application/json',
    'Authorization': Buffer.from(ACCOUNT_SID + ':' + ts).toString('base64'),
    'Content-Length': Buffer.byteLength(body)
  }
}
console.log('[SMS] Sending to', phone, '...')
const req = https.request(opts, r => {
  let d = ''
  r.on('data', c => d += c)
  r.on('end', () => console.log('SMS Response:', d))
})
req.on('error', e => console.error('Error:', e.message))
req.write(body)
req.end()
