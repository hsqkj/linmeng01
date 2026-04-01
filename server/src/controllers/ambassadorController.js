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
    const { phone, password } = req.body
    
    const [rows] = await pool.query('SELECT * FROM ambassadors WHERE phone = ?', [phone])
    
    if (rows.length === 0) {
      return error(res, '账号或密码错误', 401)
    }
    
    const ambassador = rows[0]
    
    if (ambassador.status !== 1) {
      return error(res, '账号未通过审核', 403)
    }
    
    const isMatch = await bcrypt.compare(password, ambassador.password)
    if (!isMatch) {
      return error(res, '账号或密码错误', 401)
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

// 获取渠道码
exports.getQrCode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, qr_code FROM ambassadors WHERE id = ?',
      [req.ambassador.id]
    )
    
    success(res, rows[0])
  } catch (err) {
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
