/**
 * 商家端 API
 */
import request from '@/utils/request'

// ====== 认证 ======
export const merchantLogin = (data) => request.post('/merchant/login', data)
export const merchantRegister = (data) => request.post('/merchant/register', data)
export const expertRegister = (data) => request.post('/merchant/expert/register', data)

// ====== 公共信息 ======
export const getBanners = (params) => request.get('/public/banners', { params })
export const getConfig = () => request.get('/merchant/config')

// ====== 首页 ======
export const getRecommendDemands = (params) => request.get('/merchant/recommend/demands', { params })

// ====== 需求大厅 ======
export const getDemands = (params) => request.get('/merchant/demands', { params })
export const getDemandDetail = (id) => request.get(`/merchant/demands/${id}`, { role: 'merchant' })

// ====== 收藏需求 ======
export const toggleFavorite = (data) => request.post('/merchant/favorites/toggle', data)
export const getMyFavorites = (params) => request.get('/merchant/favorites', { params })

// ====== 资源大厅 ======
export const getResources = (params) => request.get('/merchant/resources', { params })
export const getResourceDetail = (id) => request.get(`/merchant/resources/${id}`)

// ====== 社区详情（防飞单） ======
export const getCommunityDetail = (id) => request.get(`/merchant/communities/${id}`)

// ====== 资源管理 ======
export const getMyResources = (params) => request.get('/merchant/my/resources', { params })
export const createResource = (data) => request.post('/merchant/resources', data)
export const updateResource = (id, data) => request.put(`/merchant/resources/${id}`, data)
export const deleteResource = (id) => request.delete(`/merchant/resources/${id}`)

// ====== 对接管理 ======
export const getMyIntentions = (params) => request.get('/merchant/my/intentions', { params })
export const createIntention = (data) => request.post('/merchant/intentions', data)
export const cancelIntention = (id) => request.delete(`/merchant/intentions/${id}`)

// ====== 留言 ======
export const getDemandComments = (id) => request.get(`/merchant/comments/demand/${id}`)
export const createDemandComment = (id, data) => request.post(`/merchant/comments/demand/${id}`, data)
export const getResourceComments = (id) => request.get(`/merchant/comments/resource/${id}`)
export const createResourceComment = (id, data) => request.post(`/merchant/comments/resource/${id}`, data)
export const replyComment = (id, data) => request.post(`/merchant/comments/${id}/reply`, data)
export const getCommentReplies = (id) => request.get(`/merchant/comments/${id}/replies`)

// ====== 个人中心 ======
export const getProfile = () => request.get('/merchant/profile')
export const updateProfile = (data) => request.put('/merchant/profile', data)
export const updatePassword = (data) => request.put('/merchant/password', data)

// ====== 会员中心 ======
export const getMemberInfo = () => request.get('/merchant/member')
export const getMemberLevels = () => request.get('/merchant/member/levels')
export const upgradeMember = (data) => request.post('/merchant/member/upgrade', data)
export const getPaymentHistory = () => request.get('/merchant/member/payments')

// ====== 发布页类型配置 ======
export const getPublishTypes = () => request.get('/public/publish-types')

// ====== 专家类型（公开接口）======
export const getExpertTypes = () => request.get('/public/expert-types')

// ====== 系统通知 ======
export const getMyNotifications = (params) => request.get('/merchant/notifications', { params })
export const getUnreadCount = () => request.get('/merchant/notifications/unread-count')
export const markNotificationsRead = () => request.post('/merchant/notifications/mark-read')
export const markOneNotificationRead = (id) => request.put(`/merchant/notifications/${id}/read`)

// ====== 位置服务 ======
export const saveLocation = (data) => request.post('/merchant/location', data)
