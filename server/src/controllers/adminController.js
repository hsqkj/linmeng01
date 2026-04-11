/**
 * 管理员控制器
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')
const jwtConfig = require('../config/jwt')
const { success, pageSuccess, error } = require('../utils/response')

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

    // 总浏览量（需求+资源的浏览量总和，status=1的记录）
    const [[demandViews]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM demands WHERE status = 1')
    const [[resourceViews]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM resources WHERE status = 1')

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
        totalViews: demandViews.total + resourceViews.total,
        comments: commentsCount
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
    
    success(res, {
      ...community,
      demands,
      intentions
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
    const { page = 1, pageSize = 10, status, level, keyword, industry } = req.query
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

    if (keyword) {
      where += ' AND (company_name LIKE ? OR contact_name LIKE ? OR phone LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const [rows] = await pool.query(
      `SELECT id, username, company_name, contact_name, phone, industry, member_level, star_rating, status, company_type, created_at
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
    const { page = 1, pageSize = 10, type, keyword, status } = req.query
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

    const [rows] = await pool.query(
      `SELECT c.*,
       m.company_name as merchant_name,
       com.community_name as community_name
       FROM comments c
       LEFT JOIN merchants m ON c.user_type = 2 AND c.user_id = m.id
       LEFT JOIN communities com ON c.user_type = 1 AND c.user_id = com.id
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(pageSize), offset]
    )

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM comments c WHERE ${where}`,
      queryParams
    )
    
    pageSuccess(res, rows, total, page, pageSize)
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

exports.getBasicTypesConfig = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'")
    const [expertRows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'expert_types'")
    const defaultIndustries = [
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
    if (rows.length === 0) {
      return success(res, {
        activityTypes: [], enterpriseTypes: [], resourceTypes: [], expertTypes: [],
        industryTypes: [], communityTypes: [], residentTypes: []
      })
    }
    const data = JSON.parse(rows[0].config_value)
    // 兼容旧数据：补充空数组
    if (!data.industryTypes || data.industryTypes.length === 0) {
      data.industryTypes = []
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
    // 如果没有获取到专家类型，使用默认5种
    if (!data.expertTypes || data.expertTypes.length === 0) {
      data.expertTypes = defaultExpertTypes
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

exports.getTags = async (req, res) => {
  try {
    const { type } = req.query
    let where = '1=1'
    const params = []
    
    if (type) {
      where += ' AND type = ?'
      params.push(type)
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
    await pool.query('INSERT INTO tags (name, type, category) VALUES (?, ?, ?)', [name, type, category])
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
    const { page = 1, pageSize = 10, status, keyword, period = 'all' } = req.query
    const offset = (page - 1) * pageSize

    let where = '1=1'
    let params = []

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
      `SELECT d.*, c.community_name, c.real_name as community_real_name
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
      success(res, JSON.parse(rows[0].config_value))
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
    if (rows.length > 0) {
      try { faqs = JSON.parse(rows[0].config_value) } catch {}
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
    try { faqs = JSON.parse(rows[0].config_value) } catch {}

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
    try { faqs = JSON.parse(rows[0].config_value) } catch {}

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

// 获取快捷问题列表
exports.getQuickQuestions = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    if (rows.length > 0) {
      success(res, JSON.parse(rows[0].config_value))
    } else {
      success(res, [
        { id: 1, text: '如何发布资源？', sort: 1, enabled: true },
        { id: 2, text: '会员等级有什么区别？', sort: 2, enabled: true },
        { id: 3, text: '如何联系商家？', sort: 3, enabled: true },
        { id: 4, text: '撮合奖励是什么？', sort: 4, enabled: true }
      ])
    }
  } catch (err) {
    console.error('Get quick questions error:', err)
    error(res, '获取快捷问题失败')
  }
}

// 创建快捷问题
exports.createQuickQuestion = async (req, res) => {
  try {
    const { text, sort = 1 } = req.body
    if (!text) return error(res, '问题文本不能为空', 400)

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    let questions = []
    if (rows.length > 0) {
      try { questions = JSON.parse(rows[0].config_value) } catch {}
    }

    const newQuestion = {
      id: Date.now(),
      text,
      sort,
      enabled: true
    }
    questions.push(newQuestion)
    questions.sort((a, b) => a.sort - b.sort)

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

// 更新快捷问题
exports.updateQuickQuestion = async (req, res) => {
  try {
    const { id } = req.params
    const { text, sort, enabled } = req.body

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    if (rows.length === 0) return error(res, '快捷问题不存在', 404)

    let questions = []
    try { questions = JSON.parse(rows[0].config_value) } catch {}

    const idx = questions.findIndex(q => q.id == id)
    if (idx === -1) return error(res, '快捷问题不存在', 404)

    if (text) questions[idx].text = text
    if (sort !== undefined) questions[idx].sort = sort
    if (enabled !== undefined) questions[idx].enabled = enabled
    questions.sort((a, b) => a.sort - b.sort)

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

// 删除快捷问题
exports.deleteQuickQuestion = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'service_quick_questions'")
    if (rows.length === 0) return error(res, '快捷问题不存在', 404)

    let questions = []
    try { questions = JSON.parse(rows[0].config_value) } catch {}

    const idx = questions.findIndex(q => q.id == id)
    if (idx === -1) return error(res, '快捷问题不存在', 404)

    questions.splice(idx, 1)

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

