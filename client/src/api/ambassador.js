/**
 * 招商大使端 API
 */
import request from '@/utils/request'

// ====== 认证 ======
export const ambassadorLogin = (data) => request.post('/ambassador/login', data)

// ====== 首页 ======
export const getHomeData = () => request.get('/ambassador/home')

// ====== 渠道码 ======
export const getQrCode = () => request.get('/ambassador/qrcode')

// ====== 发展记录 ======
export const getRecords = (params) => request.get('/ambassador/records', { params })

// ====== 提成 ======
export const getCommission = (params) => request.get('/ambassador/commission', { params })
export const getCommissionSummary = () => request.get('/ambassador/commission/summary')
export const getCommissionConfig = () => request.get('/ambassador/commission/config')

// ====== 提现 ======
export const getWithdrawAccount = () => request.get('/ambassador/withdraw')
export const setWithdrawAccount = (data) => request.post('/ambassador/withdraw/account', data)
export const applyWithdraw = (data) => request.post('/ambassador/withdraw/apply', data)
export const getWithdrawHistory = (params) => request.get('/ambassador/withdraw/history', { params })

// ====== 通知 ======
export const getAmbassadorNotifications = (params) => request.get('/ambassador/notifications', { params })
export const markNotificationRead = (id) => request.put(`/ambassador/notifications/${id}/read`)
export const getAmbassadorUnreadCount = () => request.get('/ambassador/notifications/unread-count')

// ====== 个人资料 ======
export const getAmbassadorProfile = () => request.get('/ambassador/profile')

// ====== 修改密码 ======
export const updateAmbassadorPassword = (data) => request.put('/ambassador/password', data)
