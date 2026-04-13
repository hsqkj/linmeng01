/**
 * 公共控制器
 */

const { pool } = require('../config/db')
const { success, error } = require('../utils/response')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const typeMapper = require('../services/typeMapper')
const { sendVerifyCode } = require('../services/smsService')

// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 5
// 同一手机号发送间隔（秒）
const SEND_INTERVAL = 60
// 内存缓存：{ phone: { code, time } }
const codeCache = new Map()

// 发送验证码（真实短信 + 容联云）
exports.sendSms = async (req, res) => {
  try {
    const { phone, type } = req.body

    if (!phone) return error(res, '请输入手机号', 400)

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return error(res, '手机号格式不正确', 400)
    }

    // 发送频率限制（同一手机号60秒内只能发一次）
    const cached = codeCache.get(phone)
    if (cached) {
      const elapsed = (Date.now() - cached.time) / 1000
      if (elapsed < SEND_INTERVAL) {
        const remaining = Math.ceil(SEND_INTERVAL - elapsed)
        return error(res, `请 ${remaining} 秒后再试`, 429)
      }
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 调用容联云发送真实短信
    let smsResult
    try {
      smsResult = await sendVerifyCode(phone, code)
    } catch (e) {
      console.error('[SMS] 容联云调用异常:', e.message)
      // 网络异常时降级：跳过真实发送，只返回验证码供测试
      codeCache.set(phone, { code, time: Date.now() })
      console.log(`[SMS] 容联云异常降级，向 ${phone} 返回验证码: ${code}`)
      return success(res, { code }, '验证码已发送（短信服务暂时不可用）')
    }

    if (!smsResult.success) {
      // 网络超时/不可达时降级，返回验证码给前端（仅开发/调试用）
      const msg = (smsResult.message || '').toLowerCase()
      if (msg.includes('etimedout') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('请求超时')) {
        codeCache.set(phone, { code, time: Date.now() })
        console.log(`[SMS] 容联云不可达降级，向 ${phone} 返回验证码: ${code}`)
        return success(res, { code }, '验证码已发送（短信服务暂时不可用）')
      }
      console.error('[SMS] 容联云返回失败:', smsResult.message)
      return error(res, '短信发送失败：' + smsResult.message, 500)
    }

    // 写入内存缓存（生产环境建议用 Redis）
    codeCache.set(phone, { code, time: Date.now() })

    console.log(`[SMS] 向 ${phone} 发送验证码: ${code} (类型: ${type})`)

    success(res, { code }, '验证码已发送')
  } catch (err) {
    console.error('[SMS] sendSms error:', err)
    error(res, '发送失败：' + err.message)
  }
}

// 检查手机号是否已注册
exports.checkPhone = async (req, res) => {
  try {
    const { phone, role } = req.body
    
    // 商家和专家都存储在 merchants 表中，需要检查 phone 字段
    if (role === 'merchant' || role === 'expert') {
      const [rows] = await pool.query(
        `SELECT id, company_type FROM merchants WHERE phone = ? LIMIT 1`,
        [phone]
      )
      const exists = rows.length > 0
      const existingType = exists ? rows[0].company_type : null
      // 如果已存在，返回存在的类型信息
      success(res, { 
        exists, 
        existingType: existingType || 'merchant', // 默认为商家
        message: exists ? (existingType === 'expert' ? '该手机号已注册为专家' : '该手机号已注册为商家') : ''
      })
      return
    }
    
    let table = 'communities'
    if (role === 'ambassador') table = 'ambassadors'
    
    const [rows] = await pool.query(
      `SELECT id FROM ${table} WHERE phone = ? OR username = ? LIMIT 1`,
      [phone, phone]
    )
    
    success(res, { exists: rows.length > 0 })
  } catch (err) {
    error(res, '查询失败')
  }
}

// 获取地区列表
exports.getRegions = async (req, res) => {
  try {
    const { parent_id } = req.query
    
    let where = '1=1'
    const params = []
    
    if (parent_id !== undefined) {
      where += ' AND parent_id = ?'
      params.push(parent_id)
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM regions WHERE ' + where + ' ORDER BY sort_order',
      params
    )
    
    success(res, rows)
  } catch (err) {
    error(res, '获取地区列表失败')
  }
}

// 获取标签列表
exports.getTags = async (req, res) => {
  try {
    const { type } = req.query
    
    let where = 'status = 1'
    const params = []
    
    if (type) {
      where += ' AND type = ?'
      params.push(type)
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM tags WHERE ' + where + ' ORDER BY type, id',
      params
    )
    
    success(res, rows)
  } catch (err) {
    error(res, '获取标签列表失败')
  }
}

// 获取行业分类
exports.getIndustries = async (req, res) => {
  try {
    const industries = [
      '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果',
      '美业', '保健养生', '体育健身', '银行保险', '电信服务',
      '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材',
      '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务',
      '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰',
      '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
      '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体',
      '自媒体', 'IT互联网', '软件开发', '图文广告', '电子电器维修',
      '家居维修', '美发', '建筑工程', '其他'
    ]
    
    success(res, industries)
  } catch (err) {
    error(res, '获取行业分类失败')
  }
}

// 招商大使申请
exports.applyAmbassador = async (req, res) => {
  try {
    const { real_name, phone, id_card } = req.body
    
    // 检查手机号是否已注册
    const [existing] = await pool.query('SELECT id FROM ambassadors WHERE phone = ?', [phone])
    if (existing.length > 0) {
      return error(res, '该手机号已注册，请直接登录', 400)
    }
    
    const hashedPassword = await require('bcryptjs').hash(phone.slice(-6), 10)
    
    // 生成渠道码
    const qrCode = `LM${Date.now().toString(36).toUpperCase()}`
    
    await pool.query(
      'INSERT INTO ambassadors (username, password, real_name, phone, id_card, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [phone, hashedPassword, real_name, phone, id_card, qrCode]
    )
    
    success(res, { qrCode }, '申请已提交，请等待审核')
  } catch (err) {
    console.error('Apply ambassador error:', err)
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, '该手机号已注册，请直接登录', 400)
    }
    error(res, '申请失败')
  }
}

// 图片上传配置
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG/PNG/GIF/WEBP 图片格式'))
    }
  }
})

// 图片上传接口（支持本地存储和 COS）
exports.uploadImage = [
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return error(res, '未选择图片')
    }

    // 根据配置决定使用本地存储还是 COS
    if (process.env.USE_COS === 'true') {
      try {
        const { uploadFile } = require('../services/cosUploadService')
        const folder = req.body.folder || 'uploads'
        const url = await uploadFile(req.file.buffer, req.file.originalname, folder)
        success(res, { url }, '上传成功')
      } catch (e) {
        console.error('COS upload error:', e)
        error(res, '上传失败')
      }
    } else {
      const url = `/uploads/${req.file.filename}`
      success(res, { url }, '上传成功')
    }
  }
]

// 获取发布页类型配置
exports.getPublishTypes = async (req, res) => {
  try {
    // 使用统一映射服务获取所有类型配置
    const typeMaps = typeMapper.getAllTypeMaps()
    
    const result = {
      // 需求类型
      demand_types: typeMaps.demandTypes.map(t => t.name),
      // 资源类型
      resource_types: typeMaps.resourceTypes.map(t => t.name),
      // 活动类型
      activity_types: typeMaps.activityTypes.map(t => t.name),
      // 专家类型
      expert_types: typeMaps.expertTypes.map(t => t.name),
      // 居民类型
      resident_types: typeMaps.residentTypes.map(t => t.name),
      // 社区类型
      community_types: typeMaps.communityTypes.map(t => t.name),
      // 企业类型
      enterprise_types: typeMaps.enterpriseTypes.map(t => t.name),
      // 行业分类
      industry_types: typeMaps.industryTypes.map(t => t.name),
      // 社区标签
      community_tags: typeMaps.communityTags.map(t => t.name),
      // 资源标签
      resource_tags: typeMaps.resourceTags.map(t => t.name),
      // 媒体类型
      media_types: typeMaps.mediaTypes.map(t => t.name),
      // 空间类型
      space_types: typeMaps.spaceTypes.map(t => t.name),
      // 合作方式
      cooperation_types: typeMaps.cooperationTypes.map(t => t.name),
      // 品牌展示方式
      brand_display_types: typeMaps.brandDisplayTypes.map(t => t.name),
      // 专业服务类型
      professional_types: typeMaps.professionalTypes.map(t => t.name),
      // 技术类型
      tech_types: typeMaps.techTypes.map(t => t.name),
    }
    
    // 额外从 sys_configs 获取会员等级配置
    try {
      const [levelRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_levels'")
      if (levelRows.length > 0) {
        const levels = JSON.parse(levelRows[0].config_value)
        result.member_levels = levels.map(level => ({
          level: level.level ?? 0,
          name: level.name || level
        }))
      }
    } catch {}
    
    success(res, result)
  } catch (err) {
    console.error('getPublishTypes error:', err)
    error(res, '获取类型配置失败')
  }
}

// 获取专家类型列表（公开接口）
exports.getExpertTypes = async (req, res) => {
  try {
    // 从 sys_configs 读取
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'expert_types'")
    if (rows.length > 0) {
      try {
        const types = JSON.parse(rows[0].config_value)
        return success(res, types.map(t => typeof t === 'string' ? { name: t, status: 1 } : t))
      } catch {}
    }
    // 返回空数组（管理后台应确保已配置）
    success(res, [])
  } catch (err) {
    error(res, '获取专家类型失败')
  }
}

// 获取轮播图（公开接口）
exports.getBanners = async (req, res) => {
  try {
    const { position } = req.query
    let where = "status = 1 AND (position = 'all' OR position = 'both')"
    if (position) {
      where += ` OR position = '${position}'`
    }
    const [rows] = await pool.query(`SELECT * FROM banners WHERE ${where} ORDER BY sort_order`)
    success(res, rows)
  } catch (err) {
    console.error('Get banners error:', err)
    success(res, []) // 出错返回空数组，避免前端报错
  }
}

// 根据渠道码获取大使信息（公开接口）
exports.getAmbassadorByCode = async (req, res) => {
  try {
    const { code } = req.query
    if (!code) {
      return error(res, '缺少渠道码参数', 400)
    }
    const [rows] = await pool.query(
      "SELECT id, real_name, username FROM ambassadors WHERE qr_code = ? AND status = 1 LIMIT 1",
      [code]
    )
    if (rows.length === 0) {
      return success(res, null, '未找到对应大使')
    }
    success(res, rows[0])
  } catch (err) {
    console.error('Get ambassador by code error:', err)
    error(res, '获取大使信息失败')
  }
}

// ====== 地理编码 ======
// 地理编码：根据地址获取经纬度（使用 Nominatim / OpenStreetMap 免费服务）
const https = require('https')

async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) return null

  // 先查缓存
  try {
    const [cached] = await pool.query(
      'SELECT lat, lng FROM geocode_cache WHERE address = ? LIMIT 1',
      [address.trim()]
    )
    if (cached.length > 0) {
      return { lat: cached[0].lat, lng: cached[0].lng }
    }
  } catch {}

  // 调用 Nominatim API（免费，需设置 User-Agent）
  return new Promise((resolve) => {
    const encodedAddr = encodeURIComponent(address.trim())
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddr}&format=json&limit=1&countrycodes=cn`
    const options = {
      headers: { 'User-Agent': 'LinMeng/1.0 (contact@3qall.com)' },
      timeout: 5000
    }
    const req = https.get(url, options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', async () => {
        try {
          const results = JSON.parse(data)
          if (results && results.length > 0) {
            const loc = results[0]
            const lat = parseFloat(loc.lat)
            const lng = parseFloat(loc.lon)
            // 写入缓存
            try {
              await pool.query(
                'INSERT IGNORE INTO geocode_cache (address, lat, lng) VALUES (?, ?, ?)',
                [address.trim(), lat, lng]
              )
            } catch {}
            resolve({ lat, lng })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

// 地理编码接口
exports.geocode = async (req, res) => {
  try {
    const { address } = req.query
    if (!address) return error(res, '请提供地址参数', 400)

    const coords = await geocodeAddress(address)
    if (coords) {
      success(res, coords, '地理编码成功')
    } else {
      error(res, '地址无法定位，请输入更详细的地址', 400)
    }
  } catch (err) {
    console.error('Geocode error:', err)
    error(res, '地理编码服务异常')
  }
}

// 批量地理编码（管理员用）
exports.geocodeBatch = async (req, res) => {
  try {
    const { type, ids } = req.body // type: 'merchant' | 'community'
    if (!type || !ids || !Array.isArray(ids)) return error(res, '参数错误', 400)

    const table = type === 'merchant' ? 'merchants' : 'communities'
    const addrCol = 'address'

    const [rows] = await pool.query(
      `SELECT id, ${addrCol} as addr FROM ${table} WHERE id IN (?) AND (lat IS NULL OR lng IS NULL)`,
      [ids]
    )

    const results = []
    for (const row of rows) {
      if (!row.addr) continue
      const coords = await geocodeAddress(row.addr)
      if (coords) {
        await pool.query(
          `UPDATE ${table} SET lat = ?, lng = ? WHERE id = ?`,
          [coords.lat, coords.lng, row.id]
        )
        results.push({ id: row.id, lat: coords.lat, lng: coords.lng })
      }
      // Nominatim 限速：每秒1请求
      await new Promise(r => setTimeout(r, 1100))
    }

    success(res, { count: results.length, results })
  } catch (err) {
    console.error('Geocode batch error:', err)
    error(res, '批量地理编码失败')
  }
}

// 获取平台统计信息（公开接口）
exports.getStats = async (req, res) => {
  try {
    // 统计已审核的需求浏览量总和
    const [[demandViews]] = await pool.query(
      "SELECT COALESCE(SUM(view_count), 0) as total FROM demands WHERE status = 1"
    )
    // 统计已审核的资源浏览量总和
    const [[resourceViews]] = await pool.query(
      "SELECT COALESCE(SUM(view_count), 0) as total FROM resources WHERE status = 1"
    )

    success(res, {
      totalViews: Number(demandViews.total) + Number(resourceViews.total)
    })
  } catch (err) {
    console.error('Get stats error:', err)
    error(res, '获取统计数据失败')
  }
}

// 获取统一类型映射数据
exports.getTypeMaps = async (req, res) => {
  try {
    const typeMaps = typeMapper.getAllTypeMaps()
    success(res, typeMaps)
  } catch (err) {
    console.error('Get type maps error:', err)
    error(res, '获取类型映射失败')
  }
}
