/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')
const pool = require('../config/db')

// 验证Token
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret)
  } catch (error) {
    return null
  }
}

// 管理员认证
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
  
  if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
    return res.status(403).json({ code: 403, message: '无权限访问' })
  }
  
  req.admin = decoded
  next()
}

// 社区用户认证（兼容新旧token：当userId缺失时通过phone查库）
async function authCommunity(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
  
  if (decoded.role !== 'community') {
    return res.status(403).json({ code: 403, message: '无权限访问' })
  }
  
  // 兼容新旧token：如果userId不存在，通过phone查库获取用户ID
  let userId = decoded.userId
  if (!userId && decoded.phone) {
    try {
      const [rows] = await pool.query(
        'SELECT id FROM communities WHERE phone = ? AND status = 1 LIMIT 1',
        [decoded.phone]
      )
      if (rows.length > 0) {
        userId = rows[0].id
      }
    } catch (err) {
      console.error('[authCommunity] 查库失败:', err.message)
    }
  }
  
  req.community = { ...decoded, userId: userId, id: userId }
  next()
}

// 商家用户认证（兼容新旧token：当userId缺失时通过phone查库）
async function authMerchant(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
  
  if (decoded.role !== 'merchant') {
    return res.status(403).json({ code: 403, message: '无权限访问' })
  }
  
  // 兼容新旧token：如果userId不存在，通过phone查库获取用户ID
  let userId = decoded.userId
  if (!userId && decoded.phone) {
    try {
      const [rows] = await pool.query(
        'SELECT id FROM merchants WHERE phone = ? AND status = 1 LIMIT 1',
        [decoded.phone]
      )
      if (rows.length > 0) {
        userId = rows[0].id
      }
    } catch (err) {
      console.error('[authMerchant] 查库失败:', err.message)
    }
  }
  
  req.merchant = { ...decoded, userId: userId, id: userId }
  next()
}

// 招商大使认证（兼容新旧token：当userId缺失时通过phone查库）
async function authAmbassador(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
  
  if (decoded.role !== 'ambassador') {
    return res.status(403).json({ code: 403, message: '无权限访问' })
  }
  
  // 兼容新旧token：如果userId不存在，通过phone查库获取用户ID
  let userId = decoded.userId
  if (!userId && decoded.phone) {
    try {
      const [rows] = await pool.query(
        'SELECT id FROM ambassadors WHERE phone = ? AND status = 1 LIMIT 1',
        [decoded.phone]
      )
      if (rows.length > 0) {
        userId = rows[0].id
      }
    } catch (err) {
      console.error('[authAmbassador] 查库失败:', err.message)
    }
  }
  
  req.ambassador = { ...decoded, userId: userId, id: userId }
  next()
}

module.exports = {
  authAdmin,
  authCommunity,
  authMerchant,
  authAmbassador,
  verifyToken
}
