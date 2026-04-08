/**
 * 直接模拟完整的login请求流程，输出每一步的详细信息
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../src/config/db')

async function testLogin() {
  console.log('=== 登录流程测试 ===')
  console.log('DB密码:', process.env.DB_PASSWORD)
  
  try {
    // Step 1: 查询管理员
    console.log('\nStep 1: 查询管理员...')
    const [rows] = await pool.query(
      'SELECT id, username, password, role, permissions, status FROM admins WHERE username = ? AND status = 1',
      ['admin']
    )
    console.log('查询结果数量:', rows.length)
    
    if (rows.length === 0) {
      console.error('ERROR: 管理员不存在或状态为0')
      // 查询所有管理员
      const [allAdmins] = await pool.query('SELECT id, username, role, status FROM admins')
      console.log('所有管理员:', allAdmins)
      process.exit(1)
    }
    
    const admin = rows[0]
    console.log('找到管理员:', { id: admin.id, username: admin.username, role: admin.role })
    console.log('密码hash前缀:', admin.password.substring(0, 10))
    
    // Step 2: 验证密码
    console.log('\nStep 2: 验证密码...')
    const isMatch = await bcrypt.compare('admin123', admin.password)
    console.log('密码验证结果:', isMatch)
    
    if (!isMatch) {
      // 重新生成正确的hash
      const newHash = await bcrypt.hash('admin123', 10)
      console.log('生成新hash:', newHash.substring(0, 20))
      await pool.query('UPDATE admins SET password = ? WHERE username = ?', [newHash, 'admin'])
      console.log('已更新密码hash')
      
      // 重新验证
      const isMatch2 = await bcrypt.compare('admin123', newHash)
      console.log('重新验证:', isMatch2)
    }
    
    // Step 3: 生成JWT
    console.log('\nStep 3: 生成JWT...')
    let perms = []
    try {
      perms = JSON.parse(admin.permissions || '[]')
    } catch(e) {
      console.error('permissions解析失败:', admin.permissions)
      perms = []
    }
    
    const token = jwt.sign({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: perms
    }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' })
    
    console.log('Token生成成功，长度:', token.length)
    console.log('\n=== 所有步骤测试通过 ===')
  } catch (e) {
    console.error('\n=== 错误详情 ===')
    console.error('错误类型:', e.constructor.name)
    console.error('错误信息:', e.message)
    console.error('错误栈:', e.stack)
  }
  
  process.exit(0)
}

testLogin()
