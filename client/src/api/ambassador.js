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

// ====== 提成明细 ======
export const getCommission = (params) => request.get('/ambassador/commission', { params })
export const getCommissionSummary = () => request.get('/ambassador/commission/summary')

// ====== 提现管理 ======
export const getWithdrawAccount = () => request.get('/ambassador/withdraw')
export const setWithdrawAccount = (data) => request.post('/ambassador/withdraw/account', data)
export const applyWithdraw = (data) => request.post('/ambassador/withdraw/apply', data)
export const getWithdrawHistory = () => request.get('/ambassador/withdraw/history')
