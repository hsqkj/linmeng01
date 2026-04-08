/**
 * 社区端API路由
 */

const express = require('express')
const router = express.Router()
const CommunityController = require('../controllers/communityController')
const { authCommunity } = require('../middleware/auth')

// 登录注册
router.post('/login', CommunityController.login)
router.post('/register', CommunityController.register)

// 公共信息
router.get('/banners', CommunityController.getBanners)
router.get('/config', CommunityController.getConfig)

// 首页推荐资源
router.get('/recommend/resources', CommunityController.getRecommendResources)

// 资源大厅
router.get('/resources', CommunityController.getResources)
router.get('/resources/:id', CommunityController.getResourceDetail)

// 需求大厅
router.get('/demands', CommunityController.getDemands)

// 批量导入（必须在 /demands/:id 之前）
router.get('/demands/template', CommunityController.downloadTemplate)
router.post('/demands/import', CommunityController.importDemands)
router.get('/demands/:id', CommunityController.getDemandDetail)

// 留言查询（公开）
router.get('/comments/demand/:id', CommunityController.getDemandComments)
router.get('/comments/resource/:id', CommunityController.getResourceComments)

// 需要认证的路由
router.use(authCommunity)

// 商家详情（防飞单）
router.get('/merchants/:id', CommunityController.getMerchantDetail)

// 需求管理
router.get('/my/demands', CommunityController.getMyDemands)
router.post('/demands', CommunityController.createDemand)
router.put('/demands/:id', CommunityController.updateDemand)
router.delete('/demands/:id', CommunityController.deleteDemand)

// 需求草稿
router.get('/drafts', CommunityController.getMyDrafts)
router.get('/drafts/:id', CommunityController.getDraft)
router.post('/drafts', CommunityController.saveDraft)
router.delete('/drafts/:id', CommunityController.deleteDraft)



// 对接管理
router.get('/my/intentions', CommunityController.getMyIntentions)
router.put('/intentions/:id/accept', CommunityController.acceptIntention)
router.put('/intentions/:id/reject', CommunityController.rejectIntention)

// 留言（提交需要认证）
router.post('/comments/demand/:id', CommunityController.createDemandComment)
router.post('/comments/resource/:id', CommunityController.createResourceComment)
router.post('/comments/:id/reply', CommunityController.replyComment)

// 个人中心
router.get('/profile', CommunityController.getProfile)
router.put('/profile', CommunityController.updateProfile)

// 奖励明细
router.get('/rewards', CommunityController.getRewards)
router.put('/rewards/claim', CommunityController.claimReward)

// 我的留言（留言咨询 - 隔离）
router.get('/my/comments', CommunityController.getMyComments)

// 收藏资源
router.post('/favorites/toggle', CommunityController.toggleFavorite)
router.get('/favorites', CommunityController.getMyFavorites)

// 系统通知
router.get('/notifications', CommunityController.getMyNotifications)
router.get('/notifications/unread-count', CommunityController.getUnreadCount)
router.post('/notifications/mark-read', CommunityController.markNotificationsRead)
router.put('/notifications/:id/read', CommunityController.markOneNotificationRead)

module.exports = router
