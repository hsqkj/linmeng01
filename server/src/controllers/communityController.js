/**
 * 社区控制器
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
      'SELECT * FROM communities WHERE phone = ?',
      [phone]
    )
    
    if (rows.length === 0) {
      return error(res, '账号不存在，请先注册', 401)
    }
    
    const community = rows[0]
    
    if (community.status === 2) {
      return error(res, '账号已被禁用', 403)
    }
    
    // 验证码登录（测试版：接受123456或888888）
    if (code !== undefined) {
      const validCodes = ['123456', '888888']
      if (!validCodes.includes(code)) {
        return error(res, '验证码错误', 401)
      }
    } else if (password) {
      // 密码登录
      const isMatch = await bcrypt.compare(password, community.password)
      if (!isMatch) {
        return error(res, '手机号或密码错误', 401)
      }
    } else {
      return error(res, '请输入验证码', 400)
    }
    
    const token = jwt.sign({
      id: community.id,
      phone: community.phone,
      role: 'community'
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn })
    
    await pool.query('UPDATE communities SET last_login_at = NOW() WHERE id = ?', [community.id])
    
    const { password: _, ...communityData } = community
    success(res, { token, community: communityData })
  } catch (err) {
    console.error('Community login error:', err)
    error(res, '登录失败')
  }
}

// 注册
exports.register = async (req, res) => {
  try {
    const data = req.body
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // 检查手机号是否已注册
    const [existing] = await pool.query('SELECT id FROM communities WHERE phone = ?', [data.phone])
    if (existing.length > 0) {
      return error(res, '手机号已注册', 400)
    }
    
    const [result] = await pool.query(
      `INSERT INTO communities (username, password, real_name, phone, district, street, community, 
       community_name, position, households, family_ratio, elderly_ratio, public_space_area,
       has_outdoor_plaza, has_commercial, has_school, has_park, merchant_count,
       logo, description, images, address, tags, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [data.phone, hashedPassword, data.real_name, data.phone, data.district, data.street,
       data.community, data.community_name, data.position, data.households, data.family_ratio,
       data.elderly_ratio, data.public_space_area, data.has_outdoor_plaza, data.has_commercial,
       data.has_school, data.has_park, data.merchant_count, data.logo, data.description,
       JSON.stringify(data.images || []), data.address, JSON.stringify(data.tags || [])]
    )
    
    success(res, { id: result.insertId }, '注册成功，请等待审核')
  } catch (err) {
    console.error('Community register error:', err)
    error(res, '注册失败')
  }
}

// 获取轮播图
exports.getBanners = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM banners WHERE status = 1 AND (position = 'all' OR position = 'community' OR position = 'both') ORDER BY sort_order"
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取轮播图失败')
  }
}

// 获取配置
exports.getConfig = async (req, res) => {
  try {
    // 获取标签
    const [tags] = await pool.query('SELECT * FROM tags WHERE type = 1 AND status = 1')
    
    // 获取地区
    const [regions] = await pool.query('SELECT * FROM regions ORDER BY level, sort_order')
    
    success(res, { tags, regions })
  } catch (err) {
    error(res, '获取配置失败')
  }
}

// 推荐资源
exports.getRecommendResources = async (req, res) => {
  try {
    // 获取商家资源（公开接口，不需要登录）
    const [resources] = await pool.query(
      `SELECT r.*, m.company_name, m.logo as merchant_logo, m.star_rating, m.member_level
       FROM resources r
       JOIN merchants m ON r.merchant_id = m.id
       WHERE r.status = 1 AND m.status = 1
       ORDER BY m.member_level DESC, m.star_rating DESC
       LIMIT 20`
    )

    // 公开接口统一返回中等匹配度，登录后展示个性化
    const result = resources.map(r => ({
      ...r,
      matchScore: 3,
      matchHearts: 3
    }))

    success(res, result)
  } catch (err) {
    console.error('Get recommend resources error:', err)
    error(res, '获取推荐失败')
  }
}

// 资源大厅
exports.getResources = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, level, sort, keyword, distance } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'r.status = 1 AND m.status = 1'
    const params = []
    
    if (type) {
      where += ' AND r.resource_type = ?'
      params.push(type)
    }
    
    if (level) {
      where += ' AND m.member_level >= ?'
      params.push(level)
    }
    
    if (keyword) {
      where += ' AND (r.title LIKE ? OR r.content LIKE ? OR m.company_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    // distance参数：前端筛选用（暂无坐标数据，暂不实际过滤）
    
    let orderBy = 'm.member_level DESC, m.star_rating DESC, r.created_at DESC'
    if (sort === 'newest') orderBy = 'r.created_at DESC'
    if (sort === 'rating') orderBy = 'm.star_rating DESC, r.created_at DESC'
    if (sort === 'hot') orderBy = 'r.view_count DESC, r.created_at DESC'
    
    const [rows] = await pool.query(
      `SELECT r.*, m.company_name, m.logo as merchant_logo, m.star_rating, m.member_level
       FROM resources r
       JOIN merchants m ON r.merchant_id = m.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    // 获取匹配度
    let matchResult = rows.map(r => ({ ...r, matchScore: 3, matchHearts: 3 }))
    if (req.community?.id) {
      const [[community]] = await pool.query('SELECT tags FROM communities WHERE id = ?', [req.community.id])
      const [[config]] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'match_algorithm'")
      const algorithmConfig = config?.config_value || '{}'
      matchResult = rows.map(r => {
        const matchScore = calculateMatchScore({ tags: community?.tags }, r, algorithmConfig)
        return {
          ...r,
          matchScore: Math.round(matchScore),
          matchHearts: getMatchHearts(matchScore)
        }
      })
    }
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM resources r JOIN merchants m ON r.merchant_id = m.id WHERE ${where}`,
      params
    )
    
    pageSuccess(res, matchResult, total, page, pageSize)
  } catch (err) {
    error(res, '获取资源列表失败')
  }
}

// 资源详情
exports.getResourceDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT r.*, m.company_name, m.logo as merchant_logo, m.contact_name, m.phone as merchant_phone,
       m.star_rating, m.member_level, m.description as merchant_description
       FROM resources r
       JOIN merchants m ON r.merchant_id = m.id
       WHERE r.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '资源不存在', 404)
    }
    
    // 更新浏览数
    await pool.query('UPDATE resources SET view_count = view_count + 1 WHERE id = ?', [id])
    
    // 计算匹配度（根据社区标签与商家标签匹配）
    let matchScore = 3
    let matchHearts = 3
    if (req.community?.id) {
      try {
        const [[community]] = await pool.query('SELECT tags FROM communities WHERE id = ?', [req.community.id])
        const [[config]] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'match_algorithm'")
        const algorithmConfig = config?.config_value || '{}'
        matchScore = calculateMatchScore({ tags: community?.tags }, rows[0], algorithmConfig)
        matchHearts = getMatchHearts(matchScore)
      } catch {}
    }
    
    // 检查是否可以查看联系方式（金牌会员Lv3及以上）
    const canViewContact = rows[0].member_level >= 3
    
    const result = {
      ...rows[0],
      matchScore: Math.round(matchScore),
      matchHearts
    }
    
    if (!canViewContact) {
      delete result.merchant_phone
    }
    
    success(res, result)
  } catch (err) {
    error(res, '获取详情失败')
  }
}

// 商家详情
exports.getMerchantDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT id, company_name, logo, description, industry, contact_name, tags, star_rating, member_level
       FROM merchants WHERE id = ? AND status = 1`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '商家不存在', 404)
    }
    
    // 检查是否可以查看联系方式
    const canViewContact = rows[0].member_level >= 3
    
    if (!canViewContact) {
      delete rows[0].contact_name
    }
    
    success(res, rows[0])
  } catch (err) {
    error(res, '获取商家详情失败')
  }
}

// 需求大厅
exports.getDemands = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, audience, sort } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'd.status = 1'
    const params = []
    
    if (type) {
      where += ' AND d.demand_type = ?'
      params.push(type)
    }
    
    let orderBy = 'd.created_at DESC'
    if (sort === 'hot') {
      orderBy = 'd.view_count DESC, d.created_at DESC'
    }
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households, c.family_ratio, c.elderly_ratio
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM demands d WHERE ${where}`,
      params
    )
    
    const result = rows.map(d => ({ ...d, matchScore: 3, matchHearts: 3 }))
    pageSuccess(res, result, total, page, pageSize)
  } catch (err) {
    error(res, '获取需求列表失败')
  }
}

// 需求详情
exports.getDemandDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.address
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE d.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '需求不存在', 404)
    }
    
    await pool.query('UPDATE demands SET view_count = view_count + 1 WHERE id = ?', [id])
    
    success(res, rows[0])
  } catch (err) {
    error(res, '获取详情失败')
  }
}

// 我的需求
exports.getMyDemands = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'community_id = ?'
    const params = [req.community.id]
    
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }
    
    const [rows] = await pool.query(
      `SELECT * FROM demands WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM demands WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取需求列表失败')
  }
}

// 创建需求
exports.createDemand = async (req, res) => {
  try {
    const data = req.body
    data.community_id = req.community.id
    
    const [result] = await pool.query(
      `INSERT INTO demands (community_id, demand_type, title, activity_type, target_audience,
       start_time, end_time, location_type, location_name, expected_count, content,
       required_types, budget_min, budget_max, material_details, human_details,
       tech_details, media_details, return_ways, return_value, images, tags, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.community_id, data.demand_type, data.title, data.activity_type,
       JSON.stringify(data.target_audience || []), data.start_time, data.end_time,
       data.location_type, data.location_name, data.expected_count, data.content,
       JSON.stringify(data.required_types || []), data.budget_min, data.budget_max,
       JSON.stringify(data.material_details || {}), JSON.stringify(data.human_details || {}),
       JSON.stringify(data.tech_details || {}), JSON.stringify(data.media_details || {}),
       JSON.stringify(data.return_ways || []), data.return_value, JSON.stringify(data.images || []),
       JSON.stringify(data.tags || []), data.deadline]
    )
    
    success(res, { id: result.insertId }, '需求发布成功，请等待审核')
  } catch (err) {
    console.error('Create demand error:', err)
    error(res, '发布需求失败')
  }
}

// 更新需求
exports.updateDemand = async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查是否属于当前用户
    const [[demand]] = await pool.query(
      'SELECT * FROM demands WHERE id = ? AND community_id = ?',
      [id, req.community.id]
    )
    
    if (!demand) {
      return error(res, '需求不存在', 404)
    }
    
    if (demand.status === 1) {
      return error(res, '已审核通过的无法修改', 400)
    }
    
    const data = req.body
    
    await pool.query(
      `UPDATE demands SET title = ?, activity_type = ?, target_audience = ?,
       start_time = ?, end_time = ?, location_type = ?, location_name = ?,
       expected_count = ?, content = ?, required_types = ?, budget_min = ?,
       budget_max = ?, return_ways = ?, return_value = ?, images = ?,
       tags = ?, deadline = ?, status = 0 WHERE id = ?`,
      [data.title, data.activity_type, JSON.stringify(data.target_audience || []),
       data.start_time, data.end_time, data.location_type, data.location_name,
       data.expected_count, data.content, JSON.stringify(data.required_types || []),
       data.budget_min, data.budget_max, JSON.stringify(data.return_ways || []),
       data.return_value, JSON.stringify(data.images || []), JSON.stringify(data.tags || []),
       data.deadline, id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

// 删除需求
exports.deleteDemand = async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query(
      'DELETE FROM demands WHERE id = ? AND community_id = ? AND status != 1',
      [id, req.community.id]
    )
    
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// 批量导入
exports.importDemands = async (req, res) => {
  try {
    const { demands } = req.body
    
    for (const demand of demands) {
      await pool.query(
        `INSERT INTO demands (community_id, demand_type, title, activity_type, content,
         required_types, return_ways, status) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [req.community.id, demand.demand_type, demand.title, demand.activity_type,
         demand.content, JSON.stringify(demand.required_types || []),
         JSON.stringify(demand.return_ways || [])]
      )
    }
    
    success(res, { count: demands.length }, '导入成功')
  } catch (err) {
    error(res, '导入失败')
  }
}

// 下载模板
exports.downloadTemplate = async (req, res) => {
  const template = {
    columns: ['demand_type', 'title', 'activity_type', 'content', 'required_types', 'return_ways'],
    examples: [
      { demand_type: '1', title: '六一儿童节亲子嘉年华', activity_type: '亲子活动', content: '举办亲子活动需要赞助', required_types: '["资金","物资"]', return_ways: '["冠名权","展台"]' }
    ]
  }
  success(res, template)
}

// 我的对接
exports.getMyIntentions = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type } = req.query
    const offset = (page - 1) * pageSize
    
    let where = 'community_id = ?'
    const params = [req.community.id]
    
    const [rows] = await pool.query(
      `SELECT i.*, m.company_name, m.logo as merchant_logo, m.star_rating,
       (SELECT title FROM demands WHERE id = i.demand_id) as demand_title,
       (SELECT title FROM resources WHERE id = i.resource_id) as resource_title
       FROM intentions i
       LEFT JOIN merchants m ON i.merchant_id = m.id
       WHERE ${where}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM intentions WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取对接列表失败')
  }
}

// 接受对接
exports.acceptIntention = async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query(
      'UPDATE intentions SET status = 1, response = ? WHERE id = ? AND community_id = ?',
      ['已接受', id, req.community.id]
    )
    
    success(res, null, '已接受对接')
  } catch (err) {
    error(res, '操作失败')
  }
}

// 拒绝对接
exports.rejectIntention = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    
    await pool.query(
      'UPDATE intentions SET status = 2, response = ? WHERE id = ? AND community_id = ?',
      [reason || '已拒绝', id, req.community.id]
    )
    
    success(res, null, '已拒绝对接')
  } catch (err) {
    error(res, '操作失败')
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
      'INSERT INTO comments (demand_id, user_type, user_id, content) VALUES (?, 1, ?, ?)',
      [id, req.community.id, content]
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
      'INSERT INTO comments (resource_id, user_type, user_id, content) VALUES (?, 1, ?, ?)',
      [id, req.community.id, content]
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
      'INSERT INTO comments (demand_id, resource_id, user_type, user_id, content, parent_id) VALUES (?, ?, 1, ?, ?, ?)',
      [comment.demand_id, comment.resource_id, req.community.id, content, id]
    )
    
    success(res, null, '回复成功')
  } catch (err) {
    error(res, '回复失败')
  }
}

// 个人中心
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, community, community_name, position, households, family_ratio, elderly_ratio, public_space_area, has_outdoor_plaza, has_commercial, has_school, has_park, merchant_count, logo, description, images, address, tags, status FROM communities WHERE id = ?',
      [req.community.id]
    )
    
    if (rows.length === 0) {
      return error(res, '用户不存在', 404)
    }
    
    const result = { ...rows[0] }
    // 解析 JSON 字段
    try { result.images = result.images ? (typeof result.images === 'string' ? JSON.parse(result.images) : result.images) : [] } catch { result.images = [] }
    try { result.tags = result.tags ? (typeof result.tags === 'string' ? JSON.parse(result.tags) : result.tags) : [] } catch { result.tags = [] }
    // 添加统计
    const [[demandCount]] = await pool.query('SELECT COUNT(*) as cnt FROM demands WHERE community_id = ?', [req.community.id])
    const [[intentionCount]] = await pool.query("SELECT COUNT(*) as cnt FROM intentions WHERE community_id = ? AND status = 3", [req.community.id])
    result.demandCount = demandCount?.cnt || 0
    result.intentionCount = intentionCount?.cnt || 0
    
    success(res, result)
  } catch (err) {
    error(res, '获取信息失败')
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body
    
    await pool.query(
      `UPDATE communities SET logo = ?, description = ?, images = ?, tags = ?,
       households = ?, family_ratio = ?, elderly_ratio = ?, public_space_area = ?,
       has_outdoor_plaza = ?, has_commercial = ?, has_school = ?, has_park = ?,
       merchant_count = ?, position = ?, address = ? WHERE id = ?`,
      [data.logo || null, data.description || '', data.images ? JSON.stringify(data.images) : null,
       data.tags ? JSON.stringify(Array.isArray(data.tags) ? data.tags : []) : null,
       data.households || null, data.family_ratio || null, data.elderly_ratio || null, data.public_space_area || null,
       data.has_outdoor_plaza || 0, data.has_commercial || 0, data.has_school || 0, data.has_park || 0,
       data.merchant_count || null, data.position || '', data.address || '', req.community.id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

// 奖励明细
exports.getRewards = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, i.demand_id, i.resource_id,
       (SELECT title FROM demands WHERE id = i.demand_id) as demand_title,
       (SELECT title FROM resources WHERE id = i.resource_id) as resource_title
       FROM reward_records r
       JOIN intentions i ON r.intention_id = i.id
       WHERE r.community_id = ?
       ORDER BY r.created_at DESC`,
      [req.community.id]
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取奖励记录失败')
  }
}

// 我的留言（留言咨询 - 只看自己发的和回复）
exports.getMyComments = async (req, res) => {
  try {
    const communityId = req.community.id

    // 1. 找出当前社区发出的所有顶级留言（user_type=1, user_id=communityId）
    const [myComments] = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_type, c.resource_id, c.demand_id,
       CASE WHEN c.resource_id IS NOT NULL THEN 'resource' ELSE 'demand' END as comment_type,
       (SELECT title FROM resources WHERE id = c.resource_id) as resource_title,
       (SELECT title FROM demands WHERE id = c.demand_id) as demand_title,
       (SELECT company_name FROM merchants WHERE id = r.merchant_id) as merchant_name
       FROM comments c
       LEFT JOIN resources r ON c.resource_id = r.id
       WHERE c.user_type = 1 AND c.user_id = ? AND (c.parent_id IS NULL OR c.parent_id = 0)
       ORDER BY c.created_at DESC`,
      [communityId]
    )

    // 2. 获取所有留言ID（含子回复）
    const commentIds = myComments.map(c => c.id)

    let repliesMap = {}
    if (commentIds.length > 0) {
      // 3. 获取这些留言的所有回复
      const [allReplies] = await pool.query(
        `SELECT c.id, c.parent_id, c.content, c.created_at, c.user_type, c.user_id,
         (SELECT community_name FROM communities WHERE id = c.user_id AND c.user_type = 1) as replier_community,
         (SELECT company_name FROM merchants WHERE id = c.user_id AND c.user_type = 2) as replier_merchant
         FROM comments c
         WHERE c.parent_id IN (${commentIds.map(() => '?').join(',')})
         ORDER BY c.created_at ASC`,
        commentIds
      )

      // 4. 按 parent_id 分组
      for (const r of allReplies) {
        if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = []
        repliesMap[r.parent_id].push({
          id: r.id,
          name: r.user_type === 1
            ? (r.replier_community || '某社区')
            : (r.replier_merchant || '商家用户'),
          avatar: null,
          text: r.content,
          time: r.created_at,
          isMine: r.user_id === communityId && r.user_type === 1
        })
      }
    }

    // 5. 组合结果
    const result = myComments.map(c => ({
      id: c.id,
      sender: c.user_type === 1 ? '我（社区）' : (c.merchant_name || '商家'),
      avatar: null,
      content: c.content,
      time: c.created_at,
      comment_type: c.comment_type,
      resource_title: c.resource_title,
      demand_title: c.demand_title,
      replies: repliesMap[c.id] || []
    }))

    success(res, result)
  } catch (err) {
    console.error('Get my comments error:', err)
    error(res, '获取留言失败')
  }
}
