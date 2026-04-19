/**
 * API 统一封装
 * 支持所有角色：社区用户、商家、招商大使
 */

const apiBase = require('../config/api.config.js')

/**
 * 通用请求方法
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    
    wx.request({
      url: `${apiBase.apiBase}${url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: res => {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data)
          } else if (res.data.code === 401) {
            // token过期
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
            getApp().globalData.isLoggedIn = false
            reject({ needLogin: true, message: res.data.msg })
          } else {
            reject({ code: res.data.code, message: res.data.msg })
          }
        } else {
          reject({ code: res.statusCode, message: '网络请求失败' })
        }
      },
      fail: err => {
        reject({ code: -1, message: '网络连接失败' })
      }
    })
  })
}

// ============ 公共API ============

/**
 * 获取首页数据
 */
function getHomeData(role) {
  return request(`/public/home/${role}`)
}

/**
 * 获取配置信息
 */
function getConfig() {
  return request('/public/config')
}

/**
 * 获取Banner
 */
function getBanners(position) {
  return request('/public/banners', { data: { position } })
}

// ============ 微信相关 ============

/**
 * 微信登录（code换openid）
 */
function wechatCode2Session(code) {
  return request('/wechat/code2session', {
    method: 'POST',
    data: { code }
  })
}

/**
 * 解码手机号
 */
function decodePhone(code, openid) {
  return request('/wechat/decodePhone', {
    method: 'POST',
    data: { code, openid }
  })
}

// ============ 商家端API ============

const merchantAPI = {
  // 登录注册
  login: (phone, code) => 
    request('/merchant/login', { method: 'POST', data: { phone, code } }),
  
  register: (data) => 
    request('/merchant/register', { method: 'POST', data }),
  
  // 首页数据
  getHomeData: () => request('/merchant/home'),
  
  // 商家资料
  getProfile: () => request('/merchant/profile'),
  updateProfile: (data) => request('/merchant/profile', { method: 'PUT', data }),
  updatePassword: (oldPwd, newPwd) => 
    request('/merchant/password', { method: 'PUT', data: { oldPassword: oldPwd, newPassword: newPwd } }),
  
  // 资源管理
  getMyResources: (params) => request('/merchant/my/resources', { data: params }),
  createResource: (data) => request('/merchant/resources', { method: 'POST', data }),
  updateResource: (id, data) => request(`/merchant/resources/${id}`, { method: 'PUT', data }),
  deleteResource: (id) => request(`/merchant/resources/${id}`, { method: 'DELETE' }),
  
  // 需求大厅
  getDemands: (params) => request('/merchant/demands', { data: params }),
  getDemandDetail: (id) => request(`/merchant/demands/${id}`),
  getDemandComments: (id) => request(`/merchant/comments/demand/${id}`),
  createDemandComment: (id, data) => 
    request(`/merchant/comments/demand/${id}`, { method: 'POST', data }),
  
  // 资源大厅
  getResources: (params) => request('/merchant/resources', { data: params }),
  getResourceDetail: (id) => request(`/merchant/resources/${id}`),
  getResourceComments: (id) => request(`/merchant/comments/resource/${id}`),
  
  // 对接意向
  getMyIntentions: () => request('/merchant/my/intentions'),
  createIntention: (data) => request('/merchant/intentions', { method: 'POST', data }),
  cancelIntention: (id) => request(`/merchant/intentions/${id}`, { method: 'DELETE' }),
  
  // 收藏
  toggleFavorite: (type, id) => 
    request('/merchant/favorites/toggle', { method: 'POST', data: { type, id } }),
  getMyFavorites: () => request('/merchant/favorites'),
  
  // 会员中心
  getMemberInfo: () => request('/merchant/member'),
  getMemberLevels: () => request('/merchant/member/levels'),
  upgradeMember: (levelId) => 
    request('/merchant/member/upgrade', { method: 'POST', data: { levelId } }),
  getPaymentHistory: () => request('/merchant/member/payments'),
  
  // 订单管理
  getOrders: (params) => request('/merchant/orders', { data: params }),
  getOrderDetail: (id) => request(`/merchant/orders/${id}`),
  updateOrderStatus: (id, status) => 
    request(`/merchant/orders/${id}/status`, { method: 'PUT', data: { status } }),
  
  // 收益管理
  getIncome: () => request('/merchant/income'),
  getIncomeRecords: (params) => request('/merchant/income/records', { data: params }),
  getMemberExpiry: () => request('/merchant/member/expiry'),
  
  // 通知
  getNotifications: () => request('/merchant/notifications'),
  getUnreadCount: () => request('/merchant/notifications/unread-count'),
  markNotificationsRead: () => 
    request('/merchant/notifications/mark-read', { method: 'POST' })
}

// ============ 招商大使端API ============

const ambassadorAPI = {
  // 登录
  login: (phone, code) => 
    request('/ambassador/login', { method: 'POST', data: { phone, code } }),
  
  // 首页数据
  getHomeData: () => request('/ambassador/home'),
  
  // 渠道码
  getQrCode: () => request('/ambassador/qrcode'),
  
  // 发展记录
  getRecords: (params) => request('/ambassador/records', { data: params }),
  
  // 佣金相关
  getCommission: (params) => request('/ambassador/commission', { data: params }),
  getCommissionSummary: () => request('/ambassador/commission/summary'),
  getCommissionConfig: () => request('/ambassador/commission/config'),
  
  // 提现
  getWithdrawAccount: () => request('/ambassador/withdraw'),
  setWithdrawAccount: (data) => 
    request('/ambassador/withdraw/account', { method: 'POST', data }),
  applyWithdraw: (amount) => 
    request('/ambassador/withdraw/apply', { method: 'POST', data: { amount } }),
  getWithdrawHistory: (params) => request('/ambassador/withdraw/history', { data: params }),
  
  // 通知
  getNotifications: () => request('/ambassador/notifications'),
  getUnreadCount: () => request('/ambassador/notifications/unread-count'),
  markNotificationRead: (id) => 
    request(`/ambassador/notifications/${id}/read`, { method: 'PUT' }),
  
  // 个人资料
  getProfile: () => request('/ambassador/profile'),
  updatePassword: (oldPwd, newPwd) => 
    request('/ambassador/password', { method: 'PUT', data: { oldPassword: oldPwd, newPassword: newPwd } })
}

// ============ 社区端API ============

const communityAPI = {
  // 登录注册
  login: (phone, code) => 
    request('/community/login', { method: 'POST', data: { phone, code } }),
  
  // 首页数据
  getHomeData: () => request('/community/home'),
  
  // 资源广场
  getResources: (params) => request('/community/resources', { data: params }),
  getResourceDetail: (id) => request(`/community/resources/${id}`),
  
  // 需求广场
  getDemands: (params) => request('/community/demands', { data: params }),
  getDemandDetail: (id) => request(`/community/demands/${id}`),
  
  // 发布需求
  createDemand: (data) => request('/community/demands', { method: 'POST', data }),
  updateDemand: (id, data) => request(`/community/demands/${id}`, { method: 'PUT', data }),
  
  // 个人中心
  getProfile: () => request('/community/profile'),
  updateProfile: (data) => request('/community/profile', { method: 'PUT', data }),
  
  // 收藏
  toggleFavorite: (type, id) => 
    request('/community/favorites/toggle', { method: 'POST', data: { type, id } }),
  getMyFavorites: () => request('/community/favorites'),
  
  // 社区资料
  getCommunityProfile: () => request('/community/profile'),
  
  // 通知
  getNotifications: () => request('/community/notifications'),
  getUnreadCount: () => request('/community/notifications/unread-count')
}

// ============ 导出 ============

module.exports = {
  // 公共方法
  request,
  getHomeData,
  getConfig,
  getBanners,
  wechatCode2Session,
  decodePhone,
  
  // 各角色API
  merchant: merchantAPI,
  ambassador: ambassadorAPI,
  community: communityAPI
}
