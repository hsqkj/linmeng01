/**
 * 微信相关路由
 * 包含小程序登录 + H5网页授权登录
 */
const express = require('express')
const router = express.Router()
const axios = require('axios')
const db = require('../config/db')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')

// ============ 配置 ============
const MINI_APPID = 'wx0d8ceb64dd56ca6c'
const MINI_SECRET = 'a19d2847da434ad33f64103919644dee'
const PUBLIC_APPID = 'wxa382e1c9fb93780e'       // 微信公众号 AppID
const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）

// ============ 工具函数 ============
// 生成 H5 登录 token（JWT，与 auth.js 中间件兼容）
function generateToken(openid, userId, userType) {
  return jwt.sign(
    { openid, userId, role: userType },
    jwtConfig.secret,
    { expiresIn: '7d' }
  )
}

// 验证 H5 登录 token（JWT）
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret)
  } catch {
    return null
  }
}

// ============ 小程序登录（原有功能） ============

/**
 * 微信小程序登录 - code 换取 openid
 * POST /api/wechat/code2session
 */
router.post('/code2session', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.json({ code: 400, msg: 'code不能为空' })

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${MINI_APPID}&secret=${MINI_SECRET}&js_code=${code}&grant_type=authorization_code`
    const wxRes = await axios.get(url)
    const { openid, session_key, unionid, errcode, errmsg } = wxRes.data

    if (errcode) {
      console.error('微信接口错误:', errcode, errmsg)
      return res.json({ code: 500, msg: errmsg || '微信接口错误' })
    }

    res.json({ code: 0, data: { openid, session_key, unionid } })
  } catch (error) {
    console.error('微信登录失败:', error)
    res.json({ code: 500, msg: '服务器错误' })
  }
})

/**
 * 微信手机号绑定（小程序）
 * POST /api/wechat/bindPhone
 */
router.post('/bindPhone', async (req, res) => {
  try {
    const { code, openid, type } = req.body
    const token = generateToken(openid, 0, type || 'community')

    if (type === 'community') {
      await db.query(
        `UPDATE communities SET openid = ?, update_time = NOW() WHERE openid = ? OR phone = (SELECT phone FROM (SELECT phone FROM communities WHERE openid = ?) AS t)`,
        [openid, openid, openid]
      )
    } else if (type === 'merchant') {
      await db.query('UPDATE merchants SET openid = ? WHERE openid = ?', [openid, openid])
    } else if (type === 'ambassador') {
      await db.query('UPDATE ambassadors SET openid = ? WHERE openid = ?', [openid, openid])
    }

    res.json({ code: 0, data: { token, openid } })
  } catch (error) {
    console.error('绑定手机号失败:', error)
    res.json({ code: 500, msg: '绑定失败' })
  }
})

/**
 * 解码手机号（小程序）
 * POST /api/wechat/decodePhone
 */
router.post('/decodePhone', async (req, res) => {
  try {
    const { code, openid } = req.body
    const token = generateToken(openid, 0, 'community')
    res.json({ code: 0, data: { token, phone: '' } })
  } catch (error) {
    console.error('解码手机号失败:', error)
    res.json({ code: 500, msg: '解码失败' })
  }
})

// ============ 微信公众号网页授权（H5登录） ============

/**
 * H5 微信授权 - 获取微信用户信息并自动登录
 * POST /api/wechat/h5-auth
 * Body: { code, userType? }
 * 
 * 流程：
 * 1. 用 code 换 openid + unionid（微信公众号网页授权）
 * 2. 查 wechat_user_bind 表，找到绑定的账号
 * 3. 如果已绑定，直接返回登录 token
 * 4. 如果未绑定，返回 openid/unionid，前端引导用户绑定手机号
 */
router.post('/h5-auth', async (req, res) => {
  try {
    const { code, userType } = req.body
    if (!code) return res.json({ code: 400, msg: 'code不能为空' })

    // 1. 用 code 换 access_token + openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${PUBLIC_APPID}&secret=${PUBLIC_SECRET}&code=${code}&grant_type=authorization_code`
    const tokenRes = await axios.get(tokenUrl)

    if (tokenRes.data.errcode) {
      console.error('微信网页授权错误:', tokenRes.data)
      return res.json({ code: 500, msg: tokenRes.data.errmsg || '微信授权失败' })
    }

    const { openid, unionid, access_token } = tokenRes.data

    // 2. 获取用户信息（可选，获取昵称头像）
    let nickname = '', avatar = ''
    try {
      const userRes = await axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`)
      if (!userRes.data.errcode) {
        nickname = userRes.data.nickname || ''
        avatar = userRes.data.headimgurl || ''
      }
    } catch (e) {
      // 获取用户信息失败不影响登录流程
    }

    // 3. 查找绑定关系
    const [bindRows] = await db.query(
      'SELECT user_type, user_id, phone FROM wechat_user_bind WHERE openid = ? OR unionid = ? LIMIT 1',
      [openid, unionid || '']
    )

    if (bindRows.length > 0) {
      // 已绑定：直接登录
      const bind = bindRows[0]
      const token = generateToken(openid, bind.user_id, bind.user_type)

      // 获取用户基本信息
      let userName = '', phone = bind.phone || ''
      if (bind.user_type === 'community') {
        const [rows] = await db.query('SELECT username, real_name, phone FROM communities WHERE id = ?', [bind.user_id])
        if (rows.length > 0) { userName = rows[0].real_name || rows[0].username; phone = rows[0].phone || phone }
      } else if (bind.user_type === 'merchant') {
        const [rows] = await db.query('SELECT username, company_name, contact_name, phone FROM merchants WHERE id = ?', [bind.user_id])
        if (rows.length > 0) { userName = rows[0].company_name || rows[0].contact_name || rows[0].username; phone = rows[0].phone || phone }
      } else if (bind.user_type === 'ambassador') {
        const [rows] = await db.query('SELECT username, real_name, phone FROM ambassadors WHERE id = ?', [bind.user_id])
        if (rows.length > 0) { userName = rows[0].real_name || rows[0].username; phone = rows[0].phone || phone }
      }

      res.json({
        code: 0,
        data: {
          isNew: false,
          token,
          userType: bind.user_type,
          userId: bind.user_id,
          userName,
          phone,
          openid,
          nickname,
          avatar
        }
      })
    } else {
      // 未绑定：返回 openid/unionid，前端引导绑定
      res.json({
        code: 0,
        data: {
          isNew: true,
          openid,
          unionid: unionid || '',
          nickname,
          avatar,
          // 如果微信返回了 unionid，尝试用 unionid 查找是否有小程序端已绑定的账号
          suggestBindPhone: true
        }
      })
    }
  } catch (error) {
    console.error('H5微信授权失败:', error)
    res.json({ code: 500, msg: '微信授权失败' })
  }
})

/**
 * H5 微信授权 - 绑定手机号（新用户或换绑）
 * POST /api/wechat/h5-bind-phone
 * Body: { openid, unionid, phone, code, userType }
 */
router.post('/h5-bind-phone', async (req, res) => {
  try {
    const { openid, unionid, phone, code, userType } = req.body
    if (!openid || !phone || !userType) {
      return res.json({ code: 400, msg: '参数不完整' })
    }

    // 验证短信验证码（简化：如果是测试账号直接通过）
    const testAccounts = ['18800000001', '18800000002', '18800000003']
    if (!testAccounts.includes(phone)) {
      // TODO: 验证短信验证码
      if (!code) return res.json({ code: 400, msg: '请输入验证码' })
    }

    // 查找对应类型的用户，未注册则自动创建
    let userId = null
    let userName = ''
    if (userType === 'community') {
      const [rows] = await db.query('SELECT id, username, real_name FROM communities WHERE phone = ?', [phone])
      if (rows.length === 0) {
        // 未注册，自动创建社区账号
        const [result] = await db.query(
          'INSERT INTO communities (username, real_name, phone, password, status, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
          [phone, phone, phone, require('bcryptjs').hashSync(phone.slice(-6), 10)]
        )
        userId = result.insertId
        userName = phone
      } else {
        userId = rows[0].id
        userName = rows[0].real_name || rows[0].username
      }
    } else if (userType === 'merchant') {
      const [rows] = await db.query('SELECT id, username, company_name, contact_name FROM merchants WHERE phone = ?', [phone])
      if (rows.length === 0) {
        const [result] = await db.query(
          'INSERT INTO merchants (username, company_name, contact_name, phone, password, status, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
          [phone, phone, phone, phone, require('bcryptjs').hashSync(phone.slice(-6), 10)]
        )
        userId = result.insertId
        userName = phone
      } else {
        userId = rows[0].id
        userName = rows[0].company_name || rows[0].contact_name || rows[0].username
      }
    } else if (userType === 'ambassador') {
      const [rows] = await db.query('SELECT id, username, real_name FROM ambassadors WHERE phone = ?', [phone])
      if (rows.length === 0) {
        const qrCode = `LM${Date.now().toString(36).toUpperCase()}`
        const [result] = await db.query(
          'INSERT INTO ambassadors (username, real_name, phone, password, qr_code, status, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
          [phone, phone, phone, require('bcryptjs').hashSync(phone.slice(-6), 10), qrCode]
        )
        userId = result.insertId
        userName = phone
      } else {
        userId = rows[0].id
        userName = rows[0].real_name || rows[0].username
      }
    }

    // 绑定到 wechat_user_bind 表
    // 先删旧的 openid 绑定
    await db.query('DELETE FROM wechat_user_bind WHERE openid = ?', [openid])

    await db.query(
      'INSERT INTO wechat_user_bind (unionid, openid, user_type, user_id, phone) VALUES (?, ?, ?, ?, ?)',
      [unionid || '', openid, userType, userId, phone]
    )

    const token = generateToken(openid, userId, userType)

    res.json({
      code: 0,
      data: {
        token,
        userType,
        userId,
        userName,
        phone,
        openid
      }
    })
  } catch (error) {
    console.error('绑定手机号失败:', error)
    res.json({ code: 500, msg: '绑定失败' })
  }
})

// ============ Access Token & JS-SDK（原有功能） ============

/**
 * 获取微信 Access Token（用于分享等）
 * GET /api/wechat/accessToken
 */
router.get('/accessToken', async (req, res) => {
  try {
    const [tokens] = await db.query(
      'SELECT access_token, expires_at FROM wechat_tokens WHERE appid = ? ORDER BY id DESC LIMIT 1',
      [MINI_APPID]
    )

    if (tokens.length > 0 && new Date(tokens[0].expires_at) > new Date()) {
      return res.json({ code: 0, data: { access_token: tokens[0].access_token } })
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${MINI_APPID}&secret=${MINI_SECRET}`
    const wxRes = await axios.get(url)

    if (wxRes.data.access_token) {
      const expiresAt = new Date(Date.now() + wxRes.data.expires_in * 1000 - 300000)
      await db.query(
        'INSERT INTO wechat_tokens (appid, access_token, expires_at) VALUES (?, ?, ?)',
        [MINI_APPID, wxRes.data.access_token, expiresAt]
      )
      res.json({ code: 0, data: { access_token: wxRes.data.access_token } })
    } else {
      res.json({ code: 500, msg: '获取token失败' })
    }
  } catch (error) {
    console.error('获取access_token失败:', error)
    res.json({ code: 500, msg: '服务器错误' })
  }
})

/**
 * 获取微信 JS SDK 配置
 * GET /api/wechat/jssdk-config
 */
router.get('/jssdk-config', async (req, res) => {
  try {
    const { url } = req.query

    const [tokens] = await db.query(
      'SELECT access_token FROM wechat_tokens WHERE appid = ? ORDER BY id DESC LIMIT 1',
      [MINI_APPID]
    )

    if (tokens.length === 0) {
      return res.json({ code: 500, msg: '未配置access_token' })
    }

    const ticketUrl = `https://api.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${tokens[0].access_token}`
    const ticketRes = await axios.get(ticketUrl)

    if (!ticketRes.data.ticket) {
      return res.json({ code: 500, msg: '获取ticket失败' })
    }

    const ticket = ticketRes.data.ticket
    const timestamp = Math.floor(Date.now() / 1000)
    const noncestr = Math.random().toString(36).substring(2)

    const signature = crypto
      .createHash('sha1')
      .update(`jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`)
      .digest('hex')

    res.json({
      code: 0,
      data: {
        appId: MINI_APPID,
        timestamp,
        nonceStr: noncestr,
        signature
      }
    })
  } catch (error) {
    console.error('获取jssdk配置失败:', error)
    res.json({ code: 500, msg: '服务器错误' })
  }
})

module.exports = router
