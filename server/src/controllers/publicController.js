/**
 * 公共控制器
 */

const { pool } = require('../config/db')
const { success, error } = require('../utils/response')

// 发送验证码（模拟）
exports.sendSms = async (req, res) => {
  try {
    const { phone, type } = req.body
    
    // 实际项目中应该调用短信服务API
    // 这里模拟发送成功，返回123456作为测试验证码
    const code = '123456'
    
    // 将验证码存入Redis或数据库，设置过期时间
    // 这里简单记录到日志
    console.log(`[SMS] 向 ${phone} 发送验证码: ${code} (类型: ${type})`)
    
    success(res, { code }, '验证码已发送')
  } catch (err) {
    error(res, '发送失败')
  }
}

// 检查手机号是否已注册
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body
    
    const [communities] = await pool.query('SELECT id FROM communities WHERE phone = ?', [phone])
    const [merchants] = await pool.query('SELECT id FROM merchants WHERE phone = ?', [phone])
    const [ambassadors] = await pool.query('SELECT id FROM ambassadors WHERE phone = ?', [phone])
    
    const exists = {
      community: communities.length > 0,
      merchant: merchants.length > 0,
      ambassador: ambassadors.length > 0
    }
    
    success(res, exists)
  } catch (err) {
    error(res, '查询失败')
  }
}

// 获取地区列表
exports.getRegions = async (req, res) => {
  try {
    const { level, parent_id } = req.query
    
    let where = '1=1'
    const params = []
    
    if (level) {
      where += ' AND level = ?'
      params.push(level)
    }
    
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
