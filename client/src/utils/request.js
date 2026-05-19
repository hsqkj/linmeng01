/**
 * 统一 HTTP 请求封装（axios）
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// token 映射表
const TOKEN_KEYS = {
  admin: 'admin_token',
  community: 'community_token',
  merchant: 'merchant_token',
  ambassador: 'ambassador_token'
}

// 从 localStorage 获取对应角色的 token
function getToken(role) {
  if (role && TOKEN_KEYS[role]) {
    return localStorage.getItem(TOKEN_KEYS[role]) || ''
  }
  // 未指定角色时返回空（公开接口不需要 token）
  return ''
}

// 请求拦截器 - 自动附加 token
request.interceptors.request.use(
  (config) => {
    // 优先使用 config 上的 role，否则尝试从 URL 路径推断
    const role = config.role ||
      (config.url?.startsWith('/admin/') ? 'admin' :
       config.url?.startsWith('/community/') ? 'community' :
       config.url?.startsWith('/merchant/') ? 'merchant' :
       config.url?.startsWith('/ambassador/') ? 'ambassador' : null)

    const token = getToken(role)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 统一处理错误
request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code === 0 || data.code === 200) {
      return data
    }
    // 业务错误
    ElMessage.error(data.message || data.msg || '操作失败')
    return Promise.reject(new Error(data.message || '操作失败'))
  },
  (error) => {
    const status = error.response?.status
    const apiMessage = error.response?.data?.message || '' // 后端返回的业务错误消息
    const message = apiMessage || error.message

    // 登录接口列表（登录失败时显示后端消息，不跳转）
    const loginPaths = ['/admin/login', '/community/login', '/merchant/login', '/ambassador/login']
    const isLoginPath = loginPaths.some(p => error.config?.url?.includes(p))

    if (status === 401 || status === 403) {
      const path = error.config?.url || ''
      let role = null
      if (path.startsWith('/admin/')) role = 'admin_token'
      else if (path.startsWith('/community/')) role = 'community_token'
      else if (path.startsWith('/merchant/')) role = 'merchant_token'
      else if (path.startsWith('/ambassador/')) role = 'ambassador_token'

      const token = role ? localStorage.getItem(role) : null
      
      // 公开接口列表（不需要登录的接口）
      const publicPaths = ['/banners', '/config', '/recommend/', '/resources', '/demands', '/comments/', '/merchants', '/tags']
      const isPublicPath = publicPaths.some(p => path.includes(p))

      // 登录接口：不显示消息，只reject，让组件的catch块处理显示
      if (isLoginPath) {
        return Promise.reject(new Error(apiMessage || '登录失败'))
      }

      // 有token但过期才提示"登录已过期"
      if (token) {
        if (role) localStorage.removeItem(role)
        if (!isPublicPath) {
          ElMessage.error(status === 401 ? '登录已过期，请重新登录' : '无权限访问')
        }
      }
      // 无token时不提示，直接跳转（未登录用户点击需要登录的链接）

      // 跳转登录页
      const currentPath = window.location.pathname
      // 首页路径允许未登录访问，即使 API 返回 401 也不跳转
      const homePaths = ['/merchant', '/community', '/ambassador']
      const isAtHome = homePaths.some(p => currentPath === p || currentPath.startsWith(p + '/'))
      if (isAtHome) return // 首页不跳转登录页，让用户继续浏览

      if (currentPath.startsWith('/admin')) window.location.href = '/admin/login'
      else if (currentPath.startsWith('/merchant')) window.location.href = '/login/merchant'
      else if (currentPath.startsWith('/community')) window.location.href = '/login/community'
      else if (currentPath.startsWith('/ambassador')) window.location.href = '/login/ambassador'
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else {
      ElMessage.error(message || '网络错误')
    }

    return Promise.reject(error)
  }
)

export default request
