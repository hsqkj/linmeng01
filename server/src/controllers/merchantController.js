/**
 * 商家控制器
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')
const jwtConfig = require('../config/jwt')
const { success, pageSuccess, error } = require('../utils/response')
const { calculateMatchScore, getMatchHearts } = require('../utils/matching')
const typeMapper = require('../services/typeMapper')

// 使用统一映射服务映射需求数据
function mapDemandWithTypes(demand) {
  return typeMapper.mapDemand(demand)
}

// 使用统一映射服务映射需求列表
function mapDemandListWithTypes(demands) {
  return typeMapper.mapDemandList(demands)
}

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
    
    if (merchant.status === 0) {
      return error(res, '账号审核中，请耐心等待', 401)
    }
    
    if (merchant.status === 2) {
      return error(res, '账号已被禁用', 403)
    }
    
    // 验证码登录
    if (code !== undefined) {
      // 测试账号：直接验证固定验证码（不依赖缓存）
      const { getTestAccount } = require('./publicController')
      const testAccount = getTestAccount(phone)
      if (testAccount) {
        if (code !== testAccount.code) {
          return error(res, '验证码错误', 401)
        }
      } else {
        // 正常账号：从缓存验证
        const cached = require('./publicController').getCodeCache(phone)
        if (!cached) {
          return error(res, '验证码已过期，请重新获取', 401)
        }
        if (code !== cached.code) {
          return error(res, '验证码错误', 401)
        }
        // 验证通过，清除缓存
        require('./publicController').clearCodeCache(phone)
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
    if (!data.password) return error(res, '请设置登录密码', 400)
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    const [existing] = await pool.query('SELECT id FROM merchants WHERE phone = ?', [data.phone])
    if (existing.length > 0) {
      return error(res, '手机号已注册', 400)
    }

    // 检查用户名是否已被使用
    if (data.username) {
      const [uExisting] = await pool.query('SELECT id FROM merchants WHERE username = ?', [data.username])
      if (uExisting.length > 0) {
        return error(res, '用户名已被使用，请换一个', 400)
      }
    }

    const username = data.username || data.phone
    
    await pool.query(
      `INSERT INTO merchants (username, password, company_name, credit_code, business_license,
       logo, description, company_type, industry, scale, district, street, community,
       resource_types, contact_name, phone, address, tags, ambassador_id, member_level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [username, hashedPassword, data.company_name, data.credit_code, data.business_license,
       data.logo, data.description, data.company_type || 'merchant', data.industry, data.scale || '',
       data.district || '', data.street || '', data.community || '',
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
    // 使用传入的密码，否则降级到手机号后6位
    const rawPassword = data.password || data.phone.slice(-6)
    const hashedPassword = await bcrypt.hash(rawPassword, 10)
    
    // 检查手机号是否已注册
    const [existing] = await pool.query('SELECT id FROM merchants WHERE phone = ?', [data.phone])
    if (existing.length > 0) {
      return error(res, '手机号已注册', 400)
    }

    // 检查用户名是否已被使用
    if (data.username) {
      const [uExisting] = await pool.query('SELECT id FROM merchants WHERE username = ?', [data.username])
      if (uExisting.length > 0) {
        return error(res, '用户名已被使用，请换一个', 400)
      }
    }
    
    // company_type = 'expert' 标识专家
    // contact_name 存真实姓名，company_name 存 "专家-{姓名}"
    const companyName = `专家-${data.realName}`
    const username = data.username || data.phone
    
    await pool.query(
      `INSERT INTO merchants (username, password, company_name, contact_name, phone,
       company_type, industry, logo, description,
       social_identity, honors, expert_intro, tags, images,
       member_level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        username, hashedPassword, companyName, data.realName, data.phone,
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
    // 使用统一映射服务，不需要等待加载（服务启动时已初始化）
    const [demands] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households
       FROM demands d
       JOIN communities c ON d.community_id = c.id
       WHERE d.status = 1 AND c.status = 1
       ORDER BY d.created_at DESC
       LIMIT 20`
    )

    // 使用统一映射服务处理需求数据
    const result = demands.map(d => ({
      ...mapDemandWithTypes(d),
      matchScore: 3,
      matchHearts: 3,
    }))

    success(res, result)
  } catch (err) {
    console.error('Get recommend demands error:', err)
    error(res, '获取推荐失败')
  }
}

// 需求大厅 - 需求类型映射（从数据库动态加载）
let DEMAND_TYPE_MAP = {}
let demandTypeLoaded = false

// 默认需求类型
const DEFAULT_DEMAND_TYPES = [
  '活动赞助', '专家服务', '空间运营', '物资赞助', '健康服务', '教育培训'
]

async function loadDemandTypes() {
  if (demandTypeLoaded) return
  try {
    // 首先尝试从 demand_types 配置加载
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'demand_types'")
    if (rows.length > 0 && rows[0].config_value) {
      try {
        const types = JSON.parse(rows[0].config_value)
        if (Array.isArray(types) && types.length > 0) {
          types.forEach((name, idx) => {
            DEMAND_TYPE_MAP[idx] = name
            DEMAND_TYPE_MAP[name] = name
          })
          demandTypeLoaded = true
          return
        }
      } catch (e) {
        console.error('解析需求类型配置失败:', e.message)
      }
    }
    // 如果没有配置或解析失败，尝试从 basic_types 加载
    const [basicRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'")
    if (basicRows.length > 0 && basicRows[0].config_value) {
      try {
        const config = JSON.parse(basicRows[0].config_value)
        if (config.demandTypes && Array.isArray(config.demandTypes) && config.demandTypes.length > 0) {
          config.demandTypes.forEach((name, idx) => {
            DEMAND_TYPE_MAP[idx] = name
            DEMAND_TYPE_MAP[name] = name
          })
          demandTypeLoaded = true
          return
        }
      } catch (e) {
        console.error('解析基础类型配置失败:', e.message)
      }
    }
    // 如果都没有，使用默认类型
    DEFAULT_DEMAND_TYPES.forEach((name, idx) => {
      DEMAND_TYPE_MAP[idx] = name
      DEMAND_TYPE_MAP[name] = name
    })
  } catch (e) {
    console.error('加载需求类型失败:', e.message)
    // 使用默认类型作为后备
    DEFAULT_DEMAND_TYPES.forEach((name, idx) => {
      DEMAND_TYPE_MAP[idx] = name
      DEMAND_TYPE_MAP[name] = name
    })
  }
  demandTypeLoaded = true
}

const DEMAND_TYPE_NAME = {} // 保留空对象用于兼容

// 资源类型缓存（从数据库动态加载）
let RESOURCE_TYPE_MAP = []
let resourceTypeLoaded = false

// 加载资源类型配置
async function loadResourceTypes() {
  if (resourceTypeLoaded) return
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'")
    if (rows.length > 0) {
      const config = JSON.parse(rows[0].config_value)
      if (config.resourceTypes && config.resourceTypes.length > 0) {
        RESOURCE_TYPE_MAP = config.resourceTypes.filter(t => t.enabled !== false).map(t => t.name || t)
      }
    }
  } catch (e) {
    console.error('加载资源类型失败:', e.message)
  }
  resourceTypeLoaded = true
}

// 获取资源类型名称到索引的映射
async function getResourceTypeNameToIndexMap() {
  await loadResourceTypes()
  const map = {}
  RESOURCE_TYPE_MAP.forEach((name, idx) => {
    map[name] = idx
  })
  return map
}


// 资源类型映射（从数据库动态加载）
// 使用 getResourceTypeName() 函数获取类型名称，确保先调用 loadResourceTypes()

// 居民类型映射（从数据库动态加载）
let RESIDENT_TYPE_MAP = []
let residentTypeLoaded = false

// 加载居民类型配置
async function loadResidentTypes() {
  if (residentTypeLoaded) return
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'")
    if (rows.length > 0) {
      const config = JSON.parse(rows[0].config_value)
      if (config.residentTypes && config.residentTypes.length > 0) {
        // 兼容两种格式：字符串数组或对象数组
        RESIDENT_TYPE_MAP = config.residentTypes
          .filter(t => {
            if (typeof t === 'string') return true
            return t.enabled !== false
          })
          .map(t => typeof t === 'string' ? t : (t.name || t))
      }
    }
  } catch (e) {
    console.error('加载居民类型失败:', e.message)
  }
  residentTypeLoaded = true
}

// 社区标签映射（从数据库动态加载）
let COMMUNITY_TAG_MAP = {}
let communityTagLoaded = false

// 加载社区标签配置
async function loadCommunityTags() {
  if (communityTagLoaded) return
  try {
    // 从 tags 表加载社区标签（type = 'community'）
    const [rows] = await pool.query("SELECT id, name FROM tags WHERE type = 'community' AND status = 1 ORDER BY id")
    if (rows.length > 0) {
      const map = {}
      rows.forEach((t) => {
        map[t.id] = t.name
      })
      COMMUNITY_TAG_MAP = map
    } else {
      // 如果标签表为空，使用默认标签（用于开发环境）
      COMMUNITY_TAG_MAP = {
        1: '传统文化', 2: '体育健身', 3: '教育培训', 4: '健康养生',
        5: '亲子活动', 6: '志愿服务', 7: '节庆活动', 8: '便民服务',
        9: '社区治理', 10: '环境保护'
      }
    }
  } catch (e) {
    console.error('加载社区标签失败:', e.message)
    // 使用默认标签作为后备
    COMMUNITY_TAG_MAP = {
      1: '传统文化', 2: '体育健身', 3: '教育培训', 4: '健康养生',
      5: '亲子活动', 6: '志愿服务', 7: '节庆活动', 8: '便民服务',
      9: '社区治理', 10: '环境保护'
    }
  }
  communityTagLoaded = true
}

// 获取资源类型名称
function getResourceTypeName(idx) {
  if (RESOURCE_TYPE_MAP.length === 0) return `类型${idx}`
  return RESOURCE_TYPE_MAP[idx] || `类型${idx}`
}

// 同步加载资源类型（用于不需要等待的场景，返回默认映射）
function getResourceTypeIndex(typeName) {
  // 先尝试从已加载的映射中获取
  const idx = RESOURCE_TYPE_MAP.indexOf(typeName)
  if (idx !== -1) return idx
  // 如果未加载，返回默认值
  return null
}

// 映射需求数组字段为中文名称
function mapDemandFields(d) {
  // 如果资源类型未加载，尝试同步获取（使用默认值）

  // target_audience: 数字索引 → 居民类型名称
  let targetAudienceNames = []
  if (d.target_audience) {
    try {
      const arr = typeof d.target_audience === 'string' ? JSON.parse(d.target_audience) : d.target_audience
      targetAudienceNames = arr.map(i => RESIDENT_TYPE_MAP[i] || `类型${i}`).filter(Boolean)
    } catch {}
  }

  // tags: 标签ID → 标签名称
  let tagNames = []
  if (d.tags) {
    try {
      const arr = typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags
      tagNames = arr.map(id => COMMUNITY_TAG_MAP[id] || `标签${id}`).filter(Boolean)
    } catch {}
  }

  // required_types: 数字索引 → 资源类型名称
  let requiredTypeNames = []
  if (d.required_types) {
    try {
      const arr = typeof d.required_types === 'string' ? JSON.parse(d.required_types) : d.required_types
      requiredTypeNames = arr.map(i => getResourceTypeName(i)).filter(Boolean)
    } catch {}
  }

  return {
    ...d,
    target_audience_names: targetAudienceNames,
    tags_names: tagNames,
    required_types_names: requiredTypeNames
  }
}

exports.getDemands = async (req, res) => {
  try {
    // 使用统一映射服务，不需要等待加载
    const { page = 1, pageSize = 10, type, district, street, community, sort, keyword, lat, lng } = req.query
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
      where += ' AND (d.title LIKE ? OR d.content LIKE ? OR c.community_name LIKE ? OR c.district LIKE ? OR c.street LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    // 判断是否需要按距离排序
    const hasLocation = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
    let orderBy = 'd.created_at DESC'

    if (hasLocation && sort === 'distance') {
      orderBy = `(6371 * 2 * ASIN(SQRT(POWER(SIN((${parseFloat(lat)} - c.lat) * PI() / 180 / 2), 2) + COS(${parseFloat(lat)} * PI() / 180) * COS(c.lat * PI() / 180) * POWER(SIN((${parseFloat(lng)} - c.lng) * PI() / 180 / 2), 2)))) ASC`
    }

    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.district, c.street, c.households, c.lat, c.lng
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

    // 使用统一映射服务处理需求数据，并计算距离
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    const result = rows.map(d => {
      const mapped = mapDemandWithTypes(d)
      // 如果有用户坐标且社区有坐标，计算距离
      if (hasLocation && d.lat && d.lng) {
        const distance = calculateDistance(userLat, userLng, d.lat, d.lng)
        mapped.distance_km = distance
      }
      return {
        ...mapped,
        matchScore: 3,
        matchHearts: 3,
      }
    })

    pageSuccess(res, result, total, page, pageSize)
  } catch (err) {
    console.error('getDemands error:', err)
    error(res, '获取需求列表失败')
  }
}

// 计算两点之间的距离（km）- Haversine公式
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // 地球半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 需求详情（公开接口，联系方式根据会员等级决定）
exports.getDemandDetail = async (req, res) => {
  try {
    // 使用统一映射服务，不需要等待加载
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

    // 使用统一映射服务处理需求数据
    const mapped = mapDemandWithTypes(row)

    // 添加匹配度信息
    mapped.matchScore = 3
    mapped.matchHearts = 3

    // 联系方式：仅金牌会员（Lv3）及以上可见
    let canViewContact = false
    if (req.merchant?.id) {
      const [[merchant]] = await pool.query('SELECT member_level FROM merchants WHERE id = ?', [req.merchant.id])
      canViewContact = merchant?.member_level >= 3
    }

    const result = { ...mapped, canViewContact }
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
       elderly_ratio, public_space_area, merchant_count, has_outdoor_plaza, has_commercial, has_school,
       has_park, logo, description, tags, images, proof_images
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
    
    // 获取小区列表
    const [compounds] = await pool.query(
      'SELECT id, name, households FROM community_compounds WHERE community_id = ? ORDER BY sort_order, id',
      [id]
    )
    
    // 获取场地列表（只返回已启用的）
    const [spaces] = await pool.query(
      'SELECT id, name, location_type, floor_number, area, capacity, facilities, available_hours, images, description FROM community_spaces WHERE community_id = ? AND status = 1 ORDER BY sort_order, id',
      [id]
    )
    // 解析 JSON 字段
    spaces.forEach(s => {
      try { s.facilities = s.facilities ? (typeof s.facilities === 'string' ? JSON.parse(s.facilities) : s.facilities) : [] } catch { s.facilities = [] }
      try { s.images = s.images ? (typeof s.images === 'string' ? JSON.parse(s.images) : s.images) : [] } catch { s.images = [] }
    })
    
    success(res, {
      ...rows[0],
      compounds,
      spaces
    })
  } catch (err) {
    console.error('getCommunityDetail error:', err)
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
    
    const [rows] = await pool.query(`
      SELECT r.*, m.lat, m.lng, m.address as merchant_address
      FROM resources r
      JOIN merchants m ON r.merchant_id = m.id
      WHERE r.id = ?
    `, [id])
    
    if (rows.length === 0) {
      return error(res, '资源不存在', 404)
    }
    
    // 解析 images 字段（从 JSON 字符串转为数组）
    const resource = rows[0]
    console.log('[DEBUG] getResourceDetail 原始数据:', {
      images: resource.images,
      expected_rewards: resource.expected_rewards,
      tags: resource.tags
    })
    if (resource.images) {
      try { resource.images = JSON.parse(resource.images) } catch { resource.images = [] }
    } else {
      resource.images = []
    }
    // 解析 tags 字段
    if (resource.tags) {
      try { resource.tags = JSON.parse(resource.tags) } catch { resource.tags = [] }
    } else {
      resource.tags = []
    }
    // 解析 expected_rewards 字段
    if (resource.expected_rewards) {
      try { resource.expected_rewards = JSON.parse(resource.expected_rewards) } catch { resource.expected_rewards = [] }
    } else {
      resource.expected_rewards = []
    }
    // 解析其他 JSON 字段
    if (resource.fund_scenes) {
      try { resource.fund_scenes = JSON.parse(resource.fund_scenes) } catch { resource.fund_scenes = [] }
    } else { resource.fund_scenes = [] }
    if (resource.tech_types) {
      try { resource.tech_types = JSON.parse(resource.tech_types) } catch { resource.tech_types = [] }
    } else { resource.tech_types = [] }
    if (resource.media_channels) {
      try { resource.media_channels = JSON.parse(resource.media_channels) } catch { resource.media_channels = [] }
    } else { resource.media_channels = [] }
    
    success(res, resource)
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
    
    // 解析 images 字段（从 JSON 字符串转为数组）
    rows.forEach(r => {
      if (r.images) {
        try { r.images = JSON.parse(r.images) } catch { r.images = [] }
      } else {
        r.images = []
      }
    })
    
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
    
    // 从数据库加载资源类型映射
    const typeMap = await getResourceTypeNameToIndexMap()
    
    // 转换 resource_type（如果已经是数字则直接使用）
    let resourceType = data.resource_type
    if (typeof resourceType === 'string' && !isNaN(parseInt(resourceType))) {
      resourceType = parseInt(resourceType)
    } else if (typeof resourceType === 'string' && typeMap[resourceType] !== undefined) {
      resourceType = typeMap[resourceType]
    }

    // AI 审核（异步进行，不阻塞发布）
    let auditResult = { passed: true, reason: '', level: 'low' }
    try {
      const aiAuditService = require('../services/aiAuditService')
      auditResult = await aiAuditService.auditContent({
        title: data.title || '',
        description: data.content || '',
        type: 'resource'
      })
    } catch (e) {
      console.error('AI audit failed:', e)
    }

    // 根据审核结果设置状态
    // level=high 直接拒绝，level=medium 待人工复核（status=0），level=low 通过（status=0待人工）
    let initialStatus = 0 // 默认待审核
    if (auditResult.level === 'high') {
      return error(res, `内容审核未通过：${auditResult.reason}。请修改后重新发布。`, 400)
    }

    const [result] = await pool.query(
      `INSERT INTO resources (merchant_id, resource_type, title, content, images, tags,
       min_amount, max_amount, quantity, specs, pickup_way, staff_count,
       work_duration, manpower_desc, service_scope, certification,
       price_range, professional_type, media_channels, media_desc,
       goods_expiry, goods_items, fund_scenes, space_area, capacity, facilities, open_hours,
       work_type, salary_range,
       valid_until, expected_rewards, expected_reward_desc, status,
       ai_audit_level, ai_audit_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.merchant_id, resourceType, data.title, data.content,
       JSON.stringify(data.images || []), JSON.stringify(data.tags || []),
       data.min_amount || 0, data.max_amount || 0, data.quantity || 0, data.specs || '', data.pickup_way || '',
       data.staff_count || 0, data.work_duration || 0, data.manpower_desc || '',
       data.service_scope || '', data.certification || '', data.price_range || '',
       data.professional_type || '',
       JSON.stringify(data.media_channels || []), data.media_desc || '',
       data.goods_expiry || null, JSON.stringify(data.goods_items || []), JSON.stringify(data.fund_scenes || []),
       data.space_area || 0, data.capacity || 0, JSON.stringify(data.facilities || []), data.open_hours || '',
       data.work_type || '', data.salary_range || '',
       data.valid_until || null,
       JSON.stringify(data.expected_rewards || []), data.expected_reward_desc || '', initialStatus,
       auditResult.level, auditResult.reason || null]
    )

    // 根据审核等级返回不同提示
    let message = '资源发布成功，请等待审核'
    if (auditResult.level === 'low' && auditResult.reason) {
      message = `资源发布成功${auditResult.reason}`
    } else if (auditResult.level === 'medium') {
      message = `资源发布成功，需要人工复核：${auditResult.reason}`
    }

    success(res, { id: result.insertId, auditLevel: auditResult.level }, message)
  } catch (err) {
    console.error('Create resource error:', err.message, err.stack)
    error(res, '发布资源失败: ' + err.message)
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
    
    // 从数据库加载资源类型映射
    const typeMap = await getResourceTypeNameToIndexMap()
    
    // 转换 resource_type
    let resourceType = data.resource_type
    if (typeof resourceType === 'string' && !isNaN(parseInt(resourceType))) {
      resourceType = parseInt(resourceType)
    } else if (typeof resourceType === 'string' && typeMap[resourceType] !== undefined) {
      resourceType = typeMap[resourceType]
    }
    
    // 格式化日期字段
    const formatDate = (d) => {
      if (!d) return null
      if (d instanceof Date) return d.toISOString().slice(0, 10)
      if (typeof d === 'string') return d.slice(0, 10)
      return null
    }
    
    const goodsExpiry = formatDate(data.goods_expiry)
    const validUntil = formatDate(data.valid_until)
    
    await pool.query(
      `UPDATE resources SET resource_type = ?, title = ?, content = ?, images = ?, tags = ?,
       min_amount = ?, max_amount = ?, quantity = ?, specs = ?, pickup_way = ?,
       staff_count = ?, work_duration = ?, manpower_desc = ?,
       service_scope = ?, certification = ?, price_range = ?, professional_type = ?,
       media_channels = ?, media_desc = ?,
       goods_expiry = ?, fund_scenes = ?,
       space_area = ?, capacity = ?, facilities = ?, open_hours = ?,
       work_type = ?, salary_range = ?,
       valid_until = ?, expected_rewards = ?, expected_reward_desc = ?, status = 0 WHERE id = ?`,
      [resourceType, data.title, data.content, JSON.stringify(data.images || []),
       JSON.stringify(data.tags || []), data.min_amount || 0, data.max_amount || 0,
       data.quantity || 0, data.specs || '', data.pickup_way || '', data.staff_count || 0,
       data.work_duration || 0, data.manpower_desc || '', data.service_scope || '',
       data.certification || '', data.price_range || '', data.professional_type || '',
       JSON.stringify(data.media_channels || []), data.media_desc || '',
       goodsExpiry, JSON.stringify(data.fund_scenes || []),
       data.space_area || 0, data.capacity || 0, JSON.stringify(data.facilities || []), data.open_hours || '',
       data.work_type || '', data.salary_range || '',
       validUntil, JSON.stringify(data.expected_rewards || []), data.expected_reward_desc || '', id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    console.error('Update resource error:', err.message)
    console.error('Stack:', err.stack)
    error(res, '更新失败: ' + err.message)
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
       m.images, m.status, m.social_identity, m.honors, m.expert_intro, m.business_license, m.scale,
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
      try { result.images = JSON.parse(result.images) } catch {}
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
    await loadDemandTypes() // 确保需求类型已加载
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
       tags = ?, social_identity = ?, honors = ?, expert_intro = ?, images = ? WHERE id = ?`,
      [data.company_name, data.logo, data.description, data.company_type, data.industry,
       typeof data.resource_types === 'string' ? data.resource_types : JSON.stringify(data.resource_types || []),
       data.contact_name, data.phone, data.address,
       typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags || []),
       data.social_identity || '', data.honors || '', data.expert_intro || '',
       data.images || '', req.merchant.id]
    )
    
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

// 修改密码
exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return error(res, '请填写旧密码和新密码', 400)
    }

    if (newPassword.length < 6) {
      return error(res, '新密码长度不能少于6位', 400)
    }

    // 获取当前用户密码
    const [rows] = await pool.query(
      'SELECT password FROM merchants WHERE id = ?',
      [req.merchant.id]
    )

    if (rows.length === 0) {
      return error(res, '用户不存在', 404)
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, rows[0].password)
    if (!isMatch) {
      return error(res, '旧密码错误', 400)
    }

    // 更新新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE merchants SET password = ? WHERE id = ?',
      [hashedPassword, req.merchant.id]
    )

    success(res, null, '密码修改成功')
  } catch (err) {
    console.error('updatePassword error:', err)
    error(res, '修改密码失败')
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

// 保存商家坐标
exports.saveLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body
    const merchantId = req.merchant.id

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      return error(res, '经纬度参数无效', 400)
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return error(res, '经纬度超出有效范围', 400)
    }

    // 同时更新 POINT 字段（MySQL spatial）
    await pool.query(
      'UPDATE merchants SET lat = ?, lng = ?, map_location = ST_GeomFromText(?) WHERE id = ?',
      [lat, lng, `POINT(${lng} ${lat})`, merchantId]
    )

    success(res, null, '位置信息已保存')
  } catch (err) {
    console.error('saveLocation error:', err)
    error(res, '保存位置失败')
  }
}

// 保存社区坐标（管理员代为保存）
exports.saveCommunityLocation = async (req, res) => {
  try {
    const { community_id, lat, lng } = req.body

    if (!community_id || lat === null || lng === null) {
      return error(res, '参数不完整', 400)
    }

    await pool.query(
      'UPDATE communities SET lat = ?, lng = ?, map_location = ST_GeomFromText(?) WHERE id = ?',
      [lat, lng, `POINT(${lng} ${lat})`, community_id]
    )

    success(res, null, '社区位置已保存')
  } catch (err) {
    console.error('saveCommunityLocation error:', err)
    error(res, '保存社区位置失败')
  }
}

// ============ 商家端订单API ============

// 获取订单列表
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const merchantId = req.merchant.id

    let whereClause = 'WHERE o.merchant_id = ?'
    const params = [merchantId]

    if (status !== undefined && status !== '' && status !== null) {
      whereClause += ' AND o.status = ?'
      params.push(parseInt(status))
    }

    // 查询订单（使用 intentions 表作为意向订单）
    const [rows] = await pool.query(`
      SELECT o.id, o.demand_id, o.resource_id, o.status,
             o.created_at as create_time, o.updated_at,
             d.title as demand_title, d.contact_name as demand_contact, d.phone as demand_phone,
             r.title as resource_title, r.contact_name as resource_contact,
             c.name as community_name
      FROM intentions o
      LEFT JOIN demands d ON o.demand_id = d.id
      LEFT JOIN resources r ON o.resource_id = r.id
      LEFT JOIN communities c ON o.community_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset])

    // 查询总数
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM intentions o ${whereClause}`,
      params
    )

    // 状态映射
    const statusMap = {
      0: { text: '待处理', color: '#FF9800' },
      1: { text: '已接受', color: '#4CAF50' },
      2: { text: '已拒绝', color: '#9E9E9E' },
      3: { text: '已完成', color: '#2196F3' }
    }

    const orders = rows.map(o => ({
      ...o,
      status_text: statusMap[o.status]?.text || '未知',
      status_color: statusMap[o.status]?.color || '#999'
    }))

    pageSuccess(res, orders, total, parseInt(page), parseInt(pageSize))
  } catch (err) {
    console.error('getOrders error:', err)
    error(res, '获取订单列表失败')
  }
}

// 获取订单详情
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params
    const merchantId = req.merchant.id

    const [rows] = await pool.query(`
      SELECT o.*,
             d.title as demand_title, d.content as demand_content, d.contact_name as demand_contact, d.phone as demand_phone, d.budget as demand_budget,
             r.title as resource_title, r.description as resource_desc, r.contact_name as resource_contact,
             c.name as community_name, c.address as community_address
      FROM intentions o
      LEFT JOIN demands d ON o.demand_id = d.id
      LEFT JOIN resources r ON o.resource_id = r.id
      LEFT JOIN communities c ON o.community_id = c.id
      WHERE o.id = ? AND o.merchant_id = ?
    `, [id, merchantId])

    if (rows.length === 0) {
      return error(res, '订单不存在或无权访问', 404)
    }

    success(res, rows[0])
  } catch (err) {
    console.error('getOrderDetail error:', err)
    error(res, '获取订单详情失败')
  }
}

// 更新订单状态
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const merchantId = req.merchant.id

    // 验证订单属于当前商家
    const [rows] = await pool.query(
      'SELECT * FROM intentions WHERE id = ? AND merchant_id = ?',
      [id, merchantId]
    )

    if (rows.length === 0) {
      return error(res, '订单不存在或无权操作', 404)
    }

    await pool.query(
      'UPDATE intentions SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    )

    success(res, null, '状态更新成功')
  } catch (err) {
    console.error('updateOrderStatus error:', err)
    error(res, '更新状态失败')
  }
}

// ============ 商家端收益API ============

// 获取收益概览
exports.getIncome = async (req, res) => {
  try {
    const merchantId = req.merchant.id

    // 本月收益
    const [[{ monthIncome }]] = await pool.query(`
      SELECT COALESCE(SUM(p.amount), 0) as monthIncome
      FROM member_payments p
      WHERE p.merchant_id = ? 
        AND p.status = 1
        AND MONTH(p.created_at) = MONTH(NOW())
        AND YEAR(p.created_at) = YEAR(NOW())
    `, [merchantId])

    // 累计收益
    const [[{ totalIncome }]] = await pool.query(`
      SELECT COALESCE(SUM(p.amount), 0) as totalIncome
      FROM member_payments p
      WHERE p.merchant_id = ? AND p.status = 1
    `, [merchantId])

    // 本月订单数
    const [[{ monthOrders }]] = await pool.query(`
      SELECT COUNT(*) as monthOrders
      FROM intentions
      WHERE merchant_id = ?
        AND status IN (1, 3)
        AND MONTH(created_at) = MONTH(NOW())
        AND YEAR(created_at) = YEAR(NOW())
    `, [merchantId])

    // 待处理订单
    const [[{ pendingOrders }]] = await pool.query(`
      SELECT COUNT(*) as pendingOrders
      FROM intentions
      WHERE merchant_id = ? AND status = 0
    `, [merchantId])

    success(res, {
      monthIncome: parseFloat(monthIncome) || 0,
      totalIncome: parseFloat(totalIncome) || 0,
      monthOrders: monthOrders || 0,
      pendingOrders: pendingOrders || 0
    })
  } catch (err) {
    console.error('getIncome error:', err)
    error(res, '获取收益信息失败')
  }
}

// 获取收益记录
exports.getIncomeRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const merchantId = req.merchant.id

    let whereClause = 'WHERE p.merchant_id = ? AND p.status = 1'
    const params = [merchantId]

    // type: 1=首次开通, 2=续费, 3=升级
    if (type) {
      whereClause += ' AND p.level = ?'
      params.push(parseInt(type))
    }

    const [rows] = await pool.query(`
      SELECT p.*,
             CASE 
               WHEN p.level = 0 THEN '免费试用'
               WHEN p.level = 1 THEN '普通会员'
               WHEN p.level = 2 THEN '银牌会员'
               WHEN p.level = 3 THEN '金牌会员'
               WHEN p.level = 4 THEN '铂金会员'
               WHEN p.level = 5 THEN '钻石会员'
               ELSE CONCAT('等级', p.level)
             END as level_name
      FROM member_payments p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset])

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM member_payments p ${whereClause}`,
      params
    )

    pageSuccess(res, rows, total, parseInt(page), parseInt(pageSize))
  } catch (err) {
    console.error('getIncomeRecords error:', err)
    error(res, '获取收益记录失败')
  }
}

// 获取会员有效期
exports.getMemberExpiry = async (req, res) => {
  try {
    const merchantId = req.merchant.id

    const [[payment]] = await pool.query(`
      SELECT end_date, member_level
      FROM member_payments
      WHERE merchant_id = ? AND status = 1
      ORDER BY end_date DESC
      LIMIT 1
    `, [merchantId])

    if (payment) {
      success(res, {
        memberLevel: payment.member_level,
        endDate: payment.end_date,
        daysLeft: Math.ceil((new Date(payment.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      })
    } else {
      success(res, { memberLevel: 0, endDate: null, daysLeft: 0 })
    }
  } catch (err) {
    console.error('getMemberExpiry error:', err)
    error(res, '获取会员有效期失败')
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

// ============ 商家端首页API ============

// 商家首页数据
exports.getHome = async (req, res) => {
  try {
    const merchantId = req.merchant.id

    // 获取商家信息
    const [merchantRows] = await pool.query(
      `SELECT m.*,
       (SELECT MAX(end_date) FROM member_payments WHERE merchant_id = m.id AND status = 1) as member_expire_at
       FROM merchants m WHERE m.id = ?`,
      [merchantId]
    )

    if (merchantRows.length === 0) {
      return error(res, '用户不存在', 404)
    }

    const merchant = merchantRows[0]

    // 获取统计数据
    const [stats] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM resources WHERE merchant_id = ? AND status = 1) as resourceCount,
        (SELECT COUNT(*) FROM intentions WHERE merchant_id = ? AND status = 1) as intentionCount,
        (SELECT COUNT(*) FROM intentions WHERE merchant_id = ? AND status = 3) as completedCount,
        (SELECT COUNT(*) FROM demands WHERE status = 1) as totalDemands,
        (SELECT COUNT(*) FROM resources WHERE status = 1) as totalResources`,
      [merchantId, merchantId, merchantId]
    )

    const stat = stats[0]

    // 解析JSON字段
    if (typeof merchant.resource_types === 'string') {
      try { merchant.resource_types = JSON.parse(merchant.resource_types) } catch {}
    }
    if (typeof merchant.tags === 'string') {
      try { merchant.tags = JSON.parse(merchant.tags) } catch {}
    }

    // 删除密码
    delete merchant.password

    success(res, {
      ...merchant,
      ...stat,
      member_expire_at: stat.member_expire_at
    })
  } catch (err) {
    console.error('getHome error:', err)
    error(res, '获取首页数据失败')
  }
}
