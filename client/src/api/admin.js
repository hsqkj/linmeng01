/**
 * 管理后台 API
 */
import request from '@/utils/request'

// ====== 认证 ======
export const adminLogin = (data) => request.post('/admin/login', data)
export const adminLogout = () => { localStorage.removeItem('admin_token') }

// ====== 仪表盘 ======
export const getDashboard = (params) => request.get('/admin/dashboard', { params })

// ====== 社区管理 ======
export const getCommunities = (params) => request.get('/admin/users/communities', { params })
export const getCommunityDetail = (id) => request.get(`/admin/users/communities/${id}`)
export const updateCommunityStatus = (id, data) => request.put(`/admin/users/communities/${id}/status`, data)

// ====== 商家管理 ======
export const getMerchants = (params) => request.get('/admin/users/merchants', { params })
export const getMerchantDetail = (id) => request.get(`/admin/users/merchants/${id}`)
export const updateMerchantStatus = (id, data) => request.put(`/admin/users/merchants/${id}/status`, data)
export const updateMerchantLevel = (id, data) => request.put(`/admin/users/merchants/${id}/level`, data)
export const updateMerchantRating = (id, data) => request.put(`/admin/users/merchants/${id}/rating`, data)

// ====== 大使管理 ======
export const getAmbassadors = (params) => request.get('/admin/users/ambassadors', { params })
export const getAmbassadorDetail = (id) => request.get(`/admin/users/ambassadors/${id}`)
export const updateAmbassadorStatus = (id, data) => request.put(`/admin/users/ambassadors/${id}/status`, data)

// ====== 内容审核 ======
export const getDemandAuditList = (params) => request.get('/admin/audit/demands', { params })
export const passDemand = (id) => request.put(`/admin/audit/demands/${id}/pass`)
export const rejectDemand = (id, data) => request.put(`/admin/audit/demands/${id}/reject`, data)

export const getResourceAuditList = (params) => request.get('/admin/audit/resources', { params })
export const passResource = (id) => request.put(`/admin/audit/resources/${id}/pass`)
export const rejectResource = (id, data) => request.put(`/admin/audit/resources/${id}/reject`, data)

// ====== 内容列表管理 ======
export const getDemandList = (params) => request.get('/admin/demands', { params })
export const getResourceList = (params) => request.get('/admin/resources', { params })

// ====== 撮合管理 ======
export const getMatchingList = (params) => request.get('/admin/matching', { params })
export const getMatchingDetail = (id) => request.get(`/admin/matching/${id}`)
export const completeMatching = (id) => request.put(`/admin/matching/${id}/complete`)
export const grantReward = (id, data) => request.post(`/admin/matching/${id}/reward`, data)

// ====== 留言管理 ======
export const getComments = (params) => request.get('/admin/comments', { params })
export const deleteComment = (id) => request.delete(`/admin/comments/${id}`)

// ====== 财务管理 ======
export const getFinance = () => request.get('/admin/finance')
export const getRewardRecords = (params) => request.get('/admin/finance/rewards', { params })
export const getCommissionRecords = (params) => request.get('/admin/finance/commissions', { params })

// ====== 配置管理 ======
// 会员配置
export const getBasicTypesConfig = () => request.get('/admin/config/basic-types')
export const saveBasicTypesConfig = (data) => request.put('/admin/config/basic-types', data)

export const getMemberConfig = () => request.get('/admin/config/members')
export const saveMemberConfig = (data) => request.put('/admin/config/members', data)

// 大使提成配置
export const getAmbassadorConfig = () => request.get('/admin/config/ambassador')
export const saveAmbassadorConfig = (data) => request.put('/admin/config/ambassador', data)

// 撮合奖励配置
export const getRewardConfig = () => request.get('/admin/config/reward')
export const saveRewardConfig = (data) => request.put('/admin/config/reward', data)

// 商家评级配置
export const getRatingConfig = () => request.get('/admin/config/rating')
export const saveRatingConfig = (data) => request.put('/admin/config/rating', data)

// 行政区划配置
export const getRegions = (params) => request.get('/admin/config/basic/regions', { params })
export const createRegion = (data) => request.post('/admin/config/basic/regions', data)
export const updateRegion = (id, data) => request.put(`/admin/config/basic/regions/${id}`, data)
export const deleteRegion = (id) => request.delete(`/admin/config/basic/regions/${id}`)

// ====== 匹配算法配置 ======
export const getBanners = (params) => request.get('/admin/config/banners', { params })
export const createBanner = (data) => request.post('/admin/config/banners', data)
export const updateBanner = (id, data) => request.put(`/admin/config/banners/${id}`, data)
export const deleteBanner = (id) => request.delete(`/admin/config/banners/${id}`)

// ====== 防飞单配置 ======
export const getAntiFlyingConfig = () => request.get('/admin/config/anti-flying')
export const saveAntiFlyingConfig = (data) => request.put('/admin/config/anti-flying', data)

// ====== 内容审核配置 ======
export const getAuditConfig = () => request.get('/admin/config/audit')
export const saveAuditConfig = (data) => request.put('/admin/config/audit', data)

// ====== 标签管理 ======
export const getTags = (params) => request.get('/admin/config/tags', { params })
export const createTag = (data) => request.post('/admin/config/tags', data)
export const updateTag = (id, data) => request.put(`/admin/config/tags/${id}`, data)
export const deleteTag = (id) => request.delete(`/admin/config/tags/${id}`)

// ====== 管理员管理 ======
export const getAdmins = () => request.get('/admin/admins')
export const createAdmin = (data) => request.post('/admin/admins', {
  username: data.username || data.account,
  password: data.password,
  realName: data.realName || data.name,
  phone: data.phone,
  role: data.role,
  permissions: data.permissions || []
})
export const updateAdmin = (id, data) => request.put(`/admin/admins/${id}`, {
  realName: data.realName || data.name,
  phone: data.phone,
  role: data.role,
  permissions: data.permissions || [],
  password: data.password || undefined
})
export const deleteAdmin = (id) => request.delete(`/admin/admins/${id}`)

// ====== 系统通知管理 ======
export const getNotifications = (params) => request.get('/admin/notifications', { params })
export const getNotificationDetail = (id) => request.get(`/admin/notifications/${id}`)
export const createNotification = (data) => request.post('/admin/notifications', data)
export const updateNotification = (id, data) => request.put(`/admin/notifications/${id}`, data)
export const deleteNotification = (id) => request.delete(`/admin/notifications/${id}`)
export const publishNotification = (id) => request.post(`/admin/notifications/${id}/publish`)

// ====== 匹配算法配置 ======
export const getAlgorithmConfig = () => request.get('/admin/config/algorithm')
export const saveAlgorithmConfig = (data) => request.put('/admin/config/algorithm', data)

// ====== 专家类型管理 ======
export const getExpertTypes = () => request.get('/admin/config/expert-types')
export const saveExpertTypes = (data) => request.put('/admin/config/expert-types', data)
