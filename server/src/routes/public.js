/**
 * 公共API路由
 */

const express = require('express')
const router = express.Router()
const PublicController = require('../controllers/publicController')
const AdminController = require('../controllers/adminController')

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
router.post('/upload', PublicController.uploadImage)  // 别名

// 原生文件上传（绕过 multer，使用 busboy）
const Busboy = require('busboy')
const path = require('path')
const fs = require('fs')

router.post('/upload-native', (req, res) => {
  console.log('=== Native upload called ===')
  const uploadDir = path.join(__dirname, '../../uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  
  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: 5 * 1024 * 1024 }
  })
  
  let fileWritten = false
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  let filepath = ''
  
  busboy.on('file', (fieldname, file, info) => {
    console.log('=== File received ===')
    console.log('Field:', fieldname)
    console.log('Info:', info)
    const ext = path.extname(info.filename || '.png')
    filepath = path.join(uploadDir, filename + ext)
    file.pipe(fs.createWriteStream(filepath))
    file.on('end', () => {
      fileWritten = true
      console.log('=== File written ===')
    })
    file.on('error', (err) => {
      console.error('File write error:', err)
    })
  })
  
  busboy.on('finish', () => {
    console.log('=== Busboy finished ===')
    if (fileWritten) {
      const url = `/uploads/${filename}${path.extname(filepath)}`
      res.json({ code: 200, success: true, data: { url }, message: '上传成功' })
    } else {
      res.status(500).json({ code: 500, message: '上传失败' })
    }
  })
  
  busboy.on('error', (err) => {
    console.error('Busboy error:', err)
    res.status(500).json({ code: 500, message: '上传失败' })
  })
  
  req.pipe(busboy)
})

// 测试端点
router.get('/test', (req, res) => {
  console.log('=== Test endpoint hit ===')
  res.json({ success: true, message: 'Test endpoint works' })
})

// 简单文件上传测试（不使用 multer）
router.post('/simple-upload', (req, res) => {
  console.log('=== Simple upload hit ===')
  console.log('Headers:', req.headers['content-type'])
  
  let data = []
  req.on('data', chunk => data.push(chunk))
  req.on('end', () => {
    console.log('=== Data received ===')
    console.log('Length:', data.length)
    res.json({ success: true, length: data.length })
  })
  req.on('error', (err) => {
    console.error('Request error:', err)
    res.status(500).json({ success: false, error: err.message })
  })
})

// 发布页类型配置
router.get('/publish-types', PublicController.getPublishTypes)

// 专家类型列表（公开接口）
router.get('/expert-types', PublicController.getExpertTypes)

// 轮播图（公开接口）
router.get('/banners', PublicController.getBanners)

// 根据渠道码获取大使信息（公开接口）
router.get('/ambassador/by-code', PublicController.getAmbassadorByCode)

// 地理编码
router.get('/geocode', PublicController.geocode)

// 平台统计信息（公开接口）
router.get('/stats', PublicController.getStats)

// 类型映射数据（统一映射服务）
router.get('/type-maps', PublicController.getTypeMaps)

// ========== 智能客服公开接口 ==========

// 获取客服基本设置（公开）
router.get('/service/config', AdminController.getServiceConfig)

// 获取FAQ列表（公开）
router.get('/service/faqs', AdminController.getFaqList)

// 获取快捷问题列表（公开）
router.get('/service/quick-questions', AdminController.getQuickQuestions)

module.exports = router
