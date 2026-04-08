/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')

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

// 社区用户认证
function authCommunity(req, res, next) {
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
  
  req.community = decoded
  next()
}

// 商家用户认证
function authMerchant(req, res, next) {
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
  
  req.merchant = decoded
  next()
}

// 招商大使认证
function authAmbassador(req, res, next) {
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
  
  req.ambassador = decoded
  next()
}

module.exports = {
  authAdmin,
  authCommunity,
  authMerchant,
  authAmbassador,
  verifyToken
}
