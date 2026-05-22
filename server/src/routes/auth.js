/**
 * SSO 单点登录接口
 * 场景：益邻邻小程序通过 WebView 跳转邻盟 H5，自动完成登录
 *
 * 支持两种调用方式：
 *   GET  - WebView 直接访问，Set-Cookie 后 302 重定向到 H5 页面
 *   POST - 前端 AJAX 调用，返回 JSON
 */
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')
const db = require('../config/db')

// ============ SSO 单点登录（益邻邻 ↔ 邻盟） ============

/**
 * 共用逻辑：验证 SSO token → 查用户 → 生成邻盟 JWT
 * 返回 { user, h5Token, userType } 或 null（失败时抛错）
 */
async function verifySsoAndCreateSession(openidHint, userTypeHint) {
  const ssoSecret = process.env.SSO_SHARED_SECRET
  if (!ssoSecret) {
    throw new Error('SSO_SHARED_SECRET 未配置')
  }

  const dbUserType = userTypeHint || 'community'
  const validTypes = {
    community: { table: 'communities', nameField: 'real_name' },
    merchant: { table: 'merchants', nameField: 'company_name' },
    ambassador: { table: 'ambassadors', nameField: 'real_name' }
  }
  const config = validTypes[dbUserType]
  if (!config) throw new Error('用户类型无效')

  const [rows] = await db.pool.query(
    `SELECT id, ${config.nameField} AS display_name, phone, openid FROM ${config.table} WHERE openid = ? LIMIT 1`,
    [openidHint]
  )

  let user
  if (rows.length === 0) {
    // 用户不存在，自动创建（SSO 场景，从益邻邻跳过来的用户免注册）
    const bcrypt = require('bcryptjs')
    const [result] = await db.pool.query(
      `INSERT INTO ${config.table} (username, real_name, phone, password, openid, status, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [openidHint, '益邻邻用户', '', bcrypt.hashSync('sso_' + Date.now(), 10), openidHint]
    )
    user = { id: result.insertId, display_name: '益邻邻用户', phone: '', openid: openidHint }
    console.log(`[SSO] 自动创建用户: userId=${user.id}, type=${dbUserType}`)
  } else {
    user = rows[0]
  }
  const h5Token = jwt.sign(
    { openid: openidHint, id: user.id, userId: user.id, role: dbUserType, phone: user.phone || '' },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn || '7d' }
  )

  console.log(`[SSO] 登录成功: userId=${user.id}, type=${dbUserType}`)
  return {
    user,
    h5Token,
    userType: dbUserType,
    userName: user.display_name || '用户'
  }
}

/**
 * GET /api/auth/sso-login  —— WebView 直接访问（推荐）
 *
 * URL 参数：
 *   token     (必填) SSO token（由益邻邻后端生成）
 *   userType  (可选) community | merchant | ambassador，默认 community
 *   redirect  (可选) 登录后跳转路径，如 /community/resources
 *
 * 流程：验证 SSO token → 生成邻盟 JWT → Set-Cookie → 302 重定向到 H5 页面
 */
router.get('/sso-login', async (req, res) => {
  try {
    const { token, userType, redirect } = req.query
    if (!token) {
      return res.status(400).send('token 不能为空')
    }

    // 验证 SSO token
    const ssoSecret = process.env.SSO_SHARED_SECRET
    if (!ssoSecret) {
      console.error('[SSO] SSO_SHARED_SECRET 未配置')
      return res.status(500).send('SSO 未配置')
    }

    let decoded
    try {
      decoded = jwt.verify(token, ssoSecret, { maxAge: '5m' })
    } catch (e) {
      console.warn('[SSO] token 验证失败:', e.message)
      return res.status(401).send('SSO token 无效或已过期')
    }

    if (!decoded.openid) {
      return res.status(401).send('token 中缺少 openid')
    }

    const effectiveUserType = userType || decoded.userType || 'community'
    const result = await verifySsoAndCreateSession(decoded.openid, effectiveUserType)

    // Set-Cookie（7 天有效期）—— 同时用于普通浏览器兜底
    const cookieName = `${result.userType}_token`
    const maxAge = 7 * 24 * 3600
    res.cookie(cookieName, result.h5Token, {
      path: '/',
      maxAge,
      httpOnly: false,
      sameSite: 'lax'
    })
    res.cookie('sso_user_type', result.userType, { path: '/', maxAge, httpOnly: false, sameSite: 'lax' })

    // WebView 中 302 重定向可能导致 cookie 丢失，改用 HTML 自动跳转页
    // 在页面中直接写入 localStorage，确保 token 一定可用
    const redirectPath = redirect || `/${result.userType}`
    const targetUrl = `https://3qall.com/#${redirectPath}`
    console.log(`[SSO] 返回自动跳转页 → ${targetUrl}`)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>正在跳转...</title>
  <style>body{font-family:system-ui;text-align:center;padding:40px;color:#666}</style>
</head>
<body>
  <p>正在跳转，请稍候...</p>
  <script>
    (function() {
      try {
        localStorage.setItem('${cookieName}', '${result.h5Token}')
        localStorage.setItem('userType', '${result.userType}')
        // 同时尝试写 cookie（兼容普通浏览器）
        document.cookie = '${cookieName}=${encodeURIComponent(result.h5Token)};path=/;max-age=${maxAge};SameSite=Lax'
        document.cookie = 'sso_user_type=${result.userType};path=/;max-age=${maxAge};SameSite=Lax'
      } catch(e) { console.error('SSO storage error:', e) }
      window.location.replace('${targetUrl}')
    })()
  </script>
</body>
</html>`)
  } catch (error) {
    console.error('[SSO] GET 登录失败:', error.message)
    res.send(`<script>window.location.replace('https://3qall.com/#/wechat-login?sso_error=${encodeURIComponent(error.message)}')</script>`)
  }
})

/**
 * POST /api/auth/sso-login  —— 前端 AJAX 调用
 *
 * 请求体：{ token: <JWT>, userType?: 'community'|'merchant'|'ambassador' }
 * 返回：{ code: 0, data: { token, userType, userId, userName, phone, avatar } }
 */
router.post('/sso-login', async (req, res) => {
  try {
    const { token, userType } = req.body
    if (!token) {
      return res.json({ code: 400, msg: 'token 不能为空' })
    }

    const ssoSecret = process.env.SSO_SHARED_SECRET
    if (!ssoSecret) {
      console.error('[SSO] SSO_SHARED_SECRET 未配置')
      return res.json({ code: 500, msg: 'SSO 未配置' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, ssoSecret, { maxAge: '5m' })
    } catch (e) {
      console.warn('[SSO] token 验证失败:', e.message)
      return res.json({ code: 401, msg: 'SSO token 无效或已过期' })
    }

    if (!decoded.openid) {
      return res.json({ code: 401, msg: 'token 中缺少 openid' })
    }

    const effectiveUserType = userType || decoded.userType || 'community'
    const result = await verifySsoAndCreateSession(decoded.openid, effectiveUserType)

    res.json({
      code: 0,
      data: {
        token: result.h5Token,
        userType: result.userType,
        userId: result.user.id,
        userName: result.userName,
        phone: result.user.phone,
        avatar: result.user.avatar
      }
    })
  } catch (error) {
    console.error('[SSO] POST 登录失败:', error.message)
    const msg = error.message.includes('用户不存在') ? error.message : '服务器错误'
    const code = error.message.includes('用户不存在') ? 404 : 500
    res.json({ code, msg })
  }
})

// ============ 小程序 Token 验证（兼容旧方案） ============

/**
 * POST /api/auth/mini-login
 * 验证小程序传来的 token，返回用户信息并生成 H5 JWT token
 * 兼容旧的 base64 格式和新的 SSO JWT 格式
 */
router.post('/mini-login', async (req, res) => {
  try {
    const { token, userType } = req.body

    if (!token) {
      return res.json({ code: 400, msg: 'token不能为空' })
    }

    let openid = ''
    let dbUserType = userType || 'community'

    // 尝试解析为 JWT（新格式）
    try {
      const ssoSecret = process.env.SSO_SHARED_SECRET
      if (ssoSecret) {
        const decoded = jwt.verify(token, ssoSecret, { maxAge: '5m' })
        if (decoded.openid) {
          openid = decoded.openid
          if (decoded.userType) dbUserType = decoded.userType
        }
      }
    } catch (e) {
      // 不是 JWT，尝试 base64 格式（旧兼容）
    }

    // 旧格式：base64(openid/userId:userType:expire)
    if (!openid) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf8')
        const parts = decoded.split(':')
        if (parts.length >= 2) {
          openid = parts[0]
          if (!userType && parts.length >= 2) {
            dbUserType = parts[1]
          }
        }
      } catch (e) {
        return res.json({ code: 401, msg: 'token格式无效' })
      }
    }

    if (!openid) {
      return res.json({ code: 401, msg: '无法识别用户身份' })
    }

    // 根据 userType 查询用户表
    const validTypes = {
      community: 'communities',
      merchant: 'merchants',
      ambassador: 'ambassadors'
    }
    const tableName = validTypes[dbUserType]
    if (!tableName) {
      return res.json({ code: 400, msg: '用户类型无效' })
    }

    const [rows] = await db.query(
      `SELECT id, name, nickname, phone, avatar, openid FROM ${tableName} WHERE openid = ? LIMIT 1`,
      [openid]
    )

    if (rows.length === 0) {
      return res.json({ code: 401, msg: '用户不存在，请先在邻盟注册' })
    }

    const user = rows[0]

    // 生成邻盟 JWT token（与 auth 中间件兼容）
    const h5Token = jwt.sign(
      {
        openid,
        id: user.id,
        userId: user.id,
        role: dbUserType,
        phone: user.phone || ''
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn || '7d' }
    )

    res.json({
      code: 0,
      data: {
        token: h5Token,
        userType: dbUserType,
        userId: user.id,
        userName: user.nickname || user.name || '用户',
        phone: user.phone,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('小程序 token 验证失败:', error)
    res.json({ code: 500, msg: '服务器错误' })
  }
})

module.exports = router
