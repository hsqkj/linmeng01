/**
 * 微信小程序 API 控制器
 */
const express = require('express')
const router = express.Router()
const axios = require('axios')
const db = require('../config/db')

// 小程序配置
const MINI_APPID = 'wx0d8ceb64dd56ca6c'
const MINI_SECRET = 'a19d2847da434ad33f64103919644dee'
const PUBLIC_APPID = 'wxa382e1c9fb93780e'

/**
 * 微信登录 - code 换取 openid
 * POST /api/wechat/code2session
 */
router.post('/code2session', async (req, res) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.json({ code: 400, msg: 'code不能为空' })
    }

    // 调用微信接口获取 openid
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${MINI_APPID}&secret=${MINI_SECRET}&js_code=${code}&grant_type=authorization_code`
    
    const wxRes = await axios.get(url)
    const { openid, session_key, unionid, errcode, errmsg } = wxRes.data

    if (errcode) {
      console.error('微信接口错误:', errcode, errmsg)
      return res.json({ code: 500, msg: errmsg || '微信接口错误' })
    }

    res.json({
      code: 0,
      data: { openid, session_key, unionid }
    })
  } catch (error) {
    console.error('微信登录失败:', error)
    res.json({ code: 500, msg: '服务器错误' })
  }
})

/**
 * 微信手机号绑定
 * POST /api/wechat/bindPhone
 */
router.post('/bindPhone', async (req, res) => {
  try {
    const { code, openid, type } = req.body
    
    // 获取手机号（需要微信平台解密，这里简化处理）
    // 实际需要用 session_key 解密 encryptedData
    // 这里假设后端已经解密好了，直接返回 token
    
    // 生成 token（简化版，实际应使用 jwt）
    const token = Buffer.from(`${openid}:${Date.now()}`).toString('base64')
    
    // 根据类型更新用户信息
    if (type === 'community') {
      // 社区用户
      await db.query(
        'UPDATE communities SET openid = ?, update_time = NOW() WHERE openid = ? OR phone = (SELECT phone FROM (SELECT phone FROM communities WHERE openid = ?) AS t)',
        [openid, openid, openid]
      )
    } else if (type === 'merchant') {
      // 商家用户
      await db.query(
        'UPDATE merchants SET openid = ? WHERE openid = ?',
        [openid, openid]
      )
    } else if (type === 'ambassador') {
      // 大使用户
      await db.query(
        'UPDATE ambassadors SET openid = ? WHERE openid = ?',
        [openid, openid]
      )
    }

    res.json({
      code: 0,
      data: { token, openid }
    })
  } catch (error) {
    console.error('绑定手机号失败:', error)
    res.json({ code: 500, msg: '绑定失败' })
  }
})

/**
 * 解码手机号
 * POST /api/wechat/decodePhone
 */
router.post('/decodePhone', async (req, res) => {
  try {
    const { code, openid } = req.body
    
    // 实际项目中需要用 session_key 解密 encryptedData
    // 这里简化处理，返回模拟数据
    // 真实场景请参考微信官方解密流程
    
    const token = Buffer.from(`${openid}:${Date.now()}`).toString('base64')
    
    res.json({
      code: 0,
      data: { token, phone: '' }
    })
  } catch (error) {
    console.error('解码手机号失败:', error)
    res.json({ code: 500, msg: '解码失败' })
  }
})

/**
 * 获取微信 Access Token（用于分享等）
 * GET /api/wechat/accessToken
 */
router.get('/accessToken', async (req, res) => {
  try {
    // 检查缓存
    const [tokens] = await db.query(
      'SELECT access_token, expires_at FROM wechat_tokens WHERE appid = ? ORDER BY id DESC LIMIT 1',
      [MINI_APPID]
    )
    
    if (tokens.length > 0 && new Date(tokens[0].expires_at) > new Date()) {
      return res.json({
        code: 0,
        data: { access_token: tokens[0].access_token }
      })
    }

    // 重新获取
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${MINI_APPID}&secret=${MINI_SECRET}`
    const wxRes = await axios.get(url)
    
    if (wxRes.data.access_token) {
      // 保存到数据库
      const expiresAt = new Date(Date.now() + wxRes.data.expires_in * 1000 - 300000) // 提前5分钟过期
      await db.query(
        'INSERT INTO wechat_tokens (appid, access_token, expires_at) VALUES (?, ?, ?)',
        [MINI_APPID, wxRes.data.access_token, expiresAt]
      )
      
      res.json({
        code: 0,
        data: { access_token: wxRes.data.access_token }
      })
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
 * GET /api/wechat/jssdkconfig
 */
router.get('/jssdkconfig', async (req, res) => {
  try {
    const { url } = req.query
    
    // 获取 access_token
    let accessToken = ''
    const [tokens] = await db.query(
      'SELECT access_token FROM wechat_tokens WHERE appid = ? ORDER BY id DESC LIMIT 1',
      [MINI_APPID]
    )
    
    if (tokens.length > 0) {
      accessToken = tokens[0].access_token
    } else {
      return res.json({ code: 500, msg: '未配置access_token' })
    }

    // 获取 jsapi_ticket
    const ticketUrl = `https://api.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${accessToken}`
    const ticketRes = await axios.get(ticketUrl)
    
    if (!ticketRes.data.ticket) {
      return res.json({ code: 500, msg: '获取ticket失败' })
    }

    const ticket = ticketRes.data.ticket
    const timestamp = Math.floor(Date.now() / 1000)
    const noncestr = Math.random().toString(36).substring(2)
    
    // 签名计算（简化版）
    const signature = require('crypto')
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
