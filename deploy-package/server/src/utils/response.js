/**
 * 响应工具函数
 */

// 成功响应
function success(res, data = null, message = '操作成功') {
  return res.json({
    code: 200,
    message,
    data
  })
}

// 分页响应
function pageSuccess(res, list, total, page, pageSize, message = '操作成功') {
  return res.json({
    code: 200,
    message,
    data: {
      list,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
}

// 错误响应
function error(res, message = '操作失败', code = 500) {
  return res.status(code).json({
    code,
    message
  })
}

// 未授权
function unauthorized(res, message = '未授权') {
  return res.status(401).json({
    code: 401,
    message
  })
}

// 禁止访问
function forbidden(res, message = '禁止访问') {
  return res.status(403).json({
    code: 403,
    message
  })
}

// 资源不存在
function notFound(res, message = '资源不存在') {
  return res.status(404).json({
    code: 404,
    message
  })
}

module.exports = {
  success,
  pageSuccess,
  error,
  unauthorized,
  forbidden,
  notFound
}
