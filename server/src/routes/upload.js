// 图片上传路由 - 支持本地存储和云存储 COS
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { success, error } = require('../utils/response')

const router = express.Router()

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 本地存储配置
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

// 内存存储（用于云存储）
const memoryStorage = multer.memoryStorage()
const uploadLocal = multer({ storage: localStorage, limits: { fileSize: 10 * 1024 * 1024 } })
const uploadMemory = multer({ storage: memoryStorage, limits: { fileSize: 10 * 1024 * 1024 } })

// 是否使用 COS（根据配置切换）
const USE_COS = process.env.USE_COS === 'true'

if (USE_COS) {
  const { uploadFile, uploadFiles } = require('../services/cosUploadService')

  // 单文件上传 - COS
  router.post('/single', uploadMemory.single('file'), async (req, res) => {
    try {
      if (!req.file) return error(res, '请选择文件', 400)
      const folder = req.body.folder || 'uploads'
      const url = await uploadFile(req.file.buffer, req.file.originalname, folder)
      success(res, { url })
    } catch (e) {
      console.error('COS upload error:', e)
      error(res, '上传失败')
    }
  })

  // 多文件上传 - COS
  router.post('/multiple', uploadMemory.array('files', 9), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) return error(res, '请选择文件', 400)
      const folder = req.body.folder || 'uploads'
      const urls = await uploadFiles(req.files, folder)
      success(res, { urls })
    } catch (e) {
      console.error('COS upload error:', e)
      error(res, '上传失败')
    }
  })
} else {
  // 单文件上传 - 本地
  router.post('/single', uploadLocal.single('file'), (req, res) => {
    if (!req.file) return error(res, '请选择文件', 400)
    const url = `/uploads/${req.file.filename}`
    success(res, { url })
  })

  // 多文件上传 - 本地
  router.post('/multiple', uploadLocal.array('files', 9), (req, res) => {
    if (!req.files || req.files.length === 0) return error(res, '请选择文件', 400)
    const urls = req.files.map(f => `/uploads/${f.filename}`)
    success(res, { urls })
  })
}

module.exports = router
