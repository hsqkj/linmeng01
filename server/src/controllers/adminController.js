/**
 * 管理员控制器
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')
const jwtConfig = require('../config/jwt')
const { success, pageSuccess, error } = require('../utils/response')
const typeMapper = require('../services/typeMapper')

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return error(res, '请输入用户名和密码', 400)
    }
    
    // 查询管理员
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE username = ? AND status = 1',
      [username]
    )
    
    if (rows.length === 0) {
      return error(res, '用户名或密码错误', 401)
    }
    
    const admin = rows[0]
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return error(res, '用户名或密码错误', 401)
    }
    
    // permissions字段：MySQL的JSON类型由mysql2自动反序列化为数组，兼容字符串格式
    let permissions = []
    if (Array.isArray(admin.permissions)) {
      permissions = admin.permissions
    } else if (typeof admin.permissions === 'string') {
      try { permissions = JSON.parse(admin.permissions) } catch (e) { permissions = [] }
    }
    
    // 生成Token
    const token = jwt.sign({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn })
    
    // 更新登录信息
    await pool.query(
      'UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [req.ip, admin.id]
    )
    
    success(res, {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        realName: admin.real_name,
        role: admin.role,
        permissions
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    error(res, '登录失败')
  }
}

// 仪表盘统计
exports.dashboard = async (req, res) => {
  try {
    const { period = 'all' } = req.query
    let dateFilter = ''
    if (period === 'day') {
      dateFilter = " AND DATE(created_at) = CURDATE()"
    } else if (period === 'month') {
      dateFilter = " AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    } else if (period === 'year') {
      dateFilter = " AND YEAR(created_at) = YEAR(CURDATE())"
    }

    // 统计数据
    const [communities] = await pool.query('SELECT COUNT(*) as count FROM communities WHERE status = 1')
    const [merchants] = await pool.query('SELECT COUNT(*) as count FROM merchants WHERE status = 1')
    const [ambassadors] = await pool.query('SELECT COUNT(*) as count FROM ambassadors WHERE status = 1')
    const [demands] = await pool.query('SELECT COUNT(*) as count FROM demands WHERE status = 1' + dateFilter)
    const [resources] = await pool.query('SELECT COUNT(*) as count FROM resources WHERE status = 1' + dateFilter)
    const [intentions] = await pool.query('SELECT COUNT(*) as count FROM intentions WHERE status = 3')
    // 专家数量
    let expertsCount = 0
    try {
      const [[expertsResult]] = await pool.query('SELECT COUNT(*) as count FROM experts WHERE status = 1')
      expertsCount = expertsResult ? expertsResult.count : 0
    } catch (e) {
      console.log('Experts query failed, using 0')
    }

    // 总浏览量（需求+资源的浏览量总和，status=1的记录）
    const [[demandViews]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM demands WHERE status = 1')
    const [[resourceViews]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM resources WHERE status = 1')

    // 安全检查：浏览量不应超过合理范围（每人每天最多浏览1000条内容，累计不超过100万）
    const safeDemandViews = Math.min(Number(demandViews?.total) || 0, 1000000)
    const safeResourceViews = Math.min(Number(resourceViews?.total) || 0, 1000000)
    const safeTotalViews = safeDemandViews + safeResourceViews

    // 留言数统计（使用comments表的评论数）
    let commentsCount = 0
    try {
      const [[commentsResult]] = await pool.query('SELECT COUNT(*) as count FROM comments')
      commentsCount = commentsResult ? commentsResult.count : 0
    } catch (e) {
      console.log('Comments query failed, using 0')
    }

    // 待审核数量
    const [pendingCommunities] = await pool.query('SELECT COUNT(*) as count FROM communities WHERE status = 0')
    const [pendingMerchants] = await pool.query('SELECT COUNT(*) as count FROM merchants WHERE status = 0')
    const [pendingDemands] = await pool.query('SELECT COUNT(*) as count FROM demands WHERE status = 0')
    const [pendingResources] = await pool.query('SELECT COUNT(*) as count FROM resources WHERE status = 0')

    // 活跃度排名 - 社区（按发布需求数排序）
    let communityRanking = []
    try {
      const [cr] = await pool.query(`
        SELECT c.id, c.community_name as name, COUNT(d.id) as count
        FROM communities c
        LEFT JOIN demands d ON d.community_id = c.id AND d.status = 1
        GROUP BY c.id, c.community_name
        ORDER BY count DESC
        LIMIT 10
      `)
      communityRanking = cr || []
    } catch (e) {
      console.log('Community ranking query failed')
    }

    // 活跃度排名 - 商家（按发布资源数排序）
    let merchantRanking = []
    try {
      const [mr] = await pool.query(`
        SELECT m.id, m.company_name as name, COUNT(r.id) as count
        FROM merchants m
        LEFT JOIN resources r ON r.merchant_id = m.id AND r.status = 1
        GROUP BY m.id, m.company_name
        ORDER BY count DESC
        LIMIT 10
      `)
      merchantRanking = mr || []
    } catch (e) {
      console.log('Merchant ranking query failed')
    }

    // 活跃度排名 - 大使（按撮合意向数排序）
    let ambassadorRanking = []
    try {
      const [ar] = await pool.query(`
        SELECT a.id, a.real_name as name, COUNT(i.id) as count
        FROM ambassadors a
        LEFT JOIN intentions i ON i.ambassador_id = a.id
        GROUP BY a.id, a.real_name
        ORDER BY count DESC
        LIMIT 10
      `)
      ambassadorRanking = ar || []
    } catch (e) {
      console.log('Ambassador ranking query failed')
    }

    success(res, {
      total: {
        communities: communities[0].count,
        merchants: merchants[0].count,
        ambassadors: ambassadors[0].count,
        demands: demands[0].count,
        resources: resources[0].count,
        completedMatches: intentions[0].count,
        totalViews: safeTotalViews,
        comments: commentsCount,
        experts: expertsCount
      },
      pending: {
        communities: pendingCommunities[0].count,
        merchants: pendingMerchants[0].count,
        demands: pendingDemands[0].count,
        resources: pendingResources[0].count,
        total: pendingCommunities[0].count + pendingMerchants[0].count + pendingDemands[0].count + pendingResources[0].count
      },
      ranking: {
        communities: communityRanking,
        merchants: merchantRanking,
        ambassadors: ambassadorRanking
      }
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    error(res, '获取统计数据失败')
  }
}

// 获取社区用户列表
exports.getCommunities = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword, district } = req.query
    const offset = (page - 1) * pageSize
    
    let where = '1=1'
    const params = []
    
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }

    if (district) {
      where += ' AND district LIKE ?'
      params.push(`%${district}%`)
    }

    if (keyword) {
      where += ' AND (real_name LIKE ? OR phone LIKE ? OR community_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const [rows] = await pool.query(
      `SELECT id, username, real_name, phone, district, street, community, community_name, position, status, created_at 
       FROM communities WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM communities WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('Get communities error:', err)
    error(res, '获取社区列表失败')
  }
}

// 获取社区详情
exports.getCommunityDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      'SELECT * FROM communities WHERE id = ?',
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '社区不存在', 404)
    }
    
    const community = rows[0]
    delete community.password
    
    // 获取发布的需求
    const [demands] = await pool.query(
      'SELECT id, title, demand_type, status, created_at FROM demands WHERE community_id = ? ORDER BY created_at DESC',
      [id]
    )
    
    // 获取对接记录
    const [intentions] = await pool.query(
      `SELECT i.*, m.company_name 
       FROM intentions i 
       LEFT JOIN merchants m ON i.merchant_id = m.id 
       WHERE i.community_id = ? ORDER BY i.created_at DESC LIMIT 10`,
      [id]
    )
    
    // 获取小区列表
    const [compounds] = await pool.query(
      'SELECT id, name, households, sort_order FROM community_compounds WHERE community_id = ? ORDER BY sort_order, id',
      [id]
    )
    
    // 获取场地列表
    const [spaces] = await pool.query(
      'SELECT id, name, location_type, floor_number, area, capacity, facilities, available_hours, images, description, sort_order, status FROM community_spaces WHERE community_id = ? ORDER BY sort_order, id',
      [id]
    )
    // 解析 JSON 字段
    spaces.forEach(s => {
      try { s.facilities = s.facilities ? (typeof s.facilities === 'string' ? JSON.parse(s.facilities) : s.facilities) : [] } catch { s.facilities = [] }
      try { s.images = s.images ? (typeof s.images === 'string' ? JSON.parse(s.images) : s.images) : [] } catch { s.images = [] }
    })
    
    success(res, {
      ...community,
      demands,
      intentions,
      compounds,
      spaces
    })
  } catch (err) {
    console.error('Get community detail error:', err)
    error(res, '获取详情失败')
  }
}

// 更新社区状态
exports.updateCommunityStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, rejectReason } = req.body
    
    await pool.query(
      'UPDATE communities SET status = ?, reject_reason = ? WHERE id = ?',
      [status, rejectReason || null, id]
    )
    
    success(res, null, '状态更新成功')
  } catch (err) {
    console.error('Update community status error:', err)
    error(res, '更新状态失败')
  }
}

// 获取商家列表
exports.getMerchants = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, level, keyword, industry, district, street, community } = req.query
    const offset = (page - 1) * pageSize
    
    let where = '1=1'
    const params = []
    
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }
    
    if (level) {
      where += ' AND member_level = ?'
      params.push(level)
    }

    if (industry) {
      where += ' AND industry = ?'
      params.push(industry)
    }

    if (district) {
      where += ' AND district = ?'
      params.push(district)
    }

    if (street) {
      where += ' AND street = ?'
      params.push(street)
    }

    if (community) {
      where += ' AND community = ?'
      params.push(community)
    }

    if (keyword) {
      where += ' AND (company_name LIKE ? OR contact_name LIKE ? OR phone LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const [rows] = await pool.query(
      `SELECT id, username, company_name, contact_name, phone, industry, member_level, star_rating, status, company_type, district, street, community, created_at
       FROM merchants WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM merchants WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('Get merchants error:', err)
    error(res, '获取商家列表失败')
  }
}

// 获取商家详情
exports.getMerchantDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      'SELECT * FROM merchants WHERE id = ?',
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '商家不存在', 404)
    }
    
    const merchant = rows[0]
    delete merchant.password
    
    // 获取发布的资源
    const [resources] = await pool.query(
      'SELECT id, title, resource_type, status, created_at FROM resources WHERE merchant_id = ? ORDER BY created_at DESC',
      [id]
    )
    
    // 获取对接记录
    const [intentions] = await pool.query(
      `SELECT i.*, c.community_name 
       FROM intentions i 
       LEFT JOIN communities c ON i.community_id = c.id 
       WHERE i.merchant_id = ? ORDER BY i.created_at DESC LIMIT 10`,
      [id]
    )
    
    // 获取缴费记录
    const [payments] = await pool.query(
      'SELECT * FROM member_payments WHERE merchant_id = ? ORDER BY created_at DESC LIMIT 5',
      [id]
    )
    
    success(res, {
      ...merchant,
      resources,
      intentions,
      payments
    })
  } catch (err) {
    console.error('Get merchant detail error:', err)
    error(res, '获取详情失败')
  }
}

// 更新商家状态
exports.updateMerchantStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, rejectReason } = req.body
    
    // 审核通过时（status=1），自动设置为免费试用等级（member_level=0）
    let levelUpdate = ''
    let params = [status, rejectReason || null, id]
    if (status === 1) {
      levelUpdate = ', member_level = 0'
    }
    
    await pool.query(
      `UPDATE merchants SET status = ?, reject_reason = ?${levelUpdate} WHERE id = ?`,
      params
    )
    
    success(res, null, '状态更新成功')
  } catch (err) {
    console.error('Update merchant status error:', err)
    error(res, '更新状态失败')
  }
}

// 更新商家会员等级
exports.updateMerchantLevel = async (req, res) => {
  try {
    const { id } = req.params
    const { level } = req.body
    
    await pool.query(
      'UPDATE merchants SET member_level = ? WHERE id = ?',
      [level, id]
    )
    
    success(res, null, '等级更新成功')
  } catch (err) {
    console.error('Update merchant level error:', err)
    error(res, '更新等级失败')
  }
}

// 更新商家评级
exports.updateMerchantRating = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, reason } = req.body
    
    await pool.query(
      'UPDATE merchants SET star_rating = ?, rating_updated_at = NOW() WHERE id = ?',
      [rating, id]
    )
    
    success(res, null, '评级更新成功')
  } catch (err) {
    console.error('Update merchant rating error:', err)
    error(res, '更新评级失败')
  }
}

// 获取大使列表
exports.getAmbassadors = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const offset = (page - 1) * pageSize
    
    let where = '1=1'
    const params = []
    
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }
    
    const [rows] = await pool.query(
      `SELECT id, username, real_name, phone, total_merchants, total_commission, pending_commission, status, created_at 
       FROM ambassadors WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM ambassadors WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('Get ambassadors error:', err)
    error(res, '获取大使列表失败')
  }
}

// 获取大使详情
exports.getAmbassadorDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      'SELECT * FROM ambassadors WHERE id = ?',
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '大使不存在', 404)
    }
    
    const ambassador = rows[0]
    delete ambassador.password
    
    // 获取发展商家列表
    const [merchants] = await pool.query(
      'SELECT id, company_name, member_level, status, created_at FROM merchants WHERE ambassador_id = ? ORDER BY created_at DESC',
      [id]
    )
    
    // 获取提成记录
    const [commissions] = await pool.query(
      'SELECT * FROM commission_records WHERE ambassador_id = ? ORDER BY created_at DESC LIMIT 20',
      [id]
    )
    
    success(res, {
      ...ambassador,
      merchants,
      commissions
    })
  } catch (err) {
    console.error('Get ambassador detail error:', err)
    error(res, '获取详情失败')
  }
}

// 更新大使状态
exports.updateAmbassadorStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, rejectReason } = req.body
    
    await pool.query(
      'UPDATE ambassadors SET status = ?, reject_reason = ? WHERE id = ?',
      [status, rejectReason || null, id]
    )
    
    success(res, null, '状态更新成功')
  } catch (err) {
    console.error('Update ambassador status error:', err)
    error(res, '更新状态失败')
  }
}

// ============ 管理员管理 ============

exports.getAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, real_name, phone, role, permissions, status, last_login_at, created_at FROM admins ORDER BY created_at DESC'
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取管理员列表失败')
  }
}

exports.createAdmin = async (req, res) => {
  try {
    const { username, password, realName, phone, role, permissions } = req.body
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    await pool.query(
      'INSERT INTO admins (username, password, real_name, phone, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, realName, phone, role, JSON.stringify(permissions || [])]
    )
    
    success(res, null, '创建成功')
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, '用户名已存在', 400)
    }
    error(res, '创建失败')
  }
}

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { realName, phone, role, permissions, password } = req.body
    
    let sql = 'UPDATE admins SET real_name = ?, phone = ?, role = ?, permissions = ?'
    const params = [realName, phone, role, JSON.stringify(permissions || [])]
    
    if (password) {
      sql += ', password = ?'
      params.push(await bcrypt.hash(password, 10))
    }
    
    sql += ' WHERE id = ?'
    params.push(id)
    
    await pool.query(sql, params)
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params
    
    if (id === 1) {
      return error(res, '不能删除超级管理员', 400)
    }
    
    await pool.query('DELETE FROM admins WHERE id = ?', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// ============ 内容审核 ============

exports.getDemandAuditList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize
    
    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.real_name as community_real_name
       FROM demands d
       LEFT JOIN communities c ON d.community_id = c.id
       WHERE d.status = 0
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM demands WHERE status = 0')
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取审核列表失败')
  }
}

exports.passDemand = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE demands SET status = 1 WHERE id = ?', [id])
    success(res, null, '审核通过')
  } catch (err) {
    error(res, '操作失败')
  }
}

exports.rejectDemand = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    await pool.query('UPDATE demands SET status = 2, reject_reason = ? WHERE id = ?', [reason, id])
    success(res, null, '已驳回')
  } catch (err) {
    error(res, '操作失败')
  }
}

exports.getResourceAuditList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize
    
    const [rows] = await pool.query(
      `SELECT r.*, m.company_name, m.contact_name
       FROM resources r
       LEFT JOIN merchants m ON r.merchant_id = m.id
       WHERE r.status = 0
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    )
    
    // 解析 images 字段（从 JSON 字符串转为数组）
    rows.forEach(r => {
      if (r.images) {
        try { r.images = JSON.parse(r.images) } catch { r.images = [] }
      } else {
        r.images = []
      }
    })
    
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM resources WHERE status = 0')
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取审核列表失败')
  }
}

exports.passResource = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE resources SET status = 1 WHERE id = ?', [id])
    success(res, null, '审核通过')
  } catch (err) {
    error(res, '操作失败')
  }
}

exports.rejectResource = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    await pool.query('UPDATE resources SET status = 2, reject_reason = ? WHERE id = ?', [reason, id])
    success(res, null, '已驳回')
  } catch (err) {
    error(res, '操作失败')
  }
}

// ============ 撮合管理 ============

exports.getMatchingList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, status_in, keyword } = req.query
    const offset = (page - 1) * pageSize

    let where = '1=1'
    const params = []

    if (status) {
      where += ' AND i.status = ?'
      params.push(status)
    }

    if (status_in) {
      const statuses = status_in.split(',').map(s => parseInt(s.trim()))
      where += ` AND i.status IN (${statuses.join(',')})`
    }

    if (keyword) {
      where += ' AND (i.demand_id IN (SELECT id FROM demands WHERE title LIKE ?) OR i.resource_id IN (SELECT id FROM resources WHERE title LIKE ?) OR m.company_name LIKE ? OR c.community_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const [rows] = await pool.query(
      `SELECT i.*, c.community_name, m.company_name,
       (SELECT title FROM demands WHERE id = i.demand_id) as demand_title,
       (SELECT title FROM resources WHERE id = i.resource_id) as resource_title
       FROM intentions i
       LEFT JOIN communities c ON i.community_id = c.id
       LEFT JOIN merchants m ON i.merchant_id = m.id
       WHERE ${where}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM intentions i WHERE ${where}`,
      params
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取撮合列表失败')
  }
}

exports.getMatchingDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const [rows] = await pool.query(
      `SELECT i.*, c.community_name, c.real_name as community_real_name, c.phone as community_phone,
       m.company_name, m.contact_name, m.phone as merchant_phone
       FROM intentions i
       LEFT JOIN communities c ON i.community_id = c.id
       LEFT JOIN merchants m ON i.merchant_id = m.id
       WHERE i.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return error(res, '记录不存在', 404)
    }
    
    success(res, rows[0])
  } catch (err) {
    error(res, '获取详情失败')
  }
}

exports.completeMatching = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE intentions SET status = 3, completed_at = NOW() WHERE id = ?', [id])
    success(res, null, '标记完成')
  } catch (err) {
    error(res, '操作失败')
  }
}

exports.grantReward = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    // 获取撮合信息
    const [[intention]] = await pool.query(
      'SELECT * FROM intentions WHERE id = ?',
      [id]
    )
    
    // 创建奖励记录
    await pool.query(
      'INSERT INTO reward_records (intention_id, community_id, reward_content, status) VALUES (?, ?, ?, 1)',
      [id, intention.community_id, content || '撮合成功奖励']
    )
    
    // 更新撮合状态
    await pool.query('UPDATE intentions SET status = 3, completed_at = NOW() WHERE id = ?', [id])
    
    success(res, null, '奖励发放成功')
  } catch (err) {
    error(res, '操作失败')
  }
}

// ============ 留言管理 ============

exports.getComments = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, keyword, status, merge = 'true' } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    let where = '1=1'
    let queryParams = []

    if (type === 'demand') {
      where += ' AND c.demand_id IS NOT NULL'
    } else if (type === 'resource') {
      where += ' AND c.resource_id IS NOT NULL'
    }
    if (keyword) {
      where += ` AND c.content LIKE ?`
      queryParams.push('%' + keyword + '%')
    }
    // 支持 status 筛选（0=已删除，1=正常，空=全部）
    if (status !== undefined && status !== '') {
      where += ' AND c.status = ?'
      queryParams.push(parseInt(status))
    }

    // 获取基础留言数据
    const [rows] = await pool.query(
      `SELECT c.*,
       m.company_name as merchant_name,
      m.logo as merchant_logo,
      com.community_name as community_name,
      com.logo as community_logo,
      d.title as demand_title,
      r.title as resource_title,
      res_m.company_name as resource_merchant_name
      FROM comments c
      LEFT JOIN merchants m ON c.user_type = 2 AND c.user_id = m.id
      LEFT JOIN communities com ON c.user_type = 1 AND c.user_id = com.id
      LEFT JOIN demands d ON c.demand_id IS NOT NULL AND c.demand_id = d.id
      LEFT JOIN resources r ON c.resource_id IS NOT NULL AND c.resource_id = r.id
      LEFT JOIN merchants res_m ON r.merchant_id = res_m.id
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(pageSize), offset]
    )

    // 如果需要合并多轮留言（按target_id合并同一会话的留言）
    if (merge === 'true') {
      const mergedMap = new Map()

      for (const row of rows) {
        // 合并标识：需求留言用 demand_id，资源留言用 resource_id + sender_id
        const mergeKey = row.demand_id
          ? `d_${row.demand_id}_${row.user_id}`
          : `r_${row.resource_id}_${row.user_id}`

        if (mergedMap.has(mergeKey)) {
          // 追加到已有留言
          mergedMap.get(mergeKey).replies.push({
            id: row.id,
            content: row.content,
            sender: row.community_name || row.merchant_name || '用户',
            user_type: row.user_type,
            avatar: row.community_logo || row.merchant_logo || null,
            created_at: row.created_at,
            status: row.status
          })
        } else {
          // 新建合并条目
          mergedMap.set(mergeKey, {
            ...row,
            replies: row.reply_to ? [{
              id: row.id,
              content: row.content,
              sender: row.community_name || row.merchant_name || '用户',
              user_type: row.user_type,
              avatar: row.community_logo || row.merchant_logo || null,
              created_at: row.created_at,
              status: row.status
            }] : []
          })
          // 如果不是回复，保留原始内容
          if (!row.reply_to) {
            mergedMap.get(mergeKey).main_content = row.content
            mergedMap.get(mergeKey).main_id = row.id
            mergedMap.get(mergeKey).main_created_at = row.created_at
            mergedMap.get(mergeKey).replies = []
          }
        }
      }

      const mergedList = Array.from(mergedMap.values()).map(item => ({
        id: item.main_id || item.id,
        demand_id: item.demand_id,
        resource_id: item.resource_id,
        demand_title: item.demand_title,
        resource_title: item.resource_title,
        resource_merchant_name: item.resource_merchant_name,
        user_id: item.user_id,
        user_type: item.user_type,
        community_name: item.community_name,
        community_logo: item.community_logo,
        merchant_name: item.merchant_name,
        merchant_logo: item.merchant_logo,
        content: item.main_content || item.content,
        status: item.status,
        created_at: item.main_created_at || item.created_at,
        reply_count: item.replies.length,
        replies: item.replies
      }))

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM comments c WHERE ${where}`,
        queryParams
      )

      pageSuccess(res, mergedList, total, page, pageSize)
    } else {
      // 不合并，直接返回
      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM comments c WHERE ${where}`,
        queryParams
      )

      pageSuccess(res, rows, total, page, pageSize)
    }
  } catch (err) {
    console.error('获取留言列表失败:', err)
    error(res, '获取留言列表失败')
  }
}

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE comments SET status = 0 WHERE id = ?', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// ============ 配置管理 ============

const DEFAULT_INDUSTRY_TYPES = [
  '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果',
  '美业', '保健养生', '体育健身', '银行保险', '电信服务',
  '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材',
  '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务',
  '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰',
  '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
  '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体',
  '自媒体', 'IT互联网', '软件开发', '图文广告', '电子电器维修',
  '家居维修', '美发', '建筑工程', '其他'
].map(name => ({ name, enabled: true }))

// 专家类型默认值（与 typeMapper.js 保持一致）
const DEFAULT_EXPERT_TYPES = [
  { id: 0, name: '法律专家', count: 0, enabled: true },
  { id: 1, name: '心理咨询师', count: 0, enabled: true },
  { id: 2, name: '健康管理师', count: 0, enabled: true },
  { id: 3, name: '家庭教育指导师', count: 0, enabled: true },
  { id: 4, name: '社区治理专家', count: 0, enabled: true },
  { id: 5, name: '艺术指导师', count: 0, enabled: true },
  { id: 6, name: '体育指导师', count: 0, enabled: true },
  { id: 7, name: '金融理财师', count: 0, enabled: true },
  { id: 8, name: '养老护理员', count: 0, enabled: true },
  { id: 9, name: '其他专家', count: 0, enabled: true }
]

exports.getBasicTypesConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'")
    const [expertRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'expert_types'")
    if (rows.length === 0) {
      return success(res, {
        activityTypes: [], enterpriseTypes: [], resourceTypes: [], expertTypes: [],
        industryTypes: DEFAULT_INDUSTRY_TYPES, communityTypes: [], residentTypes: []
      })
    }
    const data = JSON.parse(rows[0].config_value)
    // 行业类型为空时自动填充默认值（而非空数组）
    if (!data.industryTypes || data.industryTypes.length === 0) {
      data.industryTypes = DEFAULT_INDUSTRY_TYPES
    }
    // 兼容旧数据：补充空数组
    if (!data.communityTypes || data.communityTypes.length === 0) {
      data.communityTypes = []
    }
    // 兼容旧数据：补充空数组
    if (!data.residentTypes || data.residentTypes.length === 0) {
      data.residentTypes = []
    }
    // 合并 expertTypes：优先使用 expert_types 配置的29种数据
    if (expertRows.length > 0) {
      try {
        const expertData = JSON.parse(expertRows[0].config_value)
        if (Array.isArray(expertData) && expertData.length > 0) {
          data.expertTypes = expertData.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false && t.status !== 0 }))
        }
      } catch (e) {
        console.error('Parse expert_types error:', e)
      }
    }
    // 如果没有获取到专家类型，使用默认10种
    if (!data.expertTypes || data.expertTypes.length === 0) {
      data.expertTypes = DEFAULT_EXPERT_TYPES
    }
    success(res, data)
  } catch (err) {
    error(res, '获取配置失败')
  }
}

exports.saveBasicTypesConfig = async (req, res) => {
  try {
    const config = req.body
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('basic_types', ?, 'basic', '基础数据类型配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    )
    // 刷新类型映射缓存
    if (typeMapper.refresh) {
      await typeMapper.refresh()
    }
    success(res, null, '保存成功')
  } catch (err) {
    error(res, '保存失败')
  }
}

exports.getMemberConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_key, config_value FROM sys_configs WHERE config_type = 'member'")
    const config = {}
    rows.forEach(row => {
      config[row.config_key] = JSON.parse(row.config_value)
    })
    success(res, config)
  } catch (err) {
    error(res, '获取配置失败')
  }
}

exports.saveMemberConfig = async (req, res) => {
  try {
    const { member_levels, member_benefits } = req.body
    
    if (member_levels) {
      await pool.query(
        "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('member_levels', ?, 'member') ON DUPLICATE KEY UPDATE config_value = ?",
        [JSON.stringify(member_levels), JSON.stringify(member_levels)]
      )
    }
    
    if (member_benefits) {
      await pool.query(
        "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('member_benefits', ?, 'member') ON DUPLICATE KEY UPDATE config_value = ?",
        [JSON.stringify(member_benefits), JSON.stringify(member_benefits)]
      )
    }
    
    success(res, null, '保存成功')
  } catch (err) {
    error(res, '保存失败')
  }
}

exports.getAmbassadorConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_key, config_value FROM sys_configs WHERE config_type = 'ambassador'")
    const config = {}
    rows.forEach(row => {
      config[row.config_key] = JSON.parse(row.config_value)
    })
    success(res, config)
  } catch (err) {
    error(res, '获取配置失败')
  }
}

exports.saveAmbassadorConfig = async (req, res) => {
  try {
    const { ambassador_commission } = req.body
    
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('ambassador_commission', ?, 'ambassador') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(ambassador_commission), JSON.stringify(ambassador_commission)]
    )
    
    success(res, null, '保存成功')
  } catch (err) {
    error(res, '保存失败')
  }
}

exports.getRewardConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_key, config_value FROM sys_configs WHERE config_type = 'reward'")
    const config = {}
    rows.forEach(row => {
      try {
        config[row.config_key] = JSON.parse(row.config_value)
      } catch {
        config[row.config_key] = row.config_value
      }
    })
    // 返回前端需要的格式
    const result = {
      rewardValue: config.reward_base?.rewardValue || 200,
      rewardDesc: config.reward_base?.rewardDesc || '撮合成功奖励物资（价值约200元）',
      rewardType: config.reward_base?.rewardType || 'material',
      enabled: config.reward_base?.enabled !== false,
      deliveryMethod: config.reward_base?.deliveryMethod || 'auto',
      monthlyLimit: config.reward_base?.monthlyLimit || 0,
      firstOrderBonus: config.reward_base?.firstOrderBonus || 50,
      streakBonus: config.reward_base?.streakBonus || 100,
      highQualityBonus: config.reward_base?.highQualityBonus || 30,
      levelBonus: config.level_bonus || []
    }
    success(res, result)
  } catch (err) {
    error(res, '获取配置失败')
  }
}

exports.saveRewardConfig = async (req, res) => {
  try {
    const { rewardValue, rewardDesc, rewardType, enabled, deliveryMethod, monthlyLimit, firstOrderBonus, streakBonus, highQualityBonus, levelBonus } = req.body
    
    // 保存基本配置
    const baseConfig = { rewardValue, rewardDesc, rewardType, enabled, deliveryMethod, monthlyLimit, firstOrderBonus, streakBonus, highQualityBonus }
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('reward_base', ?, 'reward') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(baseConfig), JSON.stringify(baseConfig)]
    )
    
    // 保存等级奖励倍数
    if (levelBonus && Array.isArray(levelBonus)) {
      await pool.query(
        "INSERT INTO sys_configs (config_key, config_value, config_type) VALUES ('level_bonus', ?, 'reward') ON DUPLICATE KEY UPDATE config_value = ?",
        [JSON.stringify(levelBonus), JSON.stringify(levelBonus)]
      )
    }
    
    success(res, null, '保存成功')
  } catch (err) {
    console.error('保存奖励配置失败:', err)
    error(res, '保存失败')
  }
}

exports.getRatingConfig = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT config_value FROM sys_configs WHERE config_key = 'rating_config'"
    )
    
    if (rows.length === 0) {
      return success(res, {
        dimensions: [
          { name: '服务质量', weight: 30 },
          { name: '响应速度', weight: 20 },
          { name: '活跃程度', weight: 25 },
          { name: '合作表现', weight: 25 }
        ],
        starRules: [
          { star: 5, minScore: 90 },
          { star: 4, minScore: 75 },
          { star: 3, minScore: 60 },
          { star: 2, minScore: 40 },
          { star: 1, minScore: 0 }
        ]
      })
    }
    
    success(res, JSON.parse(rows[0].config_value))
  } catch (err) {
    error(res, '获取配置失败')
  }
}

exports.saveRatingConfig = async (req, res) => {
  try {
    const config = req.body
    
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('rating_config', ?, 'rating', '商家评级标准配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    )
    
    success(res, null, '保存成功')
  } catch (err) {
    error(res, '保存失败')
  }
}

// ============ 轮播图配置 ============

exports.getBanners = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order, created_at')
    success(res, rows)
  } catch (err) {
    error(res, '获取轮播图失败')
  }
}

exports.createBanner = async (req, res) => {
  try {
    const { title, image_url, link_url, position, sort_order } = req.body
    await pool.query(
      'INSERT INTO banners (title, image_url, link_url, position, sort_order) VALUES (?, ?, ?, ?, ?)',
      [title, image_url, link_url, position, sort_order || 0]
    )
    success(res, null, '创建成功')
  } catch (err) {
    error(res, '创建失败')
  }
}

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params
    const { title, image_url, link_url, position, sort_order, status } = req.body
    await pool.query(
      'UPDATE banners SET title = ?, image_url = ?, link_url = ?, position = ?, sort_order = ?, status = ? WHERE id = ?',
      [title, image_url, link_url, position, sort_order, status, id]
    )
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM banners WHERE id = ?', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// ============ 标签配置 ============

// 标签类型映射：字符串 -> 数字
const TAG_TYPE_MAP = {
  'community': 1,  // 社区标签
  'merchant': 2,   // 商家标签
  'custom': 3      // 自定义标签
}

exports.getTags = async (req, res) => {
  try {
    const { type } = req.query
    let where = '1=1'
    const params = []
    
    if (type) {
      // 将字符串类型转换为数字
      const typeNum = TAG_TYPE_MAP[type] || type
      where += ' AND type = ?'
      params.push(typeNum)
    }
    
    const [rows] = await pool.query('SELECT * FROM tags WHERE ' + where + ' ORDER BY type, id', params)
    success(res, rows)
  } catch (err) {
    error(res, '获取标签失败')
  }
}

exports.createTag = async (req, res) => {
  try {
    const { name, type, category } = req.body
    // 将字符串类型转换为数字
    const typeNum = TAG_TYPE_MAP[type] || type
    await pool.query('INSERT INTO tags (name, type, category) VALUES (?, ?, ?)', [name, typeNum, category])
    success(res, null, '创建成功')
  } catch (err) {
    error(res, '创建失败')
  }
}

exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params
    const { name, category, status } = req.body
    await pool.query('UPDATE tags SET name = ?, category = ?, status = ? WHERE id = ?', [name, category, status, id])
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM tags WHERE id = ? AND is_system = 0', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// ============ 行政区划配置 ============

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
    
    const [rows] = await pool.query('SELECT * FROM regions WHERE ' + where + ' ORDER BY sort_order', params)
    success(res, rows)
  } catch (err) {
    error(res, '获取行政区划失败')
  }
}

exports.createRegion = async (req, res) => {
  try {
    const { name, level, parent_id } = req.body
    await pool.query('INSERT INTO regions (name, level, parent_id) VALUES (?, ?, ?)', [name, level, parent_id || 0])
    success(res, null, '创建成功')
  } catch (err) {
    error(res, '创建失败')
  }
}

exports.updateRegion = async (req, res) => {
  try {
    const { id } = req.params
    const { name, sort_order } = req.body
    await pool.query('UPDATE regions SET name = ?, sort_order = ? WHERE id = ?', [name, sort_order, id])
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

exports.deleteRegion = async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查是否有子节点
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM regions WHERE parent_id = ?', [id])
    if (count > 0) {
      return error(res, '请先删除子节点', 400)
    }
    
    await pool.query('DELETE FROM regions WHERE id = ?', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

// ============ 财务管理 ============

exports.getFinance = async (req, res) => {
  try {
    // 会费收入
    const [[memberIncome]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM member_payments WHERE status = 1"
    )
    
    // 提成支出
    const [[commissionPay]] = await pool.query(
      "SELECT COALESCE(SUM(commission_amount), 0) as total FROM commission_records WHERE status >= 1"
    )
    
    // 撮合次数
    const [[matchCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM intentions WHERE status = 3"
    )
    
    // 奖励发放
    const [[rewardPay]] = await pool.query(
      "SELECT COALESCE(SUM(reward_value), 0) as total FROM reward_records WHERE status >= 1"
    )
    
    success(res, {
      memberIncome: memberIncome.total,
      commissionPay: commissionPay.total,
      matchCount: matchCount.count,
      rewardPay: rewardPay.total,
      profit: memberIncome.total - commissionPay.total - rewardPay.total
    })
  } catch (err) {
    error(res, '获取财务数据失败')
  }
}

// 获取奖励记录列表
exports.getRewardRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize

    const [rows] = await pool.query(
      `SELECT r.*,
       c.community_name,
       i.demand_id, i.resource_id,
       (SELECT title FROM demands WHERE id = i.demand_id) as demand_title,
       (SELECT title FROM resources WHERE id = i.resource_id) as resource_title
       FROM reward_records r
       JOIN intentions i ON r.intention_id = i.id
       LEFT JOIN communities c ON r.community_id = c.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), parseInt(offset)]
    )

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM reward_records')

    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('getRewardRecords error:', err)
    error(res, '获取奖励记录失败')
  }
}

// 获取大使提成记录
exports.getCommissionRecords = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cr.*,
       a.real_name as ambassador_name, a.phone as ambassador_phone,
       m.company_name as merchant_name
       FROM commission_records cr
       LEFT JOIN ambassadors a ON cr.ambassador_id = a.id
       LEFT JOIN merchants m ON cr.merchant_id = m.id
       ORDER BY cr.created_at DESC
       LIMIT 100`
    )
    success(res, rows)
  } catch (err) {
    console.error('getCommissionRecords error:', err)
    error(res, '获取提成记录失败')
  }
}

// ============ 系统通知管理 ============

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, target_type } = req.query
    const offset = (page - 1) * pageSize

    let where = '1=1'
    const params = []

    if (status !== undefined) {
      where += ' AND status = ?'
      params.push(status)
    }
    if (target_type) {
      where += ' AND target_type = ?'
      params.push(target_type)
    }

    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.content, n.target_type, n.priority, n.status, n.published_at, n.created_at,
       a.real_name as creator_name
       FROM system_notifications n
       LEFT JOIN admins a ON n.created_by = a.id
       WHERE ${where}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM system_notifications WHERE ${where}`,
      params
    )

    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('Get notifications error:', err)
    error(res, '获取通知列表失败')
  }
}

exports.getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      'SELECT n.*, a.real_name as creator_name FROM system_notifications n LEFT JOIN admins a ON n.created_by = a.id WHERE n.id = ?',
      [id]
    )
    if (rows.length === 0) return error(res, '通知不存在', 404)
    success(res, rows[0])
  } catch (err) {
    error(res, '获取详情失败')
  }
}

exports.createNotification = async (req, res) => {
  try {
    const { title, content, target_type = 'all', target_ids, priority = 0, draft = false } = req.body
    const adminId = req.auth?.id || null
    
    // 转换target_type: all=0, community=1, merchant=2, ambassador=3
    const targetTypeMap = { all: 0, community: 1, merchant: 2, ambassador: 3 }
    const targetTypeValue = targetTypeMap[target_type] ?? 0

    const [result] = await pool.query(
      `INSERT INTO system_notifications (title, content, target_type, target_ids, priority, status, published_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        targetTypeValue,
        target_ids ? JSON.stringify(target_ids) : null,
        priority,
        draft ? 0 : 1,
        draft ? null : new Date(),
        adminId
      ]
    )

    // 非草稿：立即推送给目标用户
    if (!draft) {
      await pushNotification(result.insertId, targetTypeValue, target_ids)
    }

    success(res, { id: result.insertId }, draft ? '草稿已保存' : '通知已发布')
  } catch (err) {
    console.error('Create notification error:', err)
    error(res, '创建失败')
  }
}

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, target_type, target_ids, priority, status } = req.body

    await pool.query(
      `UPDATE system_notifications SET title = ?, content = ?, target_type = ?, target_ids = ?, priority = ?, status = ? WHERE id = ?`,
      [
        title,
        content,
        target_type,
        target_ids ? JSON.stringify(target_ids) : null,
        priority,
        status,
        id
      ]
    )

    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    // 1. 删除通知（软删除）
    await pool.query('UPDATE system_notifications SET status = 3 WHERE id = ?', [id])

    // 2. 删除已推送到消息表的相关记录
    // 同时匹配 notificationId 为数字和字符串两种格式
    const likeNum = `%notificationId\":${id}%`
    const likeStr = `%notificationId\":\"${id}\"%`
    await pool.query(
      "DELETE FROM message WHERE (content LIKE ? OR content LIKE ?) AND msg_type = 1",
      [likeNum, likeStr]
    )

    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
}

exports.publishNotification = async (req, res) => {
  try {
    const { id } = req.params
    const [[notif]] = await pool.query('SELECT * FROM system_notifications WHERE id = ? AND status = 0', [id])
    if (!notif) return error(res, '通知不存在或已发布', 404)

    await pool.query('UPDATE system_notifications SET status = 1, published_at = NOW() WHERE id = ?', [id])
    await pushNotification(id, notif.target_type, notif.target_ids)

    success(res, null, '发布成功')
  } catch (err) {
    error(res, '发布失败')
  }
}

// 推送通知给用户（写入消息表）
// targetType: 0=all, 1=community, 2=merchant, 3=ambassador
async function pushNotification(notificationId, targetType, targetIds) {
  try {
    const [[notif]] = await pool.query('SELECT * FROM system_notifications WHERE id = ?', [notificationId])
    if (!notif) return

    const { title, content } = notif
    const msgContent = JSON.stringify({ title, content, notificationId })

    // targetType: 0=全部, 1=社区, 2=商家, 3=大使
    if (targetType === 0 || targetType === 1) {
      await pool.query(
        `INSERT INTO message (user_type, user_id, sender_type, sender_id, msg_type, content, create_time)
         SELECT 1, id, 0, 0, 1, ?, NOW() FROM communities WHERE status = 1`,
        [msgContent]
      )
    }
    if (targetType === 0 || targetType === 2) {
      await pool.query(
        `INSERT INTO message (user_type, user_id, sender_type, sender_id, msg_type, content, create_time)
         SELECT 2, id, 0, 0, 1, ?, NOW() FROM merchants WHERE status = 1`,
        [msgContent]
      )
    }
    if (targetType === 0 || targetType === 3) {
      await pool.query(
        `INSERT INTO message (user_type, user_id, sender_type, sender_id, msg_type, content, create_time)
         SELECT 3, id, 0, 0, 1, ?, NOW() FROM ambassadors WHERE status = 1`,
        [msgContent]
      )
    }
  } catch (err) {
    console.error('Push notification error:', err)
  }
}

// ============ 匹配算法配置 ============

exports.getAlgorithmConfig = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT config_value FROM sys_configs WHERE config_key = 'match_algorithm'"
    )

    if (rows.length === 0) {
      return success(res, {
        dimensions: [
          { name: '地域匹配', key: 'region', weight: 25, enabled: true, description: '基于地图定位的距离计算' },
          { name: '类型匹配', key: 'type', weight: 20, enabled: true, description: '需求类型与资源类型对应度' },
          { name: '标签匹配', key: 'tag', weight: 15, enabled: true, description: '双方标签重合度' },
          { name: '社区画像匹配', key: 'community_profile', weight: 15, enabled: true, description: '户数、人群结构、设施等与商家目标客群匹配' },
          { name: '商家画像匹配', key: 'merchant_profile', weight: 10, enabled: true, description: '企业类型、服务范围与社区需求匹配' },
          { name: '语义匹配', key: 'semantic', weight: 10, enabled: true, description: 'NLP提取关键词，语义相似度计算' },
          { name: '信誉评分', key: 'reputation', weight: 5, enabled: true, description: '历史评价、成功率、响应速度' }
        ],
        maxResults: 20,
        matchRadius: 'city'
      })
    }

    success(res, JSON.parse(rows[0].config_value))
  } catch (err) {
    console.error('Get algorithm config error:', err)
    error(res, '获取算法配置失败')
  }
}

exports.saveAlgorithmConfig = async (req, res) => {
  try {
    const config = req.body

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('match_algorithm', ?, 'match', '匹配算法权重配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    )

    success(res, null, '算法配置已保存')
  } catch (err) {
    console.error('Save algorithm config error:', err)
    error(res, '保存算法配置失败')
  }
}

// ====== 防飞单配置 ======
exports.getAntiFlyingConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'anti_flying'")
    if (rows.length > 0) {
      success(res, JSON.parse(rows[0].config_value))
    } else {
      success(res, {
        filterRules: { phone: true, wechat: true, qq: true, email: false, url: false },
        autoWarn: true, autoBan: false
      })
    }
  } catch (err) {
    console.error('Get anti-flying config error:', err)
    error(res, '获取防飞单配置失败')
  }
}

exports.saveAntiFlyingConfig = async (req, res) => {
  try {
    const config = req.body
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('anti_flying', ?, 'anti_flying', '防飞单配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    )
    success(res, null, '防飞单配置已保存')
  } catch (err) {
    console.error('Save anti-flying config error:', err)
    error(res, '保存防飞单配置失败')
  }
}

// ====== 社区位置管理 ======
exports.saveCommunityLocation = async (req, res) => {
  try {
    const { community_id, lat, lng } = req.body
    if (!community_id || lat === null || lng === null) {
      return error(res, '参数不完整', 400)
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return error(res, '经纬度超出有效范围', 400)
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

// ====== 内容审核配置 ======
exports.getAuditConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'audit'")
    if (rows.length > 0) {
      success(res, JSON.parse(rows[0].config_value))
    } else {
      success(res, {
        enabled: false,
        provider: 'simulated',
        sensitiveDetection: true,
        contactDetection: true,
        bannedCategoryDetection: false,
        qualityCheck: false,
        scenes: [
          { key: 'demand', enabled: true, autoPass: false, autoReject: false, threshold: 80 },
          { key: 'resource', enabled: true, autoPass: false, autoReject: false, threshold: 80 },
          { key: 'comment', enabled: false, autoPass: false, autoReject: false, threshold: 60 }
        ]
      })
    }
  } catch (err) {
    console.error('Get audit config error:', err)
    error(res, '获取内容审核配置失败')
  }
}

exports.saveAuditConfig = async (req, res) => {
  try {
    const config = req.body
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('audit', ?, 'audit', '内容审核配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    )
    success(res, null, '内容审核配置已保存')
  } catch (err) {
    console.error('Save audit config error:', err)
    error(res, '保存内容审核配置失败')
  }
}

// ====== 专家类型配置 ======
exports.getExpertTypesConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'expert_types'")
    if (rows.length > 0) {
      try {
        return success(res, JSON.parse(rows[0].config_value))
      } catch {}
    }
    // 默认专家类型
    success(res, [
      { name: '法律咨询', status: 1, sort_order: 1 },
      { name: '医疗健康', status: 1, sort_order: 2 },
      { name: '心理辅导', status: 1, sort_order: 3 },
      { name: '教育培训', status: 1, sort_order: 4 },
      { name: '技能培训', status: 1, sort_order: 5 },
      { name: '金融理财', status: 1, sort_order: 6 },
      { name: '社会工作', status: 1, sort_order: 7 },
      { name: '文艺指导', status: 1, sort_order: 8 },
      { name: '体育健身', status: 1, sort_order: 9 },
      { name: '营养指导', status: 1, sort_order: 10 },
      { name: '其他', status: 1, sort_order: 99 }
    ])
  } catch (err) {
    console.error('Get expert types config error:', err)
    error(res, '获取专家类型配置失败')
  }
}

exports.saveExpertTypesConfig = async (req, res) => {
  try {
    const types = req.body
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('expert_types', ?, 'expert', '专家类型配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(types), JSON.stringify(types)]
    )
    success(res, null, '专家类型配置已保存')
  } catch (err) {
    console.error('Save expert types config error:', err)
    error(res, '保存专家类型配置失败')
  }
}

// ============ 内容列表管理 ============

// 获取需求列表（所有状态）
exports.getDemandList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, type, keyword, period = 'all' } = req.query
    const offset = (page - 1) * pageSize

    let where = '1=1'
    let params = []

    if (type !== undefined && type !== '' && type !== null) {
      where += ' AND d.demand_type = ?'
      params.push(parseInt(type))
    }

    if (status !== undefined && status !== '' && status !== null) {
      where += ' AND d.status = ?'
      params.push(parseInt(status))
    }

    if (keyword) {
      where += ' AND (d.title LIKE ? OR c.community_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    // 时间筛选
    let dateFilter = ''
    if (period === 'day') {
      dateFilter = " AND DATE(d.created_at) = CURDATE()"
    } else if (period === 'month') {
      dateFilter = " AND YEAR(d.created_at) = YEAR(CURDATE()) AND MONTH(d.created_at) = MONTH(CURDATE())"
    } else if (period === 'year') {
      dateFilter = " AND YEAR(d.created_at) = YEAR(CURDATE())"
    }

    const [rows] = await pool.query(
      `SELECT d.*, c.community_name, c.real_name as community_real_name,
       (SELECT COUNT(*) FROM intentions WHERE demand_id = d.id) as intention_count,
       (SELECT COUNT(*) FROM comments WHERE demand_id = d.id AND status = 1) as comment_count
       FROM demands d
       LEFT JOIN communities c ON d.community_id = c.id
       WHERE ${where} ${dateFilter}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM demands d LEFT JOIN communities c ON d.community_id = c.id WHERE ${where} ${dateFilter}`,
      params
    )

    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('Get demand list error:', err)
    error(res, '获取需求列表失败')
  }
}

// 获取资源列表（所有状态）
exports.getResourceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword, period = 'all' } = req.query
    const offset = (page - 1) * pageSize

    let where = '1=1'
    let params = []

    if (status !== undefined && status !== '' && status !== null) {
      where += ' AND r.status = ?'
      params.push(parseInt(status))
    }

    if (keyword) {
      where += ' AND (r.title LIKE ? OR m.company_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    // 时间筛选
    let dateFilter = ''
    if (period === 'day') {
      dateFilter = " AND DATE(r.created_at) = CURDATE()"
    } else if (period === 'month') {
      dateFilter = " AND YEAR(r.created_at) = YEAR(CURDATE()) AND MONTH(r.created_at) = MONTH(CURDATE())"
    } else if (period === 'year') {
      dateFilter = " AND YEAR(r.created_at) = YEAR(CURDATE())"
    }

    const [rows] = await pool.query(
      `SELECT r.*, m.company_name, m.contact_name, m.phone as merchant_phone
       FROM resources r
       LEFT JOIN merchants m ON r.merchant_id = m.id
       WHERE ${where} ${dateFilter}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM resources r LEFT JOIN merchants m ON r.merchant_id = m.id WHERE ${where} ${dateFilter}`,
      params
    )

    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    console.error('Get resource list error:', err)
    error(res, '获取资源列表失败')
  }
}

// ====== 智能客服配置 ======

// 获取客服基本设置
exports.getServiceConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_config'")
    if (rows.length > 0) {
      success(res, JSON.parse(rows[0].config_value))
    } else {
      success(res, {
        name: '邻盟智能客服',
        welcome: '您好！我是邻盟智能客服助手 👋\n请问有什么可以帮您？',
        workTime: '周一至周五 9:00-18:00',
        hotline: '400-888-8888',
        email: '12494789@qq.com',
        unknownReply: '抱歉，我暂时无法理解您的问题。您可以：\n1. 拨打客服热线：400-888-8888\n2. 发送邮件至：12494789@qq.com'
      })
    }
  } catch (err) {
    console.error('Get service config error:', err)
    error(res, '获取客服配置失败')
  }
}

// 保存客服基本设置
exports.saveServiceConfig = async (req, res) => {
  try {
    const config = req.body
    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_config', ?, 'service', '智能客服配置') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    )
    success(res, null, '客服配置已保存')
  } catch (err) {
    console.error('Save service config error:', err)
    error(res, '保存客服配置失败')
  }
}

// 获取FAQ列表
exports.getFaqList = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
    if (rows.length > 0) {
      const faqs = JSON.parse(rows[0].config_value)
      // 转换为ID->FAQ映射，方便快捷问题关联
      const faqMap = {}
      if (Array.isArray(faqs)) {
        faqs.forEach(f => { faqMap[f.id] = f })
      }
      success(res, faqs)
    } else {
      success(res, [])
    }
  } catch (err) {
    console.error('Get FAQ list error:', err)
    error(res, '获取FAQ列表失败')
  }
}

// 创建FAQ
exports.createFaq = async (req, res) => {
  try {
    const { question, answer, keywords } = req.body
    if (!question || !answer) return error(res, '问题和回答不能为空', 400)

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
    let faqs = []
    if (rows.length > 0 && rows[0].config_value) {
      try { 
        const parsed = JSON.parse(rows[0].config_value)
        if (Array.isArray(parsed)) {
          faqs = parsed
        }
      } catch {}
    }

    const newFaq = {
      id: Date.now(),
      question,
      answer,
      keywords: keywords || '',
      hits: 0,
      enabled: true
    }
    faqs.push(newFaq)

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_faqs', ?, 'service', '智能客服FAQ') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(faqs), JSON.stringify(faqs)]
    )

    success(res, newFaq, 'FAQ已添加')
  } catch (err) {
    console.error('Create FAQ error:', err)
    error(res, '添加FAQ失败')
  }
}

// 更新FAQ
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params
    const { question, answer, keywords } = req.body

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
    if (rows.length === 0) return error(res, 'FAQ不存在', 404)

    let faqs = []
    try { 
      const parsed = JSON.parse(rows[0].config_value)
      if (Array.isArray(parsed)) {
        faqs = parsed
      }
    } catch {}

    const idx = faqs.findIndex(f => f.id == id)
    if (idx === -1) return error(res, 'FAQ不存在', 404)

    if (question) faqs[idx].question = question
    if (answer) faqs[idx].answer = answer
    if (keywords !== undefined) faqs[idx].keywords = keywords

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_faqs', ?, 'service', '智能客服FAQ') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(faqs), JSON.stringify(faqs)]
    )

    success(res, null, 'FAQ已更新')
  } catch (err) {
    console.error('Update FAQ error:', err)
    error(res, '更新FAQ失败')
  }
}

// 删除FAQ
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
    if (rows.length === 0) return error(res, 'FAQ不存在', 404)

    let faqs = []
    try { 
      const parsed = JSON.parse(rows[0].config_value)
      if (Array.isArray(parsed)) {
        faqs = parsed
      }
    } catch {}

    const idx = faqs.findIndex(f => f.id == id)
    if (idx === -1) return error(res, 'FAQ不存在', 404)

    faqs.splice(idx, 1)

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_faqs', ?, 'service', '智能客服FAQ') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(faqs), JSON.stringify(faqs)]
    )

    success(res, null, 'FAQ已删除')
  } catch (err) {
    console.error('Delete FAQ error:', err)
    error(res, '删除FAQ失败')
  }
}

// 快捷问题分类配置
const QUICK_QUESTION_CATEGORIES = [
  { key: 'platform', label: '平台服务', sort: 1 },
  { key: 'member', label: '会员相关', sort: 2 },
  { key: 'cooperation', label: '合作问题', sort: 3 },
  { key: 'common', label: '常见问题', sort: 4 }
]

// 默认分类快捷问题
const DEFAULT_CATEGORIZED_QUESTIONS = [
  { 
    category: 'platform', 
    questions: [
      { id: 1, text: '平台是什么？', sort: 1, enabled: true },
      { id: 2, text: '如何发布需求？', sort: 2, enabled: true },
      { id: 3, text: '如何发布资源？', sort: 3, enabled: true },
      { id: 4, text: '撮合奖励是什么？', sort: 4, enabled: true }
    ]
  },
  { 
    category: 'member', 
    questions: [
      { id: 5, text: '如何成为金牌会员？', sort: 1, enabled: true },
      { id: 6, text: '会员权益有哪些？', sort: 2, enabled: true },
      { id: 7, text: '如何升级会员？', sort: 3, enabled: true },
      { id: 8, text: '会员到期怎么办？', sort: 4, enabled: true }
    ]
  },
  { 
    category: 'cooperation', 
    questions: [
      { id: 9, text: '如何联系商家/社区？', sort: 1, enabled: true },
      { id: 10, text: '撮合成功的标准？', sort: 2, enabled: true },
      { id: 11, text: '招商大使是什么？', sort: 3, enabled: true },
      { id: 12, text: '如何成为大使？', sort: 4, enabled: true }
    ]
  },
  { 
    category: 'common', 
    questions: [
      { id: 13, text: '忘记密码怎么办？', sort: 1, enabled: true },
      { id: 14, text: '如何修改个人信息？', sort: 2, enabled: true },
      { id: 15, text: '如何取消会员？', sort: 3, enabled: true },
      { id: 16, text: '联系方式是多少？', sort: 4, enabled: true }
    ]
  }
]

// 获取快捷问题列表（带分类和FAQ回答）
exports.getQuickQuestions = async (req, res) => {
  try {
    // 先获取FAQ列表用于匹配
    const [faqRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
    let faqMap = {}
    if (faqRows.length > 0 && faqRows[0].config_value) {
      try {
        const faqs = JSON.parse(faqRows[0].config_value)
        if (Array.isArray(faqs)) {
          faqs.forEach(f => { faqMap[f.id] = f })
        }
      } catch {}
    }
    
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    
    if (rows.length > 0 && rows[0].config_value) {
      try {
        const parsed = JSON.parse(rows[0].config_value)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 为每个快捷问题匹配FAQ回答
          const processedQuestions = parsed.map(cat => ({
            ...cat,
            questions: cat.questions.map(q => ({
              ...q,
              // 如果快捷问题关联了FAQ，附带回答
              answer: q.faq_id && faqMap[q.faq_id] ? faqMap[q.faq_id].answer : (q.answer || '')
            }))
          }))
          return success(res, {
            categories: QUICK_QUESTION_CATEGORIES,
            questions: processedQuestions,
            faqs: faqMap  // 同时返回FAQ映射，供前端使用
          })
        }
      } catch (e) {
        console.error('Parse quick questions error:', e)
      }
    }
    
    // 返回默认分类快捷问题
    success(res, {
      categories: QUICK_QUESTION_CATEGORIES,
      questions: DEFAULT_CATEGORIZED_QUESTIONS,
      faqs: faqMap
    })
  } catch (err) {
    console.error('Get quick questions error:', err)
    error(res, '获取快捷问题失败')
  }
}

// 创建快捷问题（支持分类和FAQ关联）
exports.createQuickQuestion = async (req, res) => {
  try {
    const { text, sort = 1, category = 'common', enabled = true, faq_id, answer = '' } = req.body
    if (!text) return error(res, '问题文本不能为空', 400)

    // 如果指定了faq_id，获取对应的回答
    let finalAnswer = answer
    if (faq_id && !answer) {
      const [faqRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
      if (faqRows.length > 0 && faqRows[0].config_value) {
        try {
          const faqs = JSON.parse(faqRows[0].config_value)
          const faq = faqs.find(f => f.id == faq_id)
          if (faq) finalAnswer = faq.answer
        } catch {}
      }
    }

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    let questions = DEFAULT_CATEGORIZED_QUESTIONS
    
    if (rows.length > 0 && rows[0].config_value) {
      try { 
        const parsed = JSON.parse(rows[0].config_value)
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed
        }
      } catch (e) {
        console.error('Parse quick questions error:', e)
      }
    }

    // 找到对应分类
    let categoryObj = questions.find(c => c.category === category)
    if (!categoryObj) {
      // 如果分类不存在，创建新的
      categoryObj = { category, questions: [] }
      questions.push(categoryObj)
    }

    const newQuestion = {
      id: Date.now(),
      text,
      sort,
      enabled,
      faq_id: faq_id || null,
      answer: finalAnswer
    }
    categoryObj.questions.push(newQuestion)
    
    // 按排序重新排列
    questions.forEach(cat => {
      cat.questions.sort((a, b) => a.sort - b.sort)
    })

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_quick_questions', ?, 'service', '智能客服快捷问题') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(questions), JSON.stringify(questions)]
    )

    success(res, newQuestion, '快捷问题已添加')
  } catch (err) {
    console.error('Create quick question error:', err)
    error(res, '添加快捷问题失败')
  }
}

// 更新快捷问题（支持分类和FAQ关联）
exports.updateQuickQuestion = async (req, res) => {
  try {
    const { id } = req.params
    const { text, sort, enabled, category, faq_id, answer } = req.body

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    if (rows.length === 0) return error(res, '快捷问题不存在', 404)

    let questions = []
    try { 
      const parsed = JSON.parse(rows[0].config_value)
      if (Array.isArray(parsed)) {
        questions = parsed
      }
    } catch {}

    // 在所有分类中查找问题
    let foundQuestion = null
    let foundCategoryIdx = -1
    let foundQuestionIdx = -1
    
    for (let i = 0; i < questions.length; i++) {
      const idx = questions[i].questions?.findIndex(q => q.id == id)
      if (idx !== undefined && idx !== -1) {
        foundQuestion = questions[i].questions[idx]
        foundCategoryIdx = i
        foundQuestionIdx = idx
        break
      }
    }
    
    if (!foundQuestion) return error(res, '快捷问题不存在', 404)

    // 处理FAQ关联
    if (faq_id !== undefined) {
      foundQuestion.faq_id = faq_id || null
      // 如果指定了faq_id且没有自定义回答，从FAQ获取
      if (faq_id && (answer === undefined || answer === '')) {
        const [faqRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_faqs'")
        if (faqRows.length > 0 && faqRows[0].config_value) {
          try {
            const faqs = JSON.parse(faqRows[0].config_value)
            const faq = faqs.find(f => f.id == faq_id)
            if (faq) foundQuestion.answer = faq.answer
          } catch {}
        }
      }
    }
    
    // 处理自定义回答
    if (answer !== undefined) {
      foundQuestion.answer = answer
    }
    
    if (text) foundQuestion.text = text
    if (sort !== undefined) foundQuestion.sort = sort
    if (enabled !== undefined) foundQuestion.enabled = enabled

    // 如果更换了分类
    if (category && category !== questions[foundCategoryIdx].category) {
      // 从原分类移除
      questions[foundCategoryIdx].questions.splice(foundQuestionIdx, 1)
      
      // 添加到新分类
      let targetCategory = questions.find(c => c.category === category)
      if (!targetCategory) {
        targetCategory = { category, questions: [] }
        questions.push(targetCategory)
      }
      targetCategory.questions.push(foundQuestion)
    }

    // 按排序重新排列
    questions.forEach(cat => {
      cat.questions.sort((a, b) => a.sort - b.sort)
    })

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_quick_questions', ?, 'service', '智能客服快捷问题') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(questions), JSON.stringify(questions)]
    )

    success(res, null, '快捷问题已更新')
  } catch (err) {
    console.error('Update quick question error:', err)
    error(res, '更新快捷问题失败')
  }
}

// 删除快捷问题（支持分类）
exports.deleteQuickQuestion = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    if (rows.length === 0) return error(res, '快捷问题不存在', 404)

    let questions = []
    try { 
      const parsed = JSON.parse(rows[0].config_value)
      if (Array.isArray(parsed)) {
        questions = parsed
      }
    } catch {}

    // 在所有分类中查找并删除问题
    let found = false
    for (let i = 0; i < questions.length; i++) {
      const idx = questions[i].questions?.findIndex(q => q.id == id)
      if (idx !== undefined && idx !== -1) {
        questions[i].questions.splice(idx, 1)
        // 如果分类为空，删除整个分类
        if (questions[i].questions.length === 0) {
          questions.splice(i, 1)
        }
        found = true
        break
      }
    }
    
    if (!found) return error(res, '快捷问题不存在', 404)

    await pool.query(
      "INSERT INTO sys_configs (config_key, config_value, config_type, description) VALUES ('service_quick_questions', ?, 'service', '智能客服快捷问题') ON DUPLICATE KEY UPDATE config_value = ?",
      [JSON.stringify(questions), JSON.stringify(questions)]
    )

    success(res, null, '快捷问题已删除')
  } catch (err) {
    console.error('Delete quick question error:', err)
    error(res, '删除快捷问题失败')
  }
}

// ==================== 社区画像 ====================

// 八维评分说明
const RADAR_DIMS = [
  { key: 'scale',       label: '社区规模',     icon: '🏢', unit: '户',  maxRaw: 2000,  desc: '基于小区户数评估' },
  { key: 'family',      label: '家庭结构',     icon: '👨‍👩‍👧', unit: '%',   maxRaw: 100,   desc: '亲子+老年群体占比' },
  { key: 'facility',    label: '配套设施',     icon: '🏗',  unit: '项',  maxRaw: 4,     desc: '广场/商业/学校/公园' },
  { key: 'space',       label: '公共空间',     icon: '🏟',  unit: 'm²', maxRaw: 10000, desc: '公共活动空间面积' },
  { key: 'activity',    label: '活跃程度',     icon: '📊',  unit: '分',  maxRaw: 100,   desc: '发布需求数与预算规模' },
  { key: 'matching',    label: '撮合能力',     icon: '🤝',  unit: '次',  maxRaw: 20,    desc: '撮合成功意向数' },
  { key: 'merchant',    label: '商业资源',     icon: '🏪', unit: '家',  maxRaw: 50,    desc: '周边商户/商家数量' },
  { key: 'exposure',    label: '平台曝光',     icon: '👁',  unit: '次',  maxRaw: 2000,  desc: '总浏览量' },
]

// 计算某维度的标准化分数（0-100）
function dimScore(raw, maxRaw) {
  if (!raw || raw < 0) return 0
  const s = Math.min(100, Math.round((raw / maxRaw) * 100))
  return s
}

// 获取社区画像
exports.getCommunityProfile = async (req, res) => {
  try {
    const { id } = req.params

    // 1. 读取社区基本信息（包含所有32个字段）
    const [commRows] = await pool.query(
      `SELECT id, username, password, real_name, phone, district, street, community, community_name,
              position, households, family_ratio, elderly_ratio, public_space_area, merchant_count,
              has_outdoor_plaza, has_commercial, has_school, has_park,
              logo, images, description, lat, lng, address, proof_images, tags,
              status, reject_reason, last_login_at, created_at, updated_at
       FROM communities WHERE id = ?`,
      [id]
    )

    if (commRows.length === 0) {
      return error(res, '社区不存在', 404)
    }

    const c = commRows[0]

    // 1.1 读取小区信息
    const [compoundsRows] = await pool.query(
      `SELECT id, name, households FROM community_compounds WHERE community_id = ? ORDER BY id`,
      [id]
    )

    // 1.2 读取场地空间信息
    const [spacesRows] = await pool.query(
      `SELECT id, name, location_type, floor_number, area, capacity,
              facilities, custom_facilities, available_hours, images
       FROM community_spaces WHERE community_id = ? ORDER BY id`,
      [id]
    )

    // 2. 读取该社区的需求统计
    const [demandStats] = await pool.query(
      `SELECT COUNT(*) as total, SUM(view_count) as views,
              SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as published,
              SUM(budget_max) as total_budget
       FROM demands WHERE community_id = ?`,
      [id]
    )
    const ds = demandStats[0] || {}

    // 3. 读取该社区的撮合统计（意向表 intentions 中 community_id 关联）
    const [matchStats] = await pool.query(
      `SELECT COUNT(*) as total_intentions,
              SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as success_matches
       FROM intentions WHERE community_id = ?`,
      [id]
    )
    const ms = matchStats[0] || {}

    // 4. 计算六维分数
    const facilityCount = [
      c.has_outdoor_plaza, c.has_commercial,
      c.has_school, c.has_park
    ].filter(Boolean).length

    // 活跃度：发布需求数（权重60%）+ 预算总额标准化（权重40%）
    const actByDemands = Math.min(100, ds.total * 15)
    const actByBudget = Math.min(100, (ds.total_budget || 0) / 500)
    const activityScore = Math.round(actByDemands * 0.6 + actByBudget * 0.4)

    const scores = {
      scale:    dimScore(c.households || 0,             RADAR_DIMS[0].maxRaw),
      family:   dimScore(
                  (parseFloat(c.family_ratio) || 0) +
                  (parseFloat(c.elderly_ratio) || 0), RADAR_DIMS[1].maxRaw),
      facility: dimScore(facilityCount,                 RADAR_DIMS[2].maxRaw),
      space:    dimScore(parseFloat(c.public_space_area) || 0, RADAR_DIMS[3].maxRaw),
      activity: activityScore,
      matching: dimScore(ms.success_matches || 0,     RADAR_DIMS[5].maxRaw),
      merchant: dimScore(c.merchant_count || 0,        RADAR_DIMS[6].maxRaw),
      exposure: dimScore(ds.views || 0,                 RADAR_DIMS[7].maxRaw),
    }

    // 5. 各维度的原始数据（用于展示详情）
    const raw = {
      households: c.households || 0,
      familyRatio: parseFloat(c.family_ratio) || 0,
      elderlyRatio: parseFloat(c.elderly_ratio) || 0,
      facilityCount,
      publicSpaceArea: parseFloat(c.public_space_area) || 0,
      totalDemands: ds.total || 0,
      publishedDemands: ds.published || 0,
      totalBudget: parseFloat(ds.total_budget) || 0,
      totalIntentions: ms.total_intentions || 0,
      successMatches: ms.success_matches || 0,
      merchantCount: c.merchant_count || 0,
      totalViews: ds.views || 0,
    }

    // 6. 计算综合评分（平均分）
    const scoreValues = Object.values(scores)
    const overall = Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)

    // 处理场地空间数据（字段可能是数组或JSON字符串）
    const spaces = spacesRows.map(s => ({
      ...s,
      location_type: s.location_type,
      facilities: Array.isArray(s.facilities) ? s.facilities : (s.facilities ? JSON.parse(s.facilities) : []),
      images: Array.isArray(s.images) ? s.images : (s.images ? JSON.parse(s.images) : []),
    }))

    // 处理小区数据
    const compounds = compoundsRows

    // 处理社区基础信息中的 tags（可能是数组或JSON字符串）
    let tags = []
    if (c.tags) {
      if (Array.isArray(c.tags)) {
        tags = c.tags
      } else {
        try {
          tags = JSON.parse(c.tags)
        } catch {
          tags = c.tags.split(',').filter(Boolean)
        }
      }
    }

    // 处理社区图片（可能是数组或JSON字符串）
    let images = []
    if (c.images) {
      if (Array.isArray(c.images)) {
        images = c.images
      } else {
        try {
          images = JSON.parse(c.images)
        } catch {
          images = c.images.split(',').filter(Boolean)
        }
      }
    }

    // 处理证明材料图片（可能是数组或JSON字符串）
    let proofImages = []
    if (c.proof_images) {
      if (Array.isArray(c.proof_images)) {
        proofImages = c.proof_images
      } else {
        try {
          proofImages = JSON.parse(c.proof_images)
        } catch {
          proofImages = []
        }
      }
    }

    success(res, {
      community: {
        id: c.id,
        username: c.username,
        realName: c.real_name,
        name: c.community || c.real_name,
        communityName: c.community,
        district: c.district,
        street: c.street,
        position: c.position,
        logo: c.logo,
        images: images,
        description: c.description,
        tags: tags,
        phone: c.phone,
        address: c.address,
        lat: c.lat,
        lng: c.lng,
        households: c.households,
        familyRatio: parseFloat(c.family_ratio) || 0,
        elderlyRatio: parseFloat(c.elderly_ratio) || 0,
        publicSpaceArea: parseFloat(c.public_space_area) || 0,
        merchantCount: c.merchant_count || 0,
        hasOutdoorPlaza: c.has_outdoor_plaza,
        hasCommercial: c.has_commercial,
        hasSchool: c.has_school,
        hasPark: c.has_park,
        status: c.status,
        rejectReason: c.reject_reason,
        proofImages: proofImages,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        lastLoginAt: c.last_login_at,
      },
      compounds: compounds,
      spaces: spaces,
      dims: RADAR_DIMS,
      scores,
      raw,
      overall,
    })
  } catch (err) {
    console.error('getCommunityProfile error:', err)
    error(res, '获取社区画像失败')
  }
}

// 获取所有社区的评分概览（列表页用）
exports.getCommunityScores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.real_name,
        c.community,
        c.district,
        c.street,
        c.households,
        c.family_ratio,
        c.elderly_ratio,
        c.public_space_area,
        c.merchant_count,
        c.has_outdoor_plaza,
        c.has_commercial,
        c.has_school,
        c.has_park,
        COUNT(DISTINCT d.id) AS demand_count,
        COALESCE(SUM(d.view_count), 0) AS total_views,
        COALESCE(SUM(d.budget_max), 0) AS total_budget,
        COUNT(DISTINCT CASE WHEN i.status = 3 THEN i.id END) AS success_matches
      FROM communities c
      LEFT JOIN demands d ON d.community_id = c.id
      LEFT JOIN intentions i ON i.community_id = c.id
      WHERE c.status = 1
      GROUP BY c.id
      ORDER BY c.id
    `)

    const result = rows.map(c => {
      const fc = [c.has_outdoor_plaza, c.has_commercial, c.has_school, c.has_park].filter(Boolean).length
      const actByDemands = Math.min(100, c.demand_count * 15)
      const actByBudget = Math.min(100, c.total_budget / 500)
      const activityScore = Math.round(actByDemands * 0.6 + actByBudget * 0.4)
      const scores = {
        scale:    dimScore(c.households || 0, RADAR_DIMS[0].maxRaw),
        family:   dimScore((parseFloat(c.family_ratio) || 0) + (parseFloat(c.elderly_ratio) || 0), RADAR_DIMS[1].maxRaw),
        facility: dimScore(fc, RADAR_DIMS[2].maxRaw),
        space:    dimScore(parseFloat(c.public_space_area) || 0, RADAR_DIMS[3].maxRaw),
        activity: activityScore,
        matching: dimScore(c.success_matches || 0, RADAR_DIMS[5].maxRaw),
        merchant: dimScore(c.merchant_count || 0, RADAR_DIMS[6].maxRaw),
        exposure: dimScore(c.total_views || 0, RADAR_DIMS[7].maxRaw),
      }
      const vals = Object.values(scores)
      const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      return {
        id: c.id,
        realName: c.real_name,
        communityName: c.community || c.community_name || c.real_name,
        district: c.district,
        street: c.street,
        scores,
        overall,
      }
    })

    success(res, result)
  } catch (err) {
    console.error('getCommunityScores error:', err)
    error(res, '获取社区评分概览失败')
  }
}

