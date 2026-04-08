// 创建大使通知表并初始化
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function initAmbassadorNotifications() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'linmeng'
  });

  console.log('=== 初始化大使通知功能 ===');

  // 创建 ambassador_notifications 表
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ambassador_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ambassador_id INT NOT NULL COMMENT '接收通知的大使ID',
      title VARCHAR(200) NOT NULL COMMENT '通知标题',
      content TEXT NOT NULL COMMENT '通知内容',
      type TINYINT DEFAULT 0 COMMENT '通知类型: 0系统通知 1提成到账 2审核通知 3活动通知',
      is_read TINYINT DEFAULT 0 COMMENT '是否已读: 0未读 1已读',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ambassador_id (ambassador_id),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createTableSQL);
    console.log('✅ ambassador_notifications 表创建成功');
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  ambassador_notifications 表已存在');
    } else {
      throw err;
    }
  }

  // 为 system_notifications 添加 ambassador 支持（修改 target_type 枚举）
  // target_type: 0=全体 1=社区 2=商家 3=招商大使
  // 我们不需要修改 system_notifications，而是用 ambassador_notifications 表单独处理

  // 插入一些测试通知
  const testNotifications = [
    {
      ambassador_id: 1,
      title: '欢迎加入邻盟招商大使团队',
      content: '恭喜您成为邻盟招商大使！您可以通过专属渠道码邀请商家入驻，每成功邀请一家即可获得丰厚提成。',
      type: 0
    },
    {
      ambassador_id: 1,
      title: '提成政策更新通知',
      content: '亲爱的招商大使，为感谢您的辛勤付出，即日起首次成交佣金比例提升至25%！详情请查看提成政策。',
      type: 3
    },
    {
      ambassador_id: 2,
      title: '欢迎加入邻盟招商大使团队',
      content: '恭喜您成为邻盟招商大使！您可以通过专属渠道码邀请商家入驻，每成功邀请一家即可获得丰厚提成。',
      type: 0
    }
  ];

  for (const notif of testNotifications) {
    try {
      await pool.query(
        'INSERT INTO ambassador_notifications (ambassador_id, title, content, type) VALUES (?, ?, ?, ?)',
        [notif.ambassador_id, notif.title, notif.content, notif.type]
      );
      console.log(`✅ 插入通知: ${notif.title}`);
    } catch (err) {
      console.error(`❌ 插入通知失败: ${err.message}`);
    }
  }

  console.log('\n=== 初始化完成 ===');
  await pool.end();
}

initAmbassadorNotifications().catch(console.error);
