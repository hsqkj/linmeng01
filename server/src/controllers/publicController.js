/**
 * 公共控制器
 */

const { pool } = require('../config/db')
const { success, error } = require('../utils/response')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 发送验证码（模拟）
exports.sendSms = async (req, res) => {
  try {
    const { phone, type } = req.body
    
    if (!phone) return error(res, '请输入手机号', 400)
    
    // 实际项目中应该调用短信服务API
    // 测试版：固定验证码 123456
    const code = '123456'
    
    console.log(`[SMS] 向 ${phone} 发送验证码: ${code} (类型: ${type})`)
    
    success(res, { code }, '验证码已发送')
  } catch (err) {
    error(res, '发送失败')
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

// 图片上传接口
exports.uploadImage = [
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return error(res, '未选择图片')
    }
    const url = `/uploads/${req.file.filename}`
    success(res, { url }, '上传成功')
  }
]

// 获取发布页类型配置
exports.getPublishTypes = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_key, config_value FROM sys_configs WHERE config_key IN ('activity_types', 'expert_types', 'sponsor_types', 'reward_types', 'target_groups', 'community_tags', 'merchant_tags')")
    const result = {}
    rows.forEach(r => {
      try {
        result[r.config_key] = JSON.parse(r.config_value)
      } catch {
        result[r.config_key] = r.config_value
      }
    })
    // 如果数据库没有配置，返回默认值
    if (Object.keys(result).length === 0) {
      result.activity_types = ['文艺演出', '体育赛事', '公益活动', '节庆活动', '亲子活动', '健康讲座', '环保活动', '法制宣传', '职业技能培训', '文化展览', '趣味运动会', '其他']
      result.expert_types = ['法律咨询', '医疗健康', '心理辅导', '教育培训', '技能培训', '金融理财', '社会工作', '文艺指导', '体育健身', '营养指导', '其他']
      result.target_groups = ['青少年/儿童', '中老年', '青年', '宝妈', '退役军人', '残疾群体', '孤寡老人', '困难家庭', '全体居民']
      result.sponsor_types = [{ label: '💵 资金赞助', value: 'fund' }, { label: '📦 物资提供', value: 'goods' }, { label: '👥 人力支持', value: 'manpower' }, { label: '💻 技术支持', value: 'tech' }, { label: '📰 媒体报道', value: 'media' }]
      result.reward_types = ['活动冠名权', '现场展台/展位', '主持人口播', '背景板/横幅Logo展示', '活动物料品牌露出', '社区公众号推文宣传', '网格群/小区业主群宣传', '荣誉证书', '现场宣传横幅', '宣传栏长期展示', '媒体报道', '现场派发宣传资料']
      result.community_tags = ['老旧小区', '新建社区', '亲子社区', '老龄化社区', '学区社区', '商圈社区', '文化社区', '体育社区', '绿色社区', '公共空间丰富', '商业密集', '志愿服务活跃']
      result.merchant_tags = ['连锁品牌', '本地企业', '上市公司', '高端品牌', '大众品牌', '公益导向', '长期合作', '亲子品牌', '老年服务', '全国服务', '精准获客', '社会责任']
    }
    success(res, result)
  } catch (err) {
    error(res, '获取类型配置失败')
  }
}

// 获取专家类型列表（公开接口）
exports.getExpertTypes = async (req, res) => {
  try {
    // 优先从 sys_configs 读取
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'expert_types'")
    if (rows.length > 0) {
      try {
        const types = JSON.parse(rows[0].config_value)
        return success(res, types.map(t => typeof t === 'string' ? { name: t, status: 1 } : t))
      } catch {}
    }
    // 降级返回默认值
    const defaultTypes = ['法律咨询', '医疗健康', '心理辅导', '教育培训', '技能培训', '金融理财', '社会工作', '文艺指导', '体育健身', '营养指导', '其他']
    success(res, defaultTypes.map(t => ({ name: t, status: 1 })))
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
