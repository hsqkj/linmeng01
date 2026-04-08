/**
 * 招商大使控制器
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')
const jwtConfig = require('../config/jwt')
const { success, pageSuccess, error } = require('../utils/response')

// 登录
exports.login = async (req, res) => {
  try {
    const { phone, password, code } = req.body
    
    if (!phone) return error(res, '请输入手机号', 400)
    
    const [rows] = await pool.query('SELECT * FROM ambassadors WHERE phone = ?', [phone])
    
    if (rows.length === 0) {
      return error(res, '账号不存在，请先申请成为招商大使', 401)
    }
    
    const ambassador = rows[0]
    
    if (ambassador.status === 0) {
      return error(res, '账号审核中，请等待', 403)
    }
    if (ambassador.status === 2) {
      return error(res, '账号已被禁用', 403)
    }
    
    // 验证码登录（测试版）
    if (code !== undefined) {
      const validCodes = ['123456', '888888']
      if (!validCodes.includes(code)) {
        return error(res, '验证码错误', 401)
      }
    } else if (password) {
      const isMatch = await bcrypt.compare(password, ambassador.password)
      if (!isMatch) {
        return error(res, '手机号或密码错误', 401)
      }
    } else {
      return error(res, '请输入验证码', 400)
    }
    
    const token = jwt.sign({
      id: ambassador.id,
      phone: ambassador.phone,
      role: 'ambassador'
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn })
    
    await pool.query('UPDATE ambassadors SET last_login_at = NOW() WHERE id = ?', [ambassador.id])
    
    delete ambassador.password
    success(res, { token, ambassador })
  } catch (err) {
    console.error('Ambassador login error:', err)
    error(res, '登录失败')
  }
}

// 首页数据
exports.getHomeData = async (req, res) => {
  try {
    const id = req.ambassador.id
    
    const [[ambassador]] = await pool.query(
      'SELECT * FROM ambassadors WHERE id = ?',
      [id]
    )
    
    // 发展商家列表
    const [merchants] = await pool.query(
      'SELECT id, company_name, member_level, status, created_at FROM merchants WHERE ambassador_id = ? ORDER BY created_at DESC LIMIT 10',
      [id]
    )
    
    // 本月提成
    const [[{ monthCommission }]] = await pool.query(
      `SELECT COALESCE(SUM(commission_amount), 0) as monthCommission 
       FROM commission_records 
       WHERE ambassador_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      [id]
    )
    
    success(res, {
      ...ambassador,
      monthCommission,
      recentMerchants: merchants
    })
  } catch (err) {
    error(res, '获取数据失败')
  }
}

// 获取渠道码（自动生成唯一渠道码）
exports.getQrCode = async (req, res) => {
  try {
    // 检查大使是否有渠道码，没有则自动生成
    const [rows] = await pool.query(
      'SELECT id, username, real_name, qr_code FROM ambassadors WHERE id = ?',
      [req.ambassador.id]
    )
    
    if (!rows.length) {
      return error(res, '大使信息不存在')
    }
    
    const ambassador = rows[0]
    
    // 如果没有渠道码，自动生成一个
    if (!ambassador.qr_code) {
      // 生成唯一渠道码：AMB + 时间戳 + 随机4位
      const qrCode = 'AMB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
      await pool.query(
        'UPDATE ambassadors SET qr_code = ? WHERE id = ?',
        [qrCode, req.ambassador.id]
      )
      ambassador.qr_code = qrCode
    }
    
    // 返回大使信息和专属链接
    const baseUrl = process.env.APP_URL || 'http://localhost:5173'
    const registerUrl = `${baseUrl}/#/register?code=${ambassador.qr_code}`
    
    success(res, {
      qr_code: ambassador.qr_code,
      register_url: registerUrl,
      ambassador_name: ambassador.real_name || ambassador.username
    })
  } catch (err) {
    console.error('Get QR code error:', err)
    error(res, '获取渠道码失败')
  }
}

// 发展记录
exports.getRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize
    
    const [rows] = await pool.query(
      `SELECT m.id, m.company_name, m.contact_name, m.phone, m.member_level, m.status, m.created_at,
       p.amount as payment_amount, p.created_at as payment_date
       FROM merchants m
       LEFT JOIN member_payments p ON m.id = p.merchant_id AND p.status = 1
       WHERE m.ambassador_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.ambassador.id, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM merchants WHERE ambassador_id = ?',
      [req.ambassador.id]
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取发展记录失败')
  }
}

// 提成明细
exports.getCommission = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize
    
    const [rows] = await pool.query(
      `SELECT cr.*, m.company_name
       FROM commission_records cr
       JOIN merchants m ON cr.merchant_id = m.id
       WHERE cr.ambassador_id = ?
       ORDER BY cr.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.ambassador.id, parseInt(pageSize), offset]
    )
    
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM commission_records WHERE ambassador_id = ?',
      [req.ambassador.id]
    )
    
    pageSuccess(res, rows, total, page, pageSize)
  } catch (err) {
    error(res, '获取提成明细失败')
  }
}

// 提成汇总
exports.getCommissionSummary = async (req, res) => {
  try {
    const [[ambassador]] = await pool.query(
      'SELECT total_merchants, total_commission, pending_commission, withdraw_amount FROM ambassadors WHERE id = ?',
      [req.ambassador.id]
    )
    
    const [[monthCommission]] = await pool.query(
      `SELECT COALESCE(SUM(commission_amount), 0) as amount
       FROM commission_records
       WHERE ambassador_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      [req.ambassador.id]
    )
    
    const [[monthCount]] = await pool.query(
      `SELECT COUNT(*) as count
       FROM commission_records
       WHERE ambassador_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      [req.ambassador.id]
    )
    
    success(res, {
      ...ambassador,
      monthCommission: monthCommission.amount,
      monthCount: monthCount.count,
      available: ambassador.total_commission - ambassador.withdraw_amount
    })
  } catch (err) {
    error(res, '获取提成汇总失败')
  }
}

// 获取提现账户
exports.getWithdrawAccount = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, account_type, account_name, account_number FROM ambassadors WHERE id = ?',
      [req.ambassador.id]
    )
    success(res, rows[0])
  } catch (err) {
    error(res, '获取提现账户失败')
  }
}

// 设置提现账户
exports.setWithdrawAccount = async (req, res) => {
  try {
    const { account_type, account_name, account_number } = req.body
    
    await pool.query(
      'UPDATE ambassadors SET account_type = ?, account_name = ?, account_number = ? WHERE id = ?',
      [account_type, account_name, account_number, req.ambassador.id]
    )
    
    success(res, null, '设置成功')
  } catch (err) {
    error(res, '设置失败')
  }
}

// 申请提现
exports.applyWithdraw = async (req, res) => {
  try {
    const { amount } = req.body
    
    // 检查账户信息
    const [[ambassador]] = await pool.query(
      'SELECT * FROM ambassadors WHERE id = ?',
      [req.ambassador.id]
    )
    
    if (!ambassador.account_type || !ambassador.account_number) {
      return error(res, '请先设置提现账户', 400)
    }
    
    const available = ambassador.total_commission - ambassador.withdraw_amount
    if (amount > available) {
      return error(res, '可提现余额不足', 400)
    }
    
    if (amount < 100) {
      return error(res, '最低提现金额为100元', 400)
    }
    
    // 更新提现金额
    await pool.query(
      'UPDATE ambassadors SET withdraw_amount = withdraw_amount + ? WHERE id = ?',
      [amount, req.ambassador.id]
    )
    
    // 创建提现记录
    await pool.query(
      `INSERT INTO withdraw_records (ambassador_id, amount, account_type, account_name, account_number, status)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [req.ambassador.id, amount, ambassador.account_type, ambassador.account_name, ambassador.account_number]
    )
    
    success(res, null, '提现申请已提交')
  } catch (err) {
    console.error('Apply withdraw error:', err)
    error(res, '申请失败')
  }
}

// 提现记录
exports.getWithdrawHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM withdraw_records WHERE ambassador_id = ? ORDER BY created_at DESC',
      [req.ambassador.id]
    )
    success(res, rows)
  } catch (err) {
    error(res, '获取提现记录失败')
  }
}

// 获取提成政策配置
exports.getCommissionConfig = async (req, res) => {
  try {
    const [[row]] = await pool.query(
      "SELECT config_value FROM sys_configs WHERE config_key = 'ambassador_commission'"
    )
    if (row && row.config_value) {
      const config = typeof row.config_value === 'string' ? JSON.parse(row.config_value) : row.config_value
      success(res, config)
    } else {
      // 返回默认配置
      success(res, {
        firstRate: 20,
        renewRate: 10,
        minWithdraw: 100,
        settlePeriod: 'monthly',
        arrivalDays: '3',
        remark: '招商大使提成政策：成功邀请商家入驻并完成付费后，首次入会按年费的20%结算提成；商家每年续费后，按续费金额的10%追加提成。提成每月1日统一结算，最低提现100元，3个工作日内到账。',
        level_commissions: [
          { level: 1, name: '普通会员', fee: 0, firstRate: 0, renewRate: 0 },
          { level: 2, name: '银牌会员', fee: 999, firstRate: 20, renewRate: 10 },
          { level: 3, name: '金牌会员', fee: 2999, firstRate: 20, renewRate: 10 },
          { level: 4, name: '铂金会员', fee: 5999, firstRate: 20, renewRate: 10 },
          { level: 5, name: '钻石会员', fee: 12000, firstRate: 20, renewRate: 10 }
        ]
      })
    }
  } catch (err) {
    console.error('Get commission config error:', err)
    error(res, '获取提成配置失败')
  }
}

// ============ 大使通知管理 ============

// 获取大使通知列表
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, is_read } = req.query
    const offset = (page - 1) * pageSize

    let where = 'WHERE user_type = 3 AND user_id = ?'
    const params = [req.ambassador.id]

    if (is_read !== undefined) {
      where += ' AND read_status = ?'
      params.push(is_read)
    }

    const [rows] = await pool.query(
      `SELECT id, msg_type, content, read_status, create_time as created_at
       FROM message ${where}
       ORDER BY create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    // 解析content为JSON
    const notifications = rows.map(row => {
      try {
        const parsed = JSON.parse(row.content)
        return {
          ...row,
          title: parsed.title || '系统通知',
          content: parsed.content || row.content,
          notificationId: parsed.notificationId
        }
      } catch {
        return {
          ...row,
          title: '系统通知',
          content: row.content
        }
      }
    })

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM message WHERE user_type = 3 AND user_id = ? ${is_read !== undefined ? 'AND read_status = ' + is_read : ''}`,
      [req.ambassador.id]
    )

    // 获取未读数量
    const [[{ unreadCount }]] = await pool.query(
      'SELECT COUNT(*) as unreadCount FROM message WHERE user_type = 3 AND user_id = ? AND read_status = 0',
      [req.ambassador.id]
    )

    pageSuccess(res, notifications, total, page, pageSize, { unreadCount })
  } catch (err) {
    console.error('Get ambassador notifications error:', err)
    error(res, '获取通知列表失败')
  }
}

// 标记通知已读
exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params

    if (id === 'all') {
      // 标记全部已读
      await pool.query(
        'UPDATE message SET read_status = 1 WHERE user_type = 3 AND user_id = ? AND read_status = 0',
        [req.ambassador.id]
      )
      return success(res, null, '已全部标记为已读')
    }

    await pool.query(
      'UPDATE message SET read_status = 1 WHERE id = ? AND user_type = 3 AND user_id = ?',
      [id, req.ambassador.id]
    )
    success(res, null, '已标记为已读')
  } catch (err) {
    console.error('Mark notification read error:', err)
    error(res, '操作失败')
  }
}

// 获取未读通知数量
exports.getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM message WHERE user_type = 3 AND user_id = ? AND read_status = 0',
      [req.ambassador.id]
    )
    success(res, { count })
  } catch (err) {
    console.error('Get unread count error:', err)
    error(res, '获取未读数量失败')
  }
}
