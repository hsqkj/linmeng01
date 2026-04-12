// 腾讯云 COS 上传服务
const COS = require('cos-nodejs-sdk-v5')
const config = require('../config/cos')
const path = require('path')
const crypto = require('crypto')

const cos = new COS({
  SecretId: config.secretId,
  SecretKey: config.secretKey
})

/**
 * 上传文件到 COS
 * @param {Buffer} fileBuffer - 文件内容
 * @param {string} originalName - 原始文件名
 * @param {string} folder - 存储目录，如 'resources'、'avatars'、'demands'
 * @returns {Promise<string>} 文件访问 URL
 */
async function uploadFile(fileBuffer, originalName, folder = 'uploads') {
  // 生成唯一文件名
  const ext = path.extname(originalName)
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
  const key = `${folder}/${filename}`

  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
      Body: fileBuffer,
      ContentType: getMimeType(ext)
    }, (err, data) => {
      if (err) {
        console.error('COS upload error:', err)
        return reject(err)
      }
      console.log(`[COS] Uploaded: ${key}`)
      resolve(`${config.baseUrl}/${key}`)
    })
  })
}

/**
 * 批量上传多个文件
 * @param {Array} files - multer 文件数组
 * @param {string} folder - 存储目录
 * @returns {Promise<string[]>} 文件 URL 数组
 */
async function uploadFiles(files, folder = 'uploads') {
  const results = []
  for (const file of files) {
    try {
      const url = await uploadFile(file.buffer, file.originalname, folder)
      results.push(url)
    } catch (e) {
      console.error(`Upload failed for ${file.originalname}:`, e)
      throw e
    }
  }
  return results
}

/**
 * 删除 COS 文件
 * @param {string} fileUrl - 文件完整 URL
 */
async function deleteFile(fileUrl) {
  if (!fileUrl || !fileUrl.includes(config.baseUrl)) return

  const key = fileUrl.replace(config.baseUrl + '/', '')
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key
    }, (err, data) => {
      if (err) {
        console.error('COS delete error:', err)
        return reject(err)
      }
      console.log(`[COS] Deleted: ${key}`)
      resolve(data)
    })
  })
}

/**
 * 获取 MIME 类型
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

module.exports = {
  uploadFile,
  uploadFiles,
  deleteFile
}
