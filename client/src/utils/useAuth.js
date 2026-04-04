import { ElMessageBox } from 'element-plus'

// 游客操作时提示登录/注册
export function requireAuth(role = 'community') {
  const loginPaths = {
    community: '/login/community',
    merchant: '/login/merchant',
    ambassador: '/login/ambassador'
  }
  const loginTitle = {
    community: '社区用户',
    merchant: '商家用户',
    ambassador: '招商大使'
  }

  return ElMessageBox.confirm(
    '此操作需要登录后才能进行。是否前往登录？',
    '提示',
    {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning',
      title: '请先登录'
    }
  ).then(() => {
    window.location.href = loginPaths[role] || '/login/community'
  }).catch(() => {})
}

// 检查是否已登录
export function isLoggedIn(role = 'community') {
  const tokenKeys = {
    community: 'community_token',
    merchant: 'merchant_token',
    ambassador: 'ambassador_token',
    admin: 'admin_token'
  }
  return !!localStorage.getItem(tokenKeys[role])
}

// 获取当前用户信息
export function getUserInfo(role = 'community') {
  const infoKeys = {
    community: 'community_info',
    merchant: 'merchant_info',
    ambassador: 'ambassador_info',
    admin: 'admin_info'
  }
  const info = localStorage.getItem(infoKeys[role])
  return info ? JSON.parse(info) : null
}

// 检查资料是否完整
export function isProfileComplete(profile, role = 'community') {
  if (!profile) return false
  if (role === 'community') {
    // 社区：检查关键字段
    return !!(profile.community_name && profile.real_name && profile.phone)
  }
  if (role === 'merchant') {
    // 商家：检查关键字段
    return !!(profile.company_name && profile.contact_name && profile.phone)
  }
  return false
}
