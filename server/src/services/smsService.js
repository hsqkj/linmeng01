/**
 * 容联云通讯短信服务
 * 文档：https://www.yunpian.com/document/docs/message/sms
 */

const https = require('https')
const crypto = require('crypto')

// 环境变量配置
const ACCOUNT_SID = process.env.RONGLIAN_ACCOUNT_SID || ''
const AUTH_TOKEN = process.env.RONGLIAN_AUTH_TOKEN || ''
const APP_ID = process.env.RONGLIAN_APP_ID || ''
const TEMPLATE_ID = process.env.RONGLIAN_TEMPLATE_ID || ''

/**
 * 生成 Authorization 头（Basic Auth）
 * 容联云使用 Base64(AccountSid:AuthToken)
 */
function getAuthHeader() {
  const str = `${ACCOUNT_SID}:${AUTH_TOKEN}`
  return 'Basic ' + Buffer.from(str).toString('base64')
}

/**
 * 生成 SigParameter
 * MD5(AccountSid + AuthToken + yyyyMMddHHmmss)
 */
function getSig(timestamp) {
  return crypto
    .createHash('md5')
    .update(ACCOUNT_SID + AUTH_TOKEN + timestamp)
    .digest('hex')
    .toUpperCase()
}

/**
 * 发送 HTTP 请求（Node.js 原生 https）
 */
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(data)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('请求超时')) })

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

/**
 * 发送短信验证码
 * @param {string} phone  手机号
 * @param {string} code    6位验证码
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendVerifyCode(phone, code) {
  // 未配置时返回友好提示，不中断流程
  if (!ACCOUNT_SID || !AUTH_TOKEN || !TEMPLATE_ID) {
    console.warn('[SMS] 容联云未配置，跳过真实发送')
    return { success: true, mock: true, message: '未配置短信服务（模拟模式）' }
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const sig = getSig(timestamp)

  const options = {
    hostname: 'app.cloopen.com',
    port: 443,
    path: `/2015-04-12/Accounts/${ACCOUNT_SID}/SMS/TemplatesSMS?sig=${sig}`,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
      'Content-Length': undefined // 动态设置
    }
  }

  const body = {
    to: phone,
    appId: APP_ID,
    templateId: parseInt(TEMPLATE_ID),
    datas: [code, '5'] // 模板变量：$1$为验证码，$2$为有效期（分钟）
  }

  options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body))

  try {
    const result = await httpsRequest(options, body)
    console.log(`[SMS] 发送至 ${phone}，响应:`, JSON.stringify(result))

    if (result.statusCode === '000000') {
      return { success: true, message: '短信发送成功' }
    } else {
      return { success: false, message: result.statusMsg || '短信发送失败' }
    }
  } catch (err) {
    console.error('[SMS] 发送异常:', err.message)
    return { success: false, message: '短信服务异常: ' + err.message }
  }
}

module.exports = { sendVerifyCode }
