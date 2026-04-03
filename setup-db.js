/**
 * 数据库补充修复脚本
 * 创建缺失的表，添加缺失的字段
 */
const mysql = require('./server/node_modules/mysql2/promise')

async function main() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  })

  console.log('=== 数据库修复开始 ===\n')

  // 1. 创建 system_notifications 表
  try {
    await c.execute(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        target_type TINYINT DEFAULT 0 COMMENT '0=全部,1=社区,2=商家,3=大使',
        target_ids TEXT COMMENT 'JSON数组，为空则全部',
        priority TINYINT DEFAULT 0 COMMENT '0=普通,1=重要,2=紧急',
        status TINYINT DEFAULT 0 COMMENT '0=草稿,1=已发布,3=已删除',
        published_at DATETIME,
        created_by INT,
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知'
    `)
    console.log('✅ system_notifications 表创建成功')
  } catch (e) {
    console.log('system_notifications 表:', e.message)
  }

  // 2. 给 tags 表添加 sort_order 字段（如果不存在）
  try {
    await c.execute(`ALTER TABLE tags ADD COLUMN sort_order INT DEFAULT 0`)
    console.log('✅ tags.sort_order 字段添加成功')
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('ℹ️  tags.sort_order 字段已存在，跳过')
    } else {
      console.log('tags.sort_order:', e.message)
    }
  }

  // 3. 给 ambassadors 表添加提现账户字段
  const ambassadorFields = [
    { col: 'account_type', def: "VARCHAR(20) DEFAULT NULL COMMENT '提现账户类型：alipay/wechat/bank'" },
    { col: 'account_name', def: "VARCHAR(50) DEFAULT NULL COMMENT '账户姓名'" },
    { col: 'account_number', def: "VARCHAR(100) DEFAULT NULL COMMENT '账户号码'" },
  ]
  for (const { col, def } of ambassadorFields) {
    try {
      await c.execute(`ALTER TABLE ambassadors ADD COLUMN ${col} ${def}`)
      console.log(`✅ ambassadors.${col} 字段添加成功`)
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log(`ℹ️  ambassadors.${col} 字段已存在，跳过`)
      } else {
        console.log(`ambassadors.${col}:`, e.message)
      }
    }
  }

  // 4. 创建 withdraw_records 表
  try {
    await c.execute(`
      CREATE TABLE IF NOT EXISTS withdraw_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ambassador_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        account_type VARCHAR(20),
        account_name VARCHAR(50),
        account_number VARCHAR(100),
        status TINYINT DEFAULT 0 COMMENT '0=待处理,1=已到账,2=已拒绝',
        remark VARCHAR(200),
        handled_at DATETIME,
        created_at DATETIME DEFAULT NOW()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='大使提现记录'
    `)
    console.log('✅ withdraw_records 表创建成功')
  } catch (e) {
    console.log('withdraw_records 表:', e.message)
  }

  // 5. 验证
  try {
    const [r1] = await c.execute('SELECT COUNT(*) as cnt FROM system_notifications')
    console.log(`\n✅ system_notifications 表验证通过，当前 ${r1[0].cnt} 条记录`)
  } catch (e) {
    console.log('❌ system_notifications 验证失败:', e.message)
  }

  try {
    const [r2] = await c.execute('SELECT id, name, type, sort_order FROM tags LIMIT 3')
    console.log(`✅ tags.sort_order 字段验证通过，示例:`, r2.map(r => r.name).join(', '))
  } catch (e) {
    console.log('❌ tags sort_order 验证失败:', e.message)
  }

  try {
    await c.execute('SELECT account_type FROM ambassadors LIMIT 1')
    console.log('✅ ambassadors 提现字段验证通过')
  } catch (e) {
    console.log('❌ ambassadors 提现字段验证失败:', e.message)
  }

  try {
    const [r4] = await c.execute('SELECT COUNT(*) as cnt FROM withdraw_records')
    console.log(`✅ withdraw_records 表验证通过，当前 ${r4[0].cnt} 条记录`)
  } catch (e) {
    console.log('❌ withdraw_records 验证失败:', e.message)
  }

  await c.end()
  console.log('\n=== 数据库修复完成 ===')
}

main().catch(console.error)
