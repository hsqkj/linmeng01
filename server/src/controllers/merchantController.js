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

// 专家注册（分步提交）
exports.expertRegister = async (req, res) => {
  try {
    const data = req.body
    const hashedPassword = await bcrypt.hash(data.phone.slice(-6), 10)
    
    // 检查手机号是否已注册
    const [existing] = await pool.query('SELECT id FROM merchants WHERE phone = ?', [data.phone])
    if (existing.length > 0) {
      return error(res, '手机号已注册', 400)
    }
    
    // company_type = 'expert' 标识专家
    // contact_name 存真实姓名，company_name 存 "专家-{姓名}"
    const companyName = `专家-${data.realName}`
    
    await pool.query(
      `INSERT INTO merchants (username, password, company_name, contact_name, phone,
       company_type, industry, logo, description,
       social_identity, honors, expert_intro, tags, images,
       status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        data.phone, hashedPassword, companyName, data.realName, data.phone,
        'expert', data.expertType || '', data.personalPhoto || null, data.intro || null,
        data.socialIdentity || null, data.honors || null, null,
        JSON.stringify(data.tags || []), data.idCardPhoto ? JSON.stringify([data.idCardPhoto]) : null
      ]
    )
    
    success(res, null, '专家注册成功，请等待审核')
  } catch (err) {
    console.error('Expert register error:', err)
    error(res, '专家注册失败')
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

// 推荐需求（公开接口，不需要登录）
exports.getRecommendDemands = async (req, res) => {
  try {
    const [demands] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE d.status = 1 AND c.status = 1
       ORDER BY d.created_at DESC
       LIMIT 20`
    )

    // 公开接口统一返回中等匹配度，登录后展示个性化
    const result = demands.map(d => ({
      ...d,
      matchScore: 3,
      matchHearts: 3
    }))

    success(res, result)
  } catch (err) {
    console.error('Get recommend demands error:', err)
    error(res, '获取推荐失败')
  }
}

// 需求大厅
const DEMAND_TYPE_MAP = { 0: '活动赞助', 1: '专家服务', 2: '空间运营', 3: '物资赞助', 4: '健康服务', 5: '教育培训' }
const DEMAND_TYPE_NAME = { '活动赞助': '活动赞助', '专家服务': '专家服务', '空间运营': '空间运营', '物资赞助': '物资赞助', '健康服务': '健康服务', '教育培训': '教育培训' }

exports.getDemands = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, district, street, community, sort, keyword } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'd.status = 1 AND c.status = 1'
    const params = []
    
    if (type) {
      // 支持数字或字符串
      const typeNum = parseInt(type)
      if (!isNaN(typeNum)) {
        where += ' AND d.demand_type = ?'
        params.push(typeNum)
      } else {
        // 字符串类型名，转数字
        const typeVal = DEMAND_TYPE_NAME[type]
        if (typeVal) {
          const idx = Object.values(DEMAND_TYPE_MAP).indexOf(typeVal)
          if (idx >= 0) { where += ' AND d.demand_type = ?'; params.push(idx) }
        }
      }
    }
    
    if (district) {
      where += ' AND c.district LIKE ?'
      params.push(`%${district}%`)
    }
    
    if (street) {
      where += ' AND c.street LIKE ?'
      params.push(`%${street}%`)
    }
    
    if (community) {
      where += ' AND c.community_name LIKE ?'
      params.push(`%${community}%`)
    }
    
    if (keyword) {
      where += ' AND (d.title LIKE ? OR d.content LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    const orderBy = 'd.created_at DESC'
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM demands d JOIN communities c ON d.community_id = c.id WHERE ${where}`,
      params
    )

    const result = rows.map(d => ({
      ...d,
      demand_type_name: DEMAND_TYPE_MAP[d.demand_type] || '需求',
      matchScore: 3,
      matchHearts: 3
    }))
    
    pageSuccess(res, result, total, page, pageSize)
  } catch (err) {
    console.error('getDemands error:', err)
    error(res, '获取需求列表失败')
  }
}

// 需求详情（公开接口，联系方式根据会员等级决定）
exports.getDemandDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.address, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE d.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '需求不存在', 404)
    }
    
    await pool.query('UPDATE demands SET view_count = view_count + 1 WHERE id = ?', [id])
    
    const row = rows[0]
    row.demand_type_name = DEMAND_TYPE_MAP[row.demand_type] || '需求'
    
    // 添加匹配度信息
    row.matchScore = 3
    row.matchHearts = 3
    
    // 联系方式：仅金牌会员（Lv3）及以上可见
    let canViewContact = false
    if (req.merchant?.id) {
      const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
      canViewContact = merchant?.member_level >= 3
    }
    
    const result = { ...row, canViewContact }
    if (!canViewContact) {
      delete result.address
    }
    
    success(res, result)
  } catch (err) {
    console.error('getDemandDetail error:', err)
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

// 资源大厅（公开接口）
exports.getResources = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, keyword } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    
    let where = 'r.status = 1 AND m.status = 1'
    const params = []
    
    if (type) {
      where += ' AND r.resource_type = ?'
      params.push(type)
    }
    
    if (keyword) {
      where += ' AND (r.title LIKE ? OR r.description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    const [rows] = await pool.query(
      `SELECT r.*, m.company_name, m.logo as merchant_logo, m.member_level, m.star_rating
       FROM resources r JOIN merchants m ON r.merchant_id = m.id
       WHERE ${where}
       ORDER BY m.member_level DESC, m.star_rating DESC, r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM resources r JOIN merchants m ON r.merchant_id = m.id WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('getResources error:', err)
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
    
    // Lv0 免费试用用户不可留言
    const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
    if (!merchant || merchant.member_level === 0) {
      return error(res, '免费试用用户不可留言，请升级会员', 403)
    }
    
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
    
    // Lv0 免费试用用户不可留言
    const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
    if (!merchant || merchant.member_level === 0) {
      return error(res, '免费试用用户不可留言，请升级会员', 403)
    }
    
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
    
    // Lv0 免费试用用户不可回复留言
    const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
    if (!merchant || merchant.member_level === 0) {
      return error(res, '免费试用用户不可回复留言，请升级会员', 403)
    }
    
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
       m.images, m.status, m.social_identity, m.honors, m.expert_intro,
       (SELECT COALESCE(SUM(view_count), 0) FROM resources WHERE merchant_id = m.id) as view_count,
       (SELECT MAX(end_date) FROM member_payments WHERE merchant_id = m.id AND status = 1) as member_expire_at
       FROM merchants m WHERE m.id = ?`,
      [req.merchant.id]
    )
    
    if (rows.length === 0) {
      return error(res, '用户不存在', 404)
    }
    
    const result = { ...rows[0] }
    // 确保数字类型
    result.status = Number(result.status)
    result.member_level = Number(result.member_level)
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

// 收藏需求
exports.toggleFavorite = async (req, res) => {
  try {
    const { demand_id } = req.body
    if (!demand_id) return error(res, '缺少demand_id', 400)
    
    const [existing] = await pool.query(
      'SELECT id FROM demand_favorite WHERE merchant_id = ? AND demand_id = ?',
      [req.merchant.id, demand_id]
    )
    
    if (existing.length > 0) {
      // 取消收藏
      await pool.query('DELETE FROM demand_favorite WHERE merchant_id = ? AND demand_id = ?', [req.merchant.id, demand_id])
      success(res, { favorited: false }, '已取消收藏')
    } else {
      // 添加收藏
      await pool.query('INSERT INTO demand_favorite (merchant_id, demand_id) VALUES (?, ?)', [req.merchant.id, demand_id])
      success(res, { favorited: true }, '已收藏')
    }
  } catch (err) {
    error(res, '操作失败')
  }
}

exports.getMyFavorites = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize
    
    const [rows] = await pool.query(
      `SELECT df.id, df.create_time, d.*, c.community_name, c.district, c.street
       FROM demand_favorite df
       JOIN demands d ON df.demand_id = d.id
       JOIN communities c ON d.community_id = c.id
       WHERE df.merchant_id = ?
       ORDER BY df.create_time DESC
       LIMIT ? OFFSET ?`,
      [req.merchant.id, parseInt(pageSize), parseInt(offset)]
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM demand_favorite WHERE merchant_id = ?',
      [req.merchant.id]
    )
    
    const result = rows.map(d => ({
      ...d,
      demand_type_name: DEMAND_TYPE_MAP[d.demand_type] || '需求',
      favorited: true,
      matchScore: 3,
      matchHearts: 3
    }))
    
    pageSuccess(res, result, total, page, pageSize)
  } catch (err) {
    error(res, '获取收藏失败')
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body
    
    await pool.query(
      `UPDATE merchants SET company_name = ?, logo = ?, description = ?, company_type = ?,
       industry = ?, resource_types = ?, contact_name = ?, phone = ?, address = ?,
       tags = ?, social_identity = ?, honors = ?, expert_intro = ? WHERE id = ?`,
      [data.company_name, data.logo, data.description, data.company_type, data.industry,
       typeof data.resource_types === 'string' ? data.resource_types : JSON.stringify(data.resource_types || []),
       data.contact_name, data.phone, data.address,
       typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags || []),
       data.social_identity || '', data.honors || '', data.expert_intro || '',
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
    const levels = rows[0] ? JSON.parse(rows[0].config_value) : []
    success(res, Array.isArray(levels) ? { levels } : { levels: [] })
  } catch (err) {
    error(res, '获取会员等级失败')
  }
}

exports.upgradeMember = async (req, res) => {
  try {
    const { level, amount } = req.body
    
    // 获取等级有效期配置
    const [levelRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'member_levels'")
    const levelConfig = levelRows[0] ? JSON.parse(levelRows[0].config_value) : []
    const lvConfig = levelConfig.find(l => l.level === level)
    const validityMonths = lvConfig?.validity_period || 12

    // 创建缴费记录
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + validityMonths)
    
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

// 获取商家自己的系统通知
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const merchantId = req.merchant.id

    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total FROM system_notifications
      WHERE status = 1
        AND (target_type IN ('all', 'merchant', 0, 2))
        AND (target_ids IS NULL OR target_ids = '' OR JSON_CONTAINS(target_ids, ?))
    `, [String(merchantId)])

    const [rows] = await pool.query(`
      SELECT n.id, n.title, n.content, n.priority,
        CASE n.priority
          WHEN 2 THEN 'urgent'
          WHEN 1 THEN 'important'
          ELSE 'normal'
        END as tagType,
        CASE n.priority
          WHEN 2 THEN '紧急'
          WHEN 1 THEN '重要'
          ELSE '系统公告'
        END as tag,
        n.published_at as time,
        CASE WHEN EXISTS (
          SELECT 1 FROM notification_reads r
          WHERE r.notification_id = n.id AND r.user_type = 'merchant' AND r.user_id = ?
        ) THEN 1 ELSE 0 END as is_read
      FROM system_notifications n
      WHERE n.status = 1
        AND (n.target_type IN ('all', 'merchant', 0, 2))
        AND (n.target_ids IS NULL OR n.target_ids = '' OR JSON_CONTAINS(n.target_ids, ?))
      ORDER BY n.priority DESC, n.published_at DESC
      LIMIT ? OFFSET ?
    `, [merchantId, String(merchantId), parseInt(pageSize), offset])

    pageSuccess(res, rows, countRows[0].total, parseInt(page), parseInt(pageSize))
  } catch (err) {
    console.error('getMyNotifications error:', err)
    error(res, '获取通知列表失败')
  }
}

// 获取未读通知数量
exports.getUnreadCount = async (req, res) => {
  try {
    const merchantId = req.merchant?.id
    if (!merchantId) {
      return error(res, '未登录')
    }
    // 查询未读通知数量（排除已读的）- 同时兼容数字和字符串格式
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM system_notifications n
       WHERE n.status = 1
       AND (n.target_type IN ('all', 'merchant', 0, 2))
       AND (n.target_ids IS NULL OR n.target_ids = '' OR JSON_CONTAINS(n.target_ids, ?))
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads r
         WHERE r.notification_id = n.id AND r.user_type = 'merchant' AND r.user_id = ?
       )`,
      [String(merchantId), merchantId]
    )
    success(res, { count })
  } catch (err) {
    console.error('getUnreadCount error:', err)
    error(res, '获取未读数量失败')
  }
}

// 标记通知已读
exports.markNotificationsRead = async (req, res) => {
  try {
    const merchantId = req.merchant?.id
    if (!merchantId) {
      return error(res, '未登录')
    }
    // 获取所有未读通知ID
    const [notifications] = await pool.query(
      `SELECT n.id FROM system_notifications n
       WHERE n.status = 1
       AND (n.target_type IN ('all', 'merchant', 0, 2))
       AND (n.target_ids IS NULL OR n.target_ids = '' OR JSON_CONTAINS(n.target_ids, ?))
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads r
         WHERE r.notification_id = n.id AND r.user_type = 'merchant' AND r.user_id = ?
       )`,
      [String(merchantId), merchantId]
    )
    
    // 批量插入已读记录
    if (notifications.length > 0) {
      const values = notifications.map(n => [n.id, 'merchant', merchantId])
      await pool.query(
        'INSERT IGNORE INTO notification_reads (notification_id, user_type, user_id) VALUES ?',
        [values]
      )
    }
    success(res, { marked: notifications.length })
  } catch (err) {
    console.error('markNotificationsRead error:', err)
    error(res, '标记已读失败')
  }
}

// 标记单条通知已读
exports.markOneNotificationRead = async (req, res) => {
  try {
    const merchantId = req.merchant?.id
    if (!merchantId) {
      return error(res, '未登录')
    }
    const notificationId = parseInt(req.params.id)
    if (!notificationId) {
      return error(res, '无效的通知ID')
    }
    // 插入已读记录
    await pool.query(
      'INSERT IGNORE INTO notification_reads (notification_id, user_type, user_id) VALUES (?, ?, ?)',
      [notificationId, 'merchant', merchantId]
    )
    success(res, { success: true })
  } catch (err) {
    console.error('markOneNotificationRead error:', err)
    error(res, '标记已读失败')
  }
}
