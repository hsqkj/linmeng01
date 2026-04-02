/**
 * 商家控制器
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')
const jwtConfig = require('../config/jwt')
const { success, pageSuccess, error } = require('../utils/response')
const { calculateMatchScore, getMatchHearts } = require('../utils/matching')

// 登录
exports.login = async (req, res) => {
  try {
    const { phone, password, code } = req.body
    
    if (!phone) return error(res, '请输入手机号', 400)
    
    const [rows] = await pool.query(
      'SELECT * FROM merchants WHERE phone = ?',
      [phone]
    )
    
    if (rows.length === 0) {
      return error(res, '账号不存在，请先注册', 401)
    }
    
    const merchant = rows[0]
    
    if (merchant.status === 2) {
      return error(res, '账号已被禁用', 403)
    }
    
    // 验证码登录（测试版：接受123456或888888）
    if (code !== undefined) {
      const validCodes = ['123456', '888888']
      if (!validCodes.includes(code)) {
        return error(res, '验证码错误', 401)
      }
    } else if (password) {
      const isMatch = await bcrypt.compare(password, merchant.password)
      if (!isMatch) {
        return error(res, '手机号或密码错误', 401)
      }
    } else {
      return error(res, '请输入验证码', 400)
    }
    
    const token = jwt.sign({
      id: merchant.id,
      phone: merchant.phone,
      role: 'merchant'
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn })
    
    await pool.query('UPDATE merchants SET last_login_at = NOW() WHERE id = ?', [merchant.id])
    
    delete merchant.password
    success(res, { token, merchant })
  } catch (err) {
    console.error('Merchant login error:', err)
    error(res, '登录失败')
  }
}

// 注册
exports.register = async (req, res) => {
  try {
    const data = req.body
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    const [existing] = await pool.query('SELECT id FROM merchants WHERE phone = ?', [data.phone])
    if (existing.length > 0) {
      return error(res, '手机号已注册', 400)
    }
    
    await pool.query(
      `INSERT INTO merchants (username, password, company_name, credit_code, business_license,
       logo, description, company_type, industry, resource_types, contact_name, phone,
       address, tags, ambassador_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [data.phone, hashedPassword, data.company_name, data.credit_code, data.business_license,
       data.logo, data.description, data.company_type, data.industry,
       JSON.stringify(data.resource_types || []), data.contact_name, data.phone,
       data.address, JSON.stringify(data.tags || []), data.ambassador_id || null]
    )
    
    success(res, null, '注册成功，请等待审核')
  } catch (err) {
    console.error('Merchant register error:', err)
    error(res, '注册失败')
  }
}

// 获取轮播图
exports.getBanners = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM banners WHERE status = 1 AND (position = 'all' OR position = 'merchant' OR position = 'both') ORDER BY sort_order"
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取轮播图失败')
  }
}

// 获取配置
exports.getConfig = async (req, res) => {
  try {
    const [tags] = await pool.query('SELECT * FROM tags WHERE type = 2 AND status = 1')
    const [levels] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_levels'")
    const [benefits] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_benefits'")
    
    success(res, {
      tags,
      memberLevels: levels[0] ? JSON.parse(levels[0].config_value) : {},
      memberBenefits: benefits[0] ? JSON.parse(benefits[0].config_value) : {}
    })
  } catch (err) {
    error(res, '获取配置失败')
  }
}

// 推荐需求
exports.getRecommendDemands = async (req, res) => {
  try {
    const merchant_id = req.merchant.id
    
    const [[merchant]] = await pool.query('SELECT * FROM merchants WHERE id = ?', [merchant_id])
    const [[config]] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'match_algorithm'")
    const algorithmConfig = config?.config_value || '{}'
    
    const [demands] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE d.status = 1 AND c.status = 1
       ORDER BY d.created_at DESC
       LIMIT 20`
    )
    
    const result = demands.map(d => {
      const matchScore = calculateMatchScore(d, { tags: merchant.tags }, algorithmConfig)
      return {
        ...d,
        matchScore: Math.round(matchScore),
        matchHearts: getMatchHearts(matchScore)
      }
    }).sort((a, b) => b.matchScore - a.matchScore)
    
    success(res, result)
  } catch (err) {
    console.error('Get recommend demands error:', err)
    error(res, '获取推荐失败')
  }
}

// 需求大厅
exports.getDemands = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, district, sort } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'd.status = 1 AND c.status = 1'
    const params = []
    
    if (type) {
      where += ' AND d.demand_type = ?'
      params.push(type)
    }
    
    if (district) {
      where += ' AND c.district LIKE ?'
      params.push(`%${district}%`)
    }
    
    let orderBy = 'd.created_at DESC'
    if (sort === 'match') {
      orderBy = 'match_score DESC'
    }
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM demands d JOIN communities c ON d.community_id = c.id WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取需求列表失败')
  }
}

// 需求详情
exports.getDemandDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.address, c.households, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE d.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '需求不存在', 404)
    }
    
    await pool.query('UPDATE demands SET view_count = view_count + 1 WHERE id = ?', [id])
    
    // 检查会员等级是否可查看联系方式
    const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
    const canViewContact = merchant.member_level >= 3
    
    const result = { ...rows[0], canViewContact }
    
    if (!canViewContact) {
      delete result.address
    }
    
    success(res, result)
  } catch (err) {
    error(res, '获取详情失败')
  }
}

// 社区详情
exports.getCommunityDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT id, community_name, district, street, address, households, family_ratio,
       elderly_ratio, public_space_area, has_outdoor_plaza, has_commercial, has_school,
       has_park, logo, description, tags
       FROM communities WHERE id = ? AND status = 1`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '社区不存在', 404)
    }
    
    // 检查会员等级
    const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
    
    if (merchant.member_level < 3) {
      delete rows[0].address
    }
    
    success(res, rows[0])
  } catch (err) {
    error(res, '获取详情失败')
  }
}

// 资源大厅
exports.getResources = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'status = 1 AND merchant_id = ?'
    
    if (type) {
      where += ' AND resource_type = ?'
    }
    
    const [rows] = await pool.query(
      `SELECT * FROM resources WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.merchant.id, type, parseInt(pageSize), offset].filter(v => v !== undefined)
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM resources WHERE ' + where,
      [req.merchant.id, type].filter(v => v !== undefined)
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取资源列表失败')
  }
}

// 资源详情
exports.getResourceDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = ?', [id])
    
    if (rows.length === 0) {
      return error(res, '资源不存在', 404)
    }
    
    success(res, rows[0])
  } catch (err) {
    error(res, '获取详情失败')
  }
}

// 我的资源
exports.getMyResources = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'merchant_id = ?'
    const params = [req.merchant.id]
    
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM resources WHERE ' + where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM resources WHERE ' + where,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取资源列表失败')
  }
}

// 创建资源
exports.createResource = async (req, res) => {
  try {
    const data = req.body
    data.merchant_id = req.merchant.id
    
    const [result] = await pool.query(
      `INSERT INTO resources (merchant_id, resource_type, title, content, images, tags,
       min_amount, max_amount, quantity, specs, pickup_way, staff_count,
       work_duration, skill_requirements, service_scope, certification,
       price_range, media_type, coverage, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [data.merchant_id, data.resource_type, data.title, data.content,
       JSON.stringify(data.images || []), JSON.stringify(data.tags || []),
       data.min_amount, data.max_amount, data.quantity, data.specs, data.pickup_way,
       data.staff_count, data.work_duration, data.skill_requirements,
       data.service_scope, data.certification, data.price_range,
       data.media_type, data.coverage]
    )
    
    success(res, { id: result.insertId }, '资源发布成功，请等待审核')
  } catch (err) {
    console.error('Create resource error:', err)
    error(res, '发布资源失败')
  }
}

// 更新资源
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params
    
    const [[resource]] = await pool.query(
      'SELECT * FROM resources WHERE id = ? AND merchant_id = ?',
      [id, req.merchant.id]
    )
    
    if (!resource) {
      return error(res, '资源不存在', 404)
    }
    
    const data = req.body
    
    await pool.query(
      `UPDATE resources SET title = ?, content = ?, images = ?, tags = ?,
       min_amount = ?, max_amount = ?, quantity = ?, specs = ?, pickup_way = ?,
       staff_count = ?, work_duration = ?, skill_requirements = ?,
       service_scope = ?, certification = ?, price_range = ?,
       media_type = ?, coverage = ?, status = 0 WHERE id = ?`,
      [data.title, data.content, JSON.stringify(data.images || []),
       JSON.stringify(data.tags || []), data.min_amount, data.max_amount,
       data.quantity, data.specs, data.pickup_way, data.staff_count,
       data.work_duration, data.skill_requirements, data.service_scope,
       data.certification, data.price_range, data.media_type, data.coverage, id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

// 删除资源
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query(
      'DELETE FROM resources WHERE id = ? AND merchant_id = ? AND status != 1',
      [id, req.merchant.id]
    )
    
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// 我的对接
exports.getMyIntentions = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'merchant_id = ?'
    const params = [req.merchant.id]
    
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }
    
    const [rows] = await pool.query(
      `SELECT i.*, c.community_name,
       (SELECT title FROM demands WHERE id = i.demand_id) as demand_title,
       (SELECT title FROM resources WHERE id = i.resource_id) as resource_title
       FROM intentions i
       LEFT JOIN communities c ON i.community_id = c.id
       WHERE ${where}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM intentions WHERE ' + where,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取对接列表失败')
  }
}

// 发起对接
exports.createIntention = async (req, res) => {
  try {
    const data = req.body
    const merchantId = req.merchant.id
    
    // 检查是否已经发起过
    const [existing] = await pool.query(
      'SELECT id FROM intentions WHERE demand_id = ? AND merchant_id = ?',
      [data.demand_id, merchantId]
    )
    
    if (existing.length > 0) {
      return error(res, '已发起过对接', 400)
    }
    
    // 从需求表获取 community_id
    const [[demand]] = await pool.query('SELECT community_id FROM demands WHERE id = ?', [data.demand_id])
    if (!demand) {
      return error(res, '需求不存在', 404)
    }
    
    await pool.query(
      'INSERT INTO intentions (demand_id, merchant_id, community_id, intro) VALUES (?, ?, ?, ?)',
      [data.demand_id, merchantId, demand.community_id, data.intro || data.content || '']
    )
    
    success(res, null, '对接意向已发送')
  } catch (err) {
    error(res, '发起对接失败')
  }
}

// 取消对接
exports.cancelIntention = async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query(
      'UPDATE intentions SET status = 4 WHERE id = ? AND merchant_id = ?',
      [id, req.merchant.id]
    )
    
    success(res, null, '已取消对接')
  } catch (err) {
    error(res, '取消失败')
  }
}

// 留言
exports.getDemandComments = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_type,
       (SELECT company_name FROM merchants WHERE id = c.user_id AND c.user_type = 2) as user_name,
       (SELECT logo FROM merchants WHERE id = c.user_id AND c.user_type = 2) as user_logo
       FROM comments c
       WHERE c.demand_id = ? AND c.status = 1 AND (c.parent_id IS NULL OR c.parent_id = 0)
       ORDER BY c.created_at DESC`,
      [id]
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取留言失败')
  }
}

exports.createDemandComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    await pool.query(
      'INSERT INTO comments (demand_id, user_type, user_id, content) VALUES (?, 2, ?, ?)',
      [id, req.merchant.id, content]
    )
    
    success(res, null, '留言成功')
  } catch (err) {
    error(res, '留言失败')
  }
}

exports.getResourceComments = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_type,
       (SELECT community_name FROM communities WHERE id = c.user_id AND c.user_type = 1) as user_name,
       (SELECT logo FROM communities WHERE id = c.user_id AND c.user_type = 1) as user_logo
       FROM comments c
       WHERE c.resource_id = ? AND c.status = 1 AND (c.parent_id IS NULL OR c.parent_id = 0)
       ORDER BY c.created_at DESC`,
      [id]
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取留言失败')
  }
}

exports.createResourceComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    await pool.query(
      'INSERT INTO comments (resource_id, user_type, user_id, content) VALUES (?, 2, ?, ?)',
      [id, req.merchant.id, content]
    )
    
    success(res, null, '留言成功')
  } catch (err) {
    error(res, '留言失败')
  }
}

exports.replyComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    const [[comment]] = await pool.query('SELECT demand_id, resource_id FROM comments WHERE id = ?', [id])
    
    await pool.query(
      'INSERT INTO comments (demand_id, resource_id, user_type, user_id, content, parent_id) VALUES (?, ?, 2, ?, ?, ?)',
      [comment.demand_id, comment.resource_id, req.merchant.id, content, id]
    )
    
    success(res, null, '回复成功')
  } catch (err) {
    error(res, '回复失败')
  }
}

// 获取评论的回复列表
exports.getCommentReplies = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_type,
       (SELECT company_name FROM merchants WHERE id = c.user_id AND c.user_type = 2) as user_name,
       (SELECT community_name FROM communities WHERE id = c.user_id AND c.user_type = 1) as user_name,
       (SELECT logo FROM merchants WHERE id = c.user_id AND c.user_type = 2) as user_logo,
       (SELECT logo FROM communities WHERE id = c.user_id AND c.user_type = 1) as user_logo
       FROM comments c
       WHERE c.parent_id = ? AND c.status = 1
       ORDER BY c.created_at ASC`,
      [id]
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取回复失败')
  }
}

// 个人中心
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.company_name, m.logo, m.description, m.company_type, m.industry,
       m.resource_types, m.contact_name, m.phone, m.address, m.tags, m.member_level, m.star_rating,
       m.images, m.status,
       (SELECT COALESCE(SUM(view_count), 0) FROM resources WHERE merchant_id = m.id) as view_count,
       (SELECT MAX(end_date) FROM member_payments WHERE merchant_id = m.id AND status = 1) as member_expire_at
       FROM merchants m WHERE m.id = ?`,
      [req.merchant.id]
    )
    
    if (rows.length === 0) {
      return error(res, '用户不存在', 404)
    }
    
    const result = { ...rows[0] }
    // 解析 JSON 字段
    if (result.resource_types && typeof result.resource_types === 'string') {
      try { result.resource_types = JSON.parse(result.resource_types) } catch {}
    }
    if (result.tags && typeof result.tags === 'string') {
      try { result.tags = result.tags } catch {}
    }
    if (result.images && typeof result.images === 'string') {
      try { result.images = result.images } catch {}
    }
    
    success(res, result)
  } catch (err) {
    error(res, '获取信息失败')
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body
    
    await pool.query(
      `UPDATE merchants SET company_name = ?, logo = ?, description = ?, company_type = ?,
       industry = ?, resource_types = ?, contact_name = ?, phone = ?, address = ?,
       tags = ? WHERE id = ?`,
      [data.company_name, data.logo, data.description, data.company_type, data.industry,
       typeof data.resource_types === 'string' ? data.resource_types : JSON.stringify(data.resource_types || []),
       data.contact_name, data.phone, data.address,
       typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags || []),
       req.merchant.id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

// 会员信息
exports.getMemberInfo = async (req, res) => {
  try {
    const [[merchant]] = await pool.query(
      `SELECT m.member_level, m.star_rating,
       (SELECT MAX(end_date) FROM member_payments WHERE merchant_id = m.id AND status = 1) as expire_date
       FROM merchants m WHERE m.id = ?`,
      [req.merchant.id]
    )
    
    const [levels] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_levels'")
    const [benefits] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_benefits'")
    
    success(res, {
      ...merchant,
      levels: levels[0] ? JSON.parse(levels[0].config_value) : {},
      benefits: benefits[0] ? JSON.parse(benefits[0].config_value) : {}
    })
  } catch (err) {
    error(res, '获取会员信息失败')
  }
}

exports.getMemberLevels = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_levels'")
    success(res, rows[0] ? JSON.parse(rows[0].config_value) : {})
  } catch (err) {
    error(res, '获取会员等级失败')
  }
}

exports.upgradeMember = async (req, res) => {
  try {
    const { level, amount } = req.body
    
    // 创建缴费记录
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + 1)
    
    await pool.query(
      'INSERT INTO member_payments (merchant_id, level, amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 1)',
      [req.merchant.id, level, amount, startDate, endDate]
    )
    
    // 更新会员等级
    await pool.query('UPDATE merchants SET member_level = ? WHERE id = ?', [level, req.merchant.id])
    
    // 如果有招商大使，计算提成
    const [[merchant]] = await pool.query('SELECT ambassador_id FROM merchants WHERE id = ?', [req.merchant.id])
    if (merchant.ambassador_id) {
      const [[commissionConfig]] = await pool.query(
        "SELECT config_value FROM sys_configs WHERE config_key = 'ambassador_commission'"
      )
      const config = JSON.parse(commissionConfig?.config_value || '{"first":20,"renewal":10}')
      
      // 检查是否首次缴费
      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) as count FROM member_payments WHERE merchant_id = ? AND status = 1',
        [req.merchant.id]
      )
      
      const rate = count === 1 ? config.first : config.renewal
      const commission = amount * (rate / 100)
      
      await pool.query(
        `INSERT INTO commission_records (ambassador_id, merchant_id, payment_type, commission_rate, commission_amount, status)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [merchant.ambassador_id, req.merchant.id, count === 1 ? 1 : 2, rate, commission]
      )
      
      await pool.query(
        'UPDATE ambassadors SET total_merchants = total_merchants + 1, total_commission = total_commission + ? WHERE id = ?',
        [commission, merchant.ambassador_id]
      )
    }
    
    success(res, null, '升级成功')
  } catch (err) {
    console.error('Upgrade member error:', err)
    error(res, '升级失败')
  }
}

exports.getPaymentHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM member_payments WHERE merchant_id = ? ORDER BY created_at DESC',
      [req.merchant.id]
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取缴费记录失败')
  }
}
