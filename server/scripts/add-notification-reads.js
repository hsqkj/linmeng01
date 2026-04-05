/**
 * 添加通知已读跟踪表
 */
const mysql = require('mysql2/promise')

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  })

  try {
    // 创建通知阅读记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_reads (
        id INT PRIMARY KEY AUTO_INCREMENT,
        notification_id INT NOT NULL COMMENT '通知ID',
        user_type ENUM('community','merchant','ambassador') NOT NULL COMMENT '用户类型',
        user_id INT NOT NULL COMMENT '用户ID',
        read_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
        UNIQUE KEY uk_notify_user (notification_id, user_type, user_id),
        INDEX idx_user (user_type, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知阅读记录表'
    `)
    console.log('✅ 表 notification_reads 创建成功')

    // 将所有现有通知标记为已读（假设是测试数据）
    // 或者我们可以跳过这一步，让用户手动标记

    console.log('✅ 迁移完成')
  } catch (err) {
    console.error('迁移失败:', err)
  } finally {
    await pool.end()
  }
}

migrate()
