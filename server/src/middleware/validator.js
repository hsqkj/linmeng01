/**
 * 参数验证中间件
 */

const { validationResult } = require('express-validator')

// 验证请求参数
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数错误',
      errors: errors.array()
    })
  }
  next()
}

module.exports = { validate }
