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
      return error(res, '该手机号尚未注册，请先注册', 401)
    }
    
    const community = rows[0]
    
    if (community.status === 0) {
      return error(res, '账号审核中，请耐心等待', 401)
    }
    
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

    // 密码校验
    if (!data.password) return error(res, '请设置登录密码', 400)
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // 检查手机号是否已注册
    const [existing] = await pool.query('SELECT id FROM communities WHERE phone = ?', [data.phone])
    if (existing.length > 0) {
      return error(res, '手机号已注册', 400)
    }

    // 检查用户名是否已被使用
    if (data.username) {
      const [uExisting] = await pool.query('SELECT id FROM communities WHERE username = ?', [data.username])
      if (uExisting.length > 0) {
        return error(res, '用户名已被使用，请换一个', 400)
      }
    }

    // username 优先用传入的，否则回退到手机号
    const username = data.username || data.phone
    
    const [result] = await pool.query(
      `INSERT INTO communities (username, password, real_name, phone, district, street, community, 
       community_name, position, households, family_ratio, elderly_ratio, public_space_area,
       has_outdoor_plaza, has_commercial, has_school, has_park, merchant_count,
       logo, description, images, address, tags, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [username, hashedPassword, data.real_name, data.phone, data.district, data.street,
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
    
    // 获取资源类型配置
    const [typeRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'")
    let resourceTypes = []
    if (typeRows.length > 0 && typeRows[0].config_value) {
      try {
        const basicTypes = JSON.parse(typeRows[0].config_value)
        resourceTypes = (basicTypes.resourceTypes || []).filter(t => t.enabled !== false).map(t => t.name)
      } catch {}
    }
    
    success(res, { tags, regions, resourceTypes })
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

    // 解析 images 字段（从 JSON 字符串转为数组）
    resources.forEach(r => {
      if (r.images) {
        try { r.images = JSON.parse(r.images) } catch { r.images = [] }
      } else {
        r.images = []
      }
    })

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

// 资源类型字符串→整数映射
const RESOURCE_TYPE_MAP = {
  '便民服务': 0, '教育培训': 1, '健康医疗': 2, '体育健身': 3,
  '文化娱乐': 4, '养老服务': 5, '社区商业': 6, '公益活动': 7,
  '活动赞助': 8, '技能培训': 9
}

// 资源大厅
exports.getResources = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, level, sort, keyword, distance } = req.query
    const offset = (page - 1) * pageSize

    let where = 'r.status = 1 AND m.status = 1'
    const params = []

    if (type) {
      // 支持字符串类型名或整数
      const typeVal = RESOURCE_TYPE_MAP[type] !== undefined ? RESOURCE_TYPE_MAP[type] : parseInt(type)
      where += ' AND r.resource_type = ?'
      params.push(typeVal)
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
    
    // 解析 images 字段（从 JSON 字符串转为数组）
    rows.forEach(r => {
      if (r.images) {
        try { r.images = JSON.parse(r.images) } catch { r.images = [] }
      } else {
        r.images = []
      }
    })
    
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
       m.star_rating, m.member_level, m.description as merchant_description, m.industry,
       m.social_identity, m.honors, m.expert_intro, m.images as merchant_images, m.address
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
    
    // 计算会员有效期
    let validUntil = '长期有效'
    if (rows[0].member_level >= 0) {
      const [[payment]] = await pool.query(
        'SELECT end_date FROM member_payments WHERE merchant_id = ? AND status = 1 ORDER BY end_date DESC LIMIT 1',
        [rows[0].merchant_id]
      )
      if (payment?.end_date) {
        validUntil = new Date(payment.end_date).toLocaleDateString('zh-CN')
      }
    }
    
    // 解析 images 字段（JSON类型可能返回数组或字符串）
    const resource = rows[0]
    if (resource.images) {
      if (Array.isArray(resource.images)) {
        // 已是数组，无需处理
      } else if (typeof resource.images === 'string') {
        try { resource.images = JSON.parse(resource.images) } catch { resource.images = [] }
      } else {
        resource.images = []
      }
    } else {
      resource.images = []
    }
    
    const result = {
      ...resource,
      matchScore: Math.round(matchScore),
      matchHearts,
      valid_until: validUntil
    }
    
    if (!canViewContact) {
      delete result.merchant_phone
    }
    
    success(res, result)
  } catch (err) {
    error(res, '获取详情失败')
  }
}

// 商家详情（公开接口，不返回联系方式）
exports.getMerchantDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT id, company_name, logo, description, industry, tags, star_rating, member_level, address, social_identity, honors, expert_intro
       FROM merchants WHERE id = ? AND status = 1`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '商家不存在', 404)
    }
    
    // 公开接口不返回联系方式
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
      params.push(parseInt(type))
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
       tech_details, media_details, return_ways, return_value, images, tags, deadline,
       volunteer_points, volunteer_max_points, volunteer_count, volunteer_desc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.community_id, data.demand_type, data.title, data.activity_type,
       JSON.stringify(data.target_audience || []), data.start_time, data.end_time,
       data.location_type, data.location_name, data.expected_count, data.content,
       JSON.stringify(data.required_types || []), data.budget_min, data.budget_max,
       JSON.stringify(data.material_details || {}), JSON.stringify(data.human_details || {}),
       JSON.stringify(data.tech_details || {}), JSON.stringify(data.media_details || {}),
       JSON.stringify(data.return_ways || []), data.return_value, JSON.stringify(data.images || []),
       JSON.stringify(data.tags || []), data.deadline,
       data.volunteer_points || 0, data.volunteer_max_points || 0, data.volunteer_count || 0, data.volunteer_desc || null]
    )
    
    // 如果从草稿提交，删除对应草稿
    if (data.draft_id) {
      await pool.query('DELETE FROM demand_drafts WHERE id = ? AND community_id = ?', [data.draft_id, req.community.id])
    }
    
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
    
    const data = req.body
    const isRepublish = demand.status === 1 // 已发布的需求重新编辑
    
    await pool.query(
      `UPDATE demands SET title = ?, activity_type = ?, target_audience = ?,
       start_time = ?, end_time = ?, location_type = ?, location_name = ?,
       expected_count = ?, content = ?, required_types = ?, budget_min = ?,
       budget_max = ?, return_ways = ?, return_value = ?, images = ?,
       tags = ?, deadline = ?, status = 0,
       volunteer_points = ?, volunteer_max_points = ?, volunteer_count = ?, volunteer_desc = ?
       WHERE id = ?`,
      [data.title, data.activity_type, JSON.stringify(data.target_audience || []),
       data.start_time, data.end_time, data.location_type, data.location_name,
       data.expected_count, data.content, JSON.stringify(data.required_types || []),
       data.budget_min, data.budget_max, JSON.stringify(data.return_ways || []),
       data.return_value, JSON.stringify(data.images || []), JSON.stringify(data.tags || []),
       data.deadline, 0, // 重新设为待审核
       data.volunteer_points || 0, data.volunteer_max_points || 0, data.volunteer_count || 0, data.volunteer_desc || null,
       id]
    )
    
    // 删除关联的草稿
    if (data.draft_id) {
      await pool.query('DELETE FROM demand_drafts WHERE id = ? AND community_id = ?', [data.draft_id, req.community.id])
    }
    
    success(res, null, isRepublish ? '需求已重新提交审核' : '更新成功')
  } catch (err) {
    console.error('Update demand error:', err)
    error(res, '更新失败')
  }
}

// ====== 需求草稿 ======

// 保存草稿
exports.saveDraft = async (req, res) => {
  try {
    const { form_data, current_step, draft_id, demand_id } = req.body
    const community_id = req.community.id
    
    if (draft_id) {
      // 更新已有草稿
      await pool.query(
        'UPDATE demand_drafts SET form_data = ?, current_step = ?, demand_id = ?, updated_at = NOW() WHERE id = ? AND community_id = ?',
        [JSON.stringify(form_data), current_step || 0, demand_id || null, draft_id, community_id]
      )
      success(res, { id: draft_id }, '草稿已保存')
    } else {
      // 创建新草稿，同时清理该用户/需求关联的旧草稿（最多保留3个）
      const where = demand_id
        ? 'community_id = ? AND demand_id = ?'
        : 'community_id = ? AND demand_id IS NULL'
      const params = demand_id ? [community_id, demand_id] : [community_id]
      const [count] = await pool.query(`SELECT COUNT(*) as cnt FROM demand_drafts WHERE ${where}`, params)
      if (count[0].cnt >= 3) {
        // 删除最旧的
        await pool.query(
          `DELETE FROM demand_drafts WHERE id IN (SELECT id FROM (SELECT id FROM demand_drafts WHERE ${where} ORDER BY updated_at ASC LIMIT 1) t)`,
          params
        )
      }
      
      const [result] = await pool.query(
        'INSERT INTO demand_drafts (community_id, demand_id, form_data, current_step) VALUES (?, ?, ?, ?)',
        [community_id, demand_id || null, JSON.stringify(form_data), current_step || 0]
      )
      success(res, { id: result.insertId }, '草稿已保存')
    }
  } catch (err) {
    console.error('Save draft error:', err)
    error(res, '保存草稿失败')
  }
}

// 加载草稿
exports.getDraft = async (req, res) => {
  try {
    const { id } = req.params
    const [[draft]] = await pool.query(
      'SELECT * FROM demand_drafts WHERE id = ? AND community_id = ?',
      [id, req.community.id]
    )
    if (!draft) {
      return error(res, '草稿不存在', 404)
    }
    let formData = draft.form_data
    if (typeof formData === 'string') {
      try { formData = JSON.parse(formData) } catch { formData = {} }
    }
    success(res, { id: draft.id, demand_id: draft.demand_id, form_data: formData, current_step: draft.current_step, updated_at: draft.updated_at })
  } catch (err) {
    error(res, '获取草稿失败')
  }
}

// 我的草稿列表
exports.getMyDrafts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT d.*, (SELECT title FROM demands WHERE id = d.demand_id) as demand_title FROM demand_drafts d WHERE d.community_id = ? ORDER BY d.updated_at DESC',
      [req.community.id]
    )
    const result = rows.map(r => {
      let formData = r.form_data
      if (typeof formData === 'string') {
        try { formData = JSON.parse(formData) } catch { formData = {} }
      }
      return {
        ...r,
        form_data: formData,
        title: formData.activityName || formData.spaceName || formData.expertType || '未命名草稿'
      }
    })
    success(res, result)
  } catch (err) {
    error(res, '获取草稿列表失败')
  }
}

// 删除草稿
exports.deleteDraft = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM demand_drafts WHERE id = ? AND community_id = ?', [id, req.community.id])
    success(res, null, '草稿已删除')
  } catch (err) {
    error(res, '删除草稿失败')
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
  const conn = await pool.getConnection()
  try {
    const { id } = req.params

    await conn.beginTransaction()

    // 1. 获取意向详情
    const [intentions] = await conn.query(
      'SELECT i.*, d.title as demand_title, r.title as resource_title FROM intentions i LEFT JOIN demands d ON i.demand_id = d.id LEFT JOIN resources r ON i.resource_id = r.id WHERE i.id = ? AND i.community_id = ?',
      [id, req.community.id]
    )

    if (intentions.length === 0) {
      await conn.rollback()
      return error(res, '意向不存在', 404)
    }

    const intention = intentions[0]

    // 2. 检查是否已经处理过
    if (intention.status !== 0) {
      await conn.rollback()
      return error(res, '该意向已处理', 400)
    }

    // 3. 更新意向状态为已接受
    await conn.query(
      'UPDATE intentions SET status = 1, response = ? WHERE id = ? AND community_id = ?',
      ['已接受', id, req.community.id]
    )

    // 4. 检查该社区是否已有该撮合的奖励记录，避免重复
    const [existingReward] = await conn.query(
      'SELECT id FROM reward_records WHERE intention_id = ?',
      [id]
    )

    if (existingReward.length === 0) {
      // 5. 获取撮合奖励配置
      const [configs] = await conn.query(
        "SELECT config_value FROM sys_configs WHERE config_key = 'match_reward'"
      )

      let rewardValue = 200 // 默认200元
      let rewardDesc = '撮合成功奖励物资（价值约200元）'

      if (configs.length > 0) {
        const cfg = JSON.parse(configs[0].config_value)
        rewardValue = cfg.value || 200
        rewardDesc = cfg.desc || rewardDesc
      }

      // 6. 生成撮合奖励记录
      await conn.query(
        `INSERT INTO reward_records (intention_id, community_id, reward_type, reward_value, reward_content, status)
         VALUES (?, ?, 'match', ?, ?, 0)`,
        [id, req.community.id, rewardValue, rewardDesc]
      )

      console.log(`撮合奖励记录已生成: intention_id=${id}, community_id=${req.community.id}, reward=${rewardValue}元`)
    }

    await conn.commit()
    success(res, null, '已接受对接，撮合奖励将稍后发放')
  } catch (err) {
    await conn.rollback()
    console.error('acceptIntention error:', err)
    error(res, '操作失败')
  } finally {
    conn.release()
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
      `SELECT id, username, real_name, community, community_name, position, households,
       family_ratio, elderly_ratio, public_space_area, has_outdoor_plaza, has_commercial,
       has_school, has_park, merchant_count, logo, description, images, address, tags, status,
       ST_X(map_location) as longitude, ST_Y(map_location) as latitude
       FROM communities WHERE id = ?`,
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
    const [[viewCount]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM demands WHERE community_id = ?', [req.community.id])
    result.demandCount = demandCount?.cnt || 0
    result.intentionCount = intentionCount?.cnt || 0
    result.viewCount = viewCount?.total || 0
    
    success(res, result)
  } catch (err) {
    error(res, '获取信息失败')
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body

    // 处理地图坐标（POINT: x=经度, y=纬度）
    let mapLocationQuery = ''
    let mapLocationParams = []
    if (data.latitude != null && data.longitude != null &&
        !isNaN(Number(data.latitude)) && !isNaN(Number(data.longitude))) {
      // 使用 SRID=0 避免 MySQL SRID 4326 轴顺序歧义
      mapLocationQuery = ', map_location = ST_GeomFromText(?, 0)'
      mapLocationParams = [`POINT(${data.longitude} ${data.latitude})`]
    }

    await pool.query(
      `UPDATE communities SET logo = ?, description = ?, images = ?, tags = ?,
       households = ?, family_ratio = ?, elderly_ratio = ?, public_space_area = ?,
       has_outdoor_plaza = ?, has_commercial = ?, has_school = ?, has_park = ?,
       merchant_count = ?, position = ?, address = ?, contact_name = ?, community_name = ?
       ${mapLocationQuery}
       WHERE id = ?`,
      [data.logo || null, data.description || '', data.images ? JSON.stringify(data.images) : null,
       data.tags ? JSON.stringify(Array.isArray(data.tags) ? data.tags : []) : null,
       data.households || null, data.family_ratio || null, data.elderly_ratio || null, data.public_space_area || null,
       data.has_outdoor_plaza || 0, data.has_commercial || 0, data.has_school || 0, data.has_park || 0,
       data.merchant_count || null, data.position || '', data.address || '',
       data.contact_name || '', data.community_name || '',
       ...mapLocationParams, req.community.id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    console.error('updateProfile error:', err)
    error(res, '更新失败')
  }
}

// 奖励明细

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

// 领取奖励
exports.claimReward = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return error(res, '缺少奖励记录ID', 400)

    const [[record]] = await pool.query(
      'SELECT * FROM reward_records WHERE id = ? AND community_id = ?',
      [id, req.community.id]
    )

    if (!record) return error(res, '奖励记录不存在', 404)
    if (record.status !== 1) return error(res, '该奖励状态无法领取', 400)

    await pool.query(
      'UPDATE reward_records SET status = 2, confirmed_at = NOW() WHERE id = ?',
      [id]
    )

    success(res, null, '已确认领取')
  } catch (err) {
    error(res, '领取失败')
  }
}

// 收藏资源
exports.toggleFavorite = async (req, res) => {
  try {
    const { resource_id } = req.body
    if (!resource_id) return error(res, '缺少resource_id', 400)
    
    const [existing] = await pool.query(
      'SELECT id FROM resource_favorite WHERE community_id = ? AND resource_id = ?',
      [req.community.id, resource_id]
    )
    
    if (existing.length > 0) {
      // 取消收藏
      await pool.query('DELETE FROM resource_favorite WHERE community_id = ? AND resource_id = ?', [req.community.id, resource_id])
      success(res, { favorited: false }, '已取消收藏')
    } else {
      // 添加收藏
      await pool.query('INSERT INTO resource_favorite (community_id, resource_id) VALUES (?, ?)', [req.community.id, resource_id])
      success(res, { favorited: true }, '已收藏')
    }
  } catch (err) {
    error(res, '操作失败')
  }
}

// 我的收藏（资源）
exports.getMyFavorites = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize
    
    const [rows] = await pool.query(
      `SELECT rf.id, rf.create_time, r.*, m.company_name, m.logo as merchant_logo, m.member_level, m.star_rating
       FROM resource_favorite rf
       JOIN resources r ON rf.resource_id = r.id
       JOIN merchants m ON r.merchant_id = m.id
       WHERE rf.community_id = ?
       ORDER BY rf.create_time DESC
       LIMIT ? OFFSET ?`,
      [req.community.id, parseInt(pageSize), parseInt(offset)]
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM resource_favorite WHERE community_id = ?',
      [req.community.id]
    )
    
    const result = rows.map(r => ({ ...r, matchScore: 3, matchHearts: 3 }))
    pageSuccess(res, result, total, page, pageSize)
  } catch (err) {
    console.error('getMyFavorites error:', err)
    error(res, '获取收藏列表失败')
  }
}

// 批量导入需求（简化实现）
exports.importDemands = async (req, res) => {
  try {
    // 这里应该有文件解析逻辑，简化处理
    success(res, { imported: 0 }, '导入功能开发中')
  } catch (err) {
    error(res, '导入失败')
  }
}

// 获取社区自己的系统通知
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const communityId = req.community.id

    // 查询目标为 all 或 community 的已发布通知，且指定社区的
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total FROM system_notifications
      WHERE status = 1
        AND (target_type IN ('all', 'community', 0, 1))
        AND (target_ids IS NULL OR target_ids = '' OR JSON_CONTAINS(target_ids, ?))
    `, [String(communityId)])


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
          WHERE r.notification_id = n.id AND r.user_type = 'community' AND r.user_id = ?
        ) THEN 1 ELSE 0 END as is_read
      FROM system_notifications n
      WHERE n.status = 1
        AND (n.target_type IN ('all', 'community', 0, 1))
        AND (n.target_ids IS NULL OR n.target_ids = '' OR JSON_CONTAINS(n.target_ids, ?))
      ORDER BY n.priority DESC, n.published_at DESC
      LIMIT ? OFFSET ?
    `, [communityId, String(communityId), parseInt(pageSize), offset])

    pageSuccess(res, rows, countRows[0].total, parseInt(page), parseInt(pageSize))
  } catch (err) {
    console.error('getMyNotifications error:', err)
    error(res, '获取通知列表失败')
  }
}

// 获取未读通知数量
exports.getUnreadCount = async (req, res) => {
  try {
    const communityId = req.community?.id
    if (!communityId) {
      return error(res, '未登录')
    }
    // 查询未读通知数量（排除已读的）- 同时兼容数字和字符串格式
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM system_notifications n
       WHERE n.status = 1
       AND (n.target_type IN ('all', 'community', 0, 1))
       AND (n.target_ids IS NULL OR n.target_ids = '' OR JSON_CONTAINS(n.target_ids, ?))
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads r
         WHERE r.notification_id = n.id AND r.user_type = 'community' AND r.user_id = ?
       )`,
      [String(communityId), communityId]
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
    const communityId = req.community?.id
    if (!communityId) {
      return error(res, '未登录')
    }
    // 获取所有未读通知ID
    const [notifications] = await pool.query(
      `SELECT n.id FROM system_notifications n
       WHERE n.status = 1
       AND (n.target_type IN ('all', 'community', 0, 1))
       AND (n.target_ids IS NULL OR n.target_ids = '' OR JSON_CONTAINS(n.target_ids, ?))
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads r
         WHERE r.notification_id = n.id AND r.user_type = 'community' AND r.user_id = ?
       )`,
      [String(communityId), communityId]
    )
    
    // 批量插入已读记录
    if (notifications.length > 0) {
      const values = notifications.map(n => [n.id, 'community', communityId])
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
    const communityId = req.community?.id
    if (!communityId) {
      return error(res, '未登录')
    }
    const notificationId = parseInt(req.params.id)
    if (!notificationId) {
      return error(res, '无效的通知ID')
    }
    // 插入已读记录
    await pool.query(
      'INSERT IGNORE INTO notification_reads (notification_id, user_type, user_id) VALUES (?, ?, ?)',
      [notificationId, 'community', communityId]
    )
    success(res, { success: true })
  } catch (err) {
    console.error('markOneNotificationRead error:', err)
    error(res, '标记已读失败')
  }
}

// 下载模板
exports.downloadTemplate = async (req, res) => {
  try {
    const type = req.query.type || 'activity'
    
    const templates = {
      // 活动赞助需求模板
      activity: [
        { title: '社区名称', category: '活动赞助', target_audience: '社区居民', budget: '5000', start_time: '2026-05-01', end_time: '2026-05-03', location: '社区广场', description: '社区将举办五一劳动节活动，欢迎赞助商参与', contact_person: '张三', contact_phone: '13800138000', tags: '社区活动,节日庆典' },
        { title: '示例：社区运动会赞助', category: '活动赞助', target_audience: '社区居民', budget: '10000', start_time: '2026-06-01', end_time: '2026-06-02', location: '社区运动场', description: '社区计划举办夏季运动会', contact_person: '李四', contact_phone: '13800138001', tags: '体育运动,健康' }
      ],
      // 专家服务需求模板
      expert: [
        { title: '社区名称', category: '专家服务', target_audience: '社区居民', budget: '3000', start_time: '2026-05-15', end_time: '2026-05-15', location: '社区会议室', description: '邀请专家进行健康讲座', contact_person: '王五', contact_phone: '13800138002', tags: '健康讲座,专家' },
        { title: '示例：法律咨询进社区', category: '专家服务', target_audience: '社区居民', budget: '5000', start_time: '2026-06-10', end_time: '2026-06-10', location: '社区活动中心', description: '邀请律师进行法律知识普及', contact_person: '赵六', contact_phone: '13800138003', tags: '法律,公益' }
      ],
      // 空间运营需求模板
      space: [
        { title: '社区名称', category: '空间运营', target_audience: '社区居民', budget: '2000', start_time: '2026-05-01', end_time: '2026-12-31', location: '社区活动室', description: '寻求合作伙伴运营社区活动室', contact_person: '孙七', contact_phone: '13800138004', tags: '场地合作,社区服务' },
        { title: '示例：社区图书室合作', category: '空间运营', target_audience: '社区居民', budget: '3000', start_time: '2026-06-01', end_time: '2026-12-31', location: '社区图书室', description: '寻求图书供应商合作运营', contact_person: '周八', contact_phone: '13800138005', tags: '图书,教育' }
      ]
    }
    
    const data = templates[type] || templates.activity
    
    // 生成CSV内容
    const headers = ['title', 'category', 'target_audience', 'budget', 'start_time', 'end_time', 'location', 'description', 'contact_person', 'contact_phone', 'tags']
    const headerLine = headers.join(',')
    const csvRows = data.map(row => headers.map(h => {
      const val = row[h] || ''
      // 包含逗号或引号的需要加引号
      if (String(val).includes(',') || String(val).includes('"')) {
        return `"${String(val).replace(/"/g, '""')}"`
      }
      return val
    }).join(','))
    
    const csvContent = '\ufeff' + [headerLine, ...csvRows].join('\n')
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=demand_template_${type}.csv`)
    res.send(csvContent)
  } catch (err) {
    console.error('downloadTemplate error:', err)
    error(res, '下载模板失败')
  }
}
