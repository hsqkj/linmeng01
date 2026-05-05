/**
 * 小程序 Token 验证接口
 * 场景A：小程序 webview 传 token，验证后建立 H5 会话
 */
const express = require('express')
const router = express.Router()
const db = require('../config/db')

/**
 * POST /api/auth/mini-login
 * 验证小程序传来的 token，返回用户信息并生成 H5 token
 */
router.post('/mini-login', async (req, res) => {
  try {
    const { token, userType } = req.body

    if (!token) {
      return res.json({ code: 400, msg: 'token不能为空' })
    }

    // 简单验证：解码 base64 token 获取用户类型和 ID
    // 格式：base64(openid/userId:userType:expire)
    let openid = ''
    let dbUserId = ''
    let dbUserType = userType || 'community'

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8')
      const parts = decoded.split(':')
      if (parts.length >= 2) {
        openid = parts[0]
        // 如果没有 userType 参数，尝试从 token 中获取
        if (!userType && parts.length >= 2) {
          dbUserType = parts[1]
        }
      }
    } catch (e) {
      return res.json({ code: 401, msg: 'token格式无效' })
    }

    // 根据 userType 查询用户表
    let user = null
    let tableName = ''
    let idField = ''

    switch (dbUserType) {
      case 'community':
        tableName = 'communities'
        idField = 'id'
        break
      case 'merchant':
        tableName = 'merchants'
        idField = 'id'
        break
      case 'ambassador':
        tableName = 'ambassadors'
        idField = 'id'
        break
      default:
        return res.json({ code: 400, msg: '用户类型无效' })
    }

    // 查询用户（通过 openid 或 id）
    // 如果 token 中包含的是 openid，查询 openid 字段
    // 如果包含的是 id，直接用 id 查询
    let sql = `SELECT id, name, nickname, phone, avatar, openid FROM ${tableName} WHERE `
    let params = []

    // 尝试按 openid 查
    if (openid) {
      sql += 'openid = ? LIMIT 1'
      params.push(openid)
    } else {
      // 如果没有 openid 信息，返回失败
      return res.json({ code: 401, msg: '无法识别用户身份' })
    }

    const [rows] = await db.query(sql, params)

    if (rows.length === 0) {
      return res.json({ code: 401, msg: '用户不存在，请先在小程序登录' })
    }

    user = rows[0]

    // 生成新的 H5 token（格式：base64(userId:userType:timestamp)）
    const h5Token = Buffer.from(`${user.id}:${dbUserType}:${Date.now()}`).toString('base64')

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
