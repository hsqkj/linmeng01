/**
 * 公共API路由
 */

const express = require('express')
const router = express.Router()
const PublicController = require('../controllers/publicController')

// 获取验证码
router.post('/sms/send', PublicController.sendSms)

// 验证手机号是否已注册
router.post('/check/phone', PublicController.checkPhone)

// 获取地区列表
router.get('/regions', PublicController.getRegions)

// 获取标签列表
router.get('/tags', PublicController.getTags)

// 获取行业分类
router.get('/industries', PublicController.getIndustries)

// 招商大使申请
router.post('/ambassador/apply', PublicController.applyAmbassador)

// 图片上传
router.post('/upload/image', PublicController.uploadImage)

// 发布页类型配置
router.get('/publish-types', PublicController.getPublishTypes)

// 专家类型列表（公开接口）
router.get('/expert-types', PublicController.getExpertTypes)

// 轮播图（公开接口）
router.get('/banners', PublicController.getBanners)

// 根据渠道码获取大使信息（公开接口）
router.get('/ambassador/by-code', PublicController.getAmbassadorByCode)

module.exports = router
