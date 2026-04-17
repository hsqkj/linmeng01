/**
 * 社区端 API
 */
import request from '@/utils/request'

// ====== 认证 ======
export const communityLogin = (data) => request.post('/community/login', data)
export const communityRegister = (data) => request.post('/community/register', data)

// ====== 公共信息 ======
export const getBanners = (params) => request.get('/public/banners', { params })
export const getConfig = () => request.get('/community/config')

// ====== 首页 ======
export const getRecommendResources = (params) => request.get('/community/recommend/resources', { params })

// ====== 资源大厅 ======
export const getResources = (params) => request.get('/community/resources', { params })
export const getResourceDetail = (id) => request.get(`/community/resources/${id}`, { role: 'community' })

// ====== 需求大厅 ======
export const getDemands = (params) => request.get('/community/demands', { params })
export const getDemandDetail = (id) => request.get(`/community/demands/${id}`)

// ====== 商家详情（防飞单） ======
export const getMerchantDetail = (id) => request.get(`/community/merchants/${id}`)

// ====== 需求管理 ======
export const getMyDemands = (params) => request.get('/community/my/demands', { params })
export const createDemand = (data) => request.post('/community/demands', data)
export const updateDemand = (id, data) => request.put(`/community/demands/${id}`, data)
export const deleteDemand = (id) => request.delete(`/community/demands/${id}`)
export const importDemands = (data) => request.post('/community/demands/import', data)
export const downloadTemplate = () => request.get('/community/demands/template', { responseType: 'blob' })

// ====== 需求草稿 ======
export const getMyDrafts = () => request.get('/community/drafts')
export const getDraft = (id) => request.get(`/community/drafts/${id}`)
export const saveDraft = (data) => request.post('/community/drafts', data)
export const deleteDraft = (id) => request.delete(`/community/drafts/${id}`)

// ====== 对接管理 ======
export const getMyIntentions = (params) => request.get('/community/my/intentions', { params })
export const acceptIntention = (id) => request.put(`/community/intentions/${id}/accept`)
export const rejectIntention = (id, data) => request.put(`/community/intentions/${id}/reject`, data)

// ====== 留言 ======
export const getDemandComments = (id) => request.get(`/community/comments/demand/${id}`)
export const createDemandComment = (id, data) => request.post(`/community/comments/demand/${id}`, data)
export const getResourceComments = (id) => request.get(`/community/comments/resource/${id}`)
export const createResourceComment = (id, data) => request.post(`/community/comments/resource/${id}`, data)
export const replyComment = (id, data) => request.post(`/community/comments/${id}/reply`, data)

// ====== 个人中心 ======
export const getProfile = () => request.get('/community/profile')
export const updateProfile = (data) => request.put('/community/profile', data)
export const updatePassword = (data) => request.put('/community/password', data)

// ====== 小区管理 ======
export const saveCompounds = (data) => request.put('/community/compounds', data)

// ====== 场地空间管理 ======
export const saveSpaces = (data) => request.put('/community/spaces', data)

// ====== 奖励明细 ======
export const getRewards = (params) => request.get('/community/rewards', { params })
export const claimReward = (data) => request.put('/community/rewards/claim', data)

// ====== 我的留言（留言咨询） ======
export const getMyComments = () => request.get('/community/my/comments')

// ====== 收藏资源 ======
export const toggleFavorite = (data) => request.post('/community/favorites/toggle', data)
export const getMyFavorites = (params) => request.get('/community/favorites', { params })

// ====== 系统通知 ======
export const getMyNotifications = (params) => request.get('/community/notifications', { params })
export const getUnreadCount = () => request.get('/community/notifications/unread-count')
export const markNotificationsRead = () => request.post('/community/notifications/mark-read')
export const markOneNotificationRead = (id) => request.put(`/community/notifications/${id}/read`)

// ====== 公共配置 ======
export const getPublishTypes = () => request.get('/public/publish-types')

// ====== 平台统计 ======
export const getPlatformStats = () => request.get('/public/stats')
