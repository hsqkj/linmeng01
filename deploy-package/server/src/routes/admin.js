/**
 * 管理后台API路由
 */

const express = require('express')
const router = express.Router()
const AdminController = require('../controllers/adminController')
const { authAdmin } = require('../middleware/auth')

// 登录
router.post('/login', AdminController.login)

// 仪表盘统计
router.get('/dashboard', authAdmin, AdminController.dashboard)

// 用户管理
router.get('/users/communities', authAdmin, AdminController.getCommunities)
router.get('/users/communities/:id', authAdmin, AdminController.getCommunityDetail)
router.put('/users/communities/:id/status', authAdmin, AdminController.updateCommunityStatus)

router.get('/users/merchants', authAdmin, AdminController.getMerchants)
router.get('/users/merchants/:id', authAdmin, AdminController.getMerchantDetail)
router.put('/users/merchants/:id/status', authAdmin, AdminController.updateMerchantStatus)
router.put('/users/merchants/:id/level', authAdmin, AdminController.updateMerchantLevel)
router.put('/users/merchants/:id/rating', authAdmin, AdminController.updateMerchantRating)

router.get('/users/ambassadors', authAdmin, AdminController.getAmbassadors)
router.get('/users/ambassadors/:id', authAdmin, AdminController.getAmbassadorDetail)
router.put('/users/ambassadors/:id/status', authAdmin, AdminController.updateAmbassadorStatus)

// 管理员管理
router.get('/admins', authAdmin, AdminController.getAdmins)
router.post('/admins', authAdmin, AdminController.createAdmin)
router.put('/admins/:id', authAdmin, AdminController.updateAdmin)
router.delete('/admins/:id', authAdmin, AdminController.deleteAdmin)

// 内容审核
router.get('/audit/demands', authAdmin, AdminController.getDemandAuditList)
router.put('/audit/demands/:id/pass', authAdmin, AdminController.passDemand)
router.put('/audit/demands/:id/reject', authAdmin, AdminController.rejectDemand)

router.get('/audit/resources', authAdmin, AdminController.getResourceAuditList)
router.put('/audit/resources/:id/pass', authAdmin, AdminController.passResource)
router.put('/audit/resources/:id/reject', authAdmin, AdminController.rejectResource)

// 撮合管理
router.get('/matching', authAdmin, AdminController.getMatchingList)
router.get('/matching/:id', authAdmin, AdminController.getMatchingDetail)
router.put('/matching/:id/complete', authAdmin, AdminController.completeMatching)
router.post('/matching/:id/reward', authAdmin, AdminController.grantReward)

// 留言管理
router.get('/comments', authAdmin, AdminController.getComments)
router.delete('/comments/:id', authAdmin, AdminController.deleteComment)

// 配置管理
router.get('/config/basic-types', authAdmin, AdminController.getBasicTypesConfig)
router.put('/config/basic-types', authAdmin, AdminController.saveBasicTypesConfig)

router.get('/config/members', authAdmin, AdminController.getMemberConfig)
router.put('/config/members', authAdmin, AdminController.saveMemberConfig)

router.get('/config/ambassador', authAdmin, AdminController.getAmbassadorConfig)
router.put('/config/ambassador', authAdmin, AdminController.saveAmbassadorConfig)

router.get('/config/reward', authAdmin, AdminController.getRewardConfig)
router.put('/config/reward', authAdmin, AdminController.saveRewardConfig)

router.get('/config/rating', authAdmin, AdminController.getRatingConfig)
router.put('/config/rating', authAdmin, AdminController.saveRatingConfig)

router.get('/config/banners', authAdmin, AdminController.getBanners)
router.post('/config/banners', authAdmin, AdminController.createBanner)
router.put('/config/banners/:id', authAdmin, AdminController.updateBanner)
router.delete('/config/banners/:id', authAdmin, AdminController.deleteBanner)

router.get('/config/tags', authAdmin, AdminController.getTags)
router.post('/config/tags', authAdmin, AdminController.createTag)
router.put('/config/tags/:id', authAdmin, AdminController.updateTag)
router.delete('/config/tags/:id', authAdmin, AdminController.deleteTag)

router.get('/config/basic/regions', authAdmin, AdminController.getRegions)
router.post('/config/basic/regions', authAdmin, AdminController.createRegion)
router.put('/config/basic/regions/:id', authAdmin, AdminController.updateRegion)
router.delete('/config/basic/regions/:id', authAdmin, AdminController.deleteRegion)

// 财务管理
router.get('/finance', authAdmin, AdminController.getFinance)
router.get('/finance/rewards', authAdmin, AdminController.getRewardRecords)
router.get('/finance/commissions', authAdmin, AdminController.getCommissionRecords)

// 系统通知管理
router.get('/notifications', authAdmin, AdminController.getNotifications)
router.get('/notifications/:id', authAdmin, AdminController.getNotificationDetail)
router.post('/notifications', authAdmin, AdminController.createNotification)
router.put('/notifications/:id', authAdmin, AdminController.updateNotification)
router.delete('/notifications/:id', authAdmin, AdminController.deleteNotification)
router.post('/notifications/:id/publish', authAdmin, AdminController.publishNotification)

// 匹配算法配置
router.get('/config/algorithm', authAdmin, AdminController.getAlgorithmConfig)
router.put('/config/algorithm', authAdmin, AdminController.saveAlgorithmConfig)

// 防飞单配置
router.get('/config/anti-flying', authAdmin, AdminController.getAntiFlyingConfig)
router.put('/config/anti-flying', authAdmin, AdminController.saveAntiFlyingConfig)

// 内容审核配置
router.get('/config/audit', authAdmin, AdminController.getAuditConfig)
router.put('/config/audit', authAdmin, AdminController.saveAuditConfig)

module.exports = router
