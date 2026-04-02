/**
 * 商家端API路由
 */

const express = require('express')
const router = express.Router()
const MerchantController = require('../controllers/merchantController')
const { authMerchant } = require('../middleware/auth')

// 登录注册
router.post('/login', MerchantController.login)
router.post('/register', MerchantController.register)

// 公共信息
router.get('/banners', MerchantController.getBanners)
router.get('/config', MerchantController.getConfig)

// 首页推荐需求
router.get('/recommend/demands', MerchantController.getRecommendDemands)

// 需求大厅
router.get('/demands', MerchantController.getDemands)
router.get('/demands/:id', MerchantController.getDemandDetail)

// 资源大厅
router.get('/resources', MerchantController.getResources)
router.get('/resources/:id', MerchantController.getResourceDetail)

// 留言查询（公开）
router.get('/comments/demand/:id', MerchantController.getDemandComments)
router.get('/comments/resource/:id', MerchantController.getResourceComments)

// 需要认证的路由
router.use(authMerchant)

// 社区详情（防飞单）
router.get('/communities/:id', MerchantController.getCommunityDetail)

// 资源管理
router.get('/my/resources', MerchantController.getMyResources)
router.post('/resources', MerchantController.createResource)
router.put('/resources/:id', MerchantController.updateResource)
router.delete('/resources/:id', MerchantController.deleteResource)

// 对接管理
router.get('/my/intentions', MerchantController.getMyIntentions)
router.post('/intentions', MerchantController.createIntention)
router.delete('/intentions/:id', MerchantController.cancelIntention)

// 留言（提交需要认证）
router.post('/comments/demand/:id', MerchantController.createDemandComment)
router.post('/comments/resource/:id', MerchantController.createResourceComment)
router.post('/comments/:id/reply', MerchantController.replyComment)
router.get('/comments/:id/replies', MerchantController.getCommentReplies)

// 个人中心
router.get('/profile', MerchantController.getProfile)
router.put('/profile', MerchantController.updateProfile)

// 会员中心
router.get('/member', MerchantController.getMemberInfo)
router.get('/member/levels', MerchantController.getMemberLevels)
router.post('/member/upgrade', MerchantController.upgradeMember)
router.get('/member/payments', MerchantController.getPaymentHistory)

module.exports = router
