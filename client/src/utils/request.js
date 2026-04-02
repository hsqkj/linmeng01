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

// 从 localStorage 获取 token（支持多端）
function getToken() {
  // 按顺序查找各端 token
  return (
    localStorage.getItem('admin_token') ||
    localStorage.getItem('community_token') ||
    localStorage.getItem('merchant_token') ||
    localStorage.getItem('ambassador_token') ||
    ''
  )
}

// 请求拦截器 - 自动附加 token
request.interceptors.request.use(
  (config) => {
    const token = getToken()
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
    if (data.code === 200) {
      return data
    }
    // 业务错误
    ElMessage.error(data.message || '操作失败')
    return Promise.reject(new Error(data.message || '操作失败'))
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message

    if (status === 401) {
      // Token 过期，清除本地 token 并提示
      localStorage.removeItem('admin_token')
      localStorage.removeItem('community_token')
      localStorage.removeItem('merchant_token')
      localStorage.removeItem('ambassador_token')
      ElMessage.error('登录已过期，请重新登录')
      // 根据当前路由跳转
      const path = window.location.pathname
      if (path.startsWith('/admin')) window.location.href = '/admin/login'
      else if (path.startsWith('/merchant')) window.location.href = '/login/merchant'
      else if (path.startsWith('/community')) window.location.href = '/login/community'
      else if (path.startsWith('/ambassador')) window.location.href = '/login/ambassador'
    } else if (status === 403) {
      ElMessage.error('无权限访问')
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
