// 添加本地缺失的字段
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function addFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'linmeng',
    port: process.env.DB_PORT || 3306
  });

  const fields = [
    { name: 'manpower_desc', type: 'VARCHAR(500)' },
    { name: 'media_desc', type: 'VARCHAR(500)' },
    { name: 'goods_items', type: 'JSON' },
    { name: 'space_area', type: 'VARCHAR(100)' },
    { name: 'capacity', type: 'INT(11)' },
    { name: 'facilities', type: 'JSON' },
    { name: 'open_hours', type: 'VARCHAR(200)' },
    { name: 'work_type', type: 'VARCHAR(100)' },
    { name: 'salary_range', type: 'VARCHAR(100)' },
    { name: 'ai_audit_level', type: 'VARCHAR(20)' },
    { name: 'ai_audit_reason', type: 'TEXT' }
  ];

  for (const field of fields) {
    try {
      // 检查字段是否存在
      const [rows] = await connection.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resources' AND COLUMN_NAME = ?`,
        [field.name]
      );

      if (rows[0].cnt === 0) {
        // 添加字段
        let afterColumn;
        switch (field.name) {
          case 'manpower_desc': afterColumn = 'work_duration'; break;
          case 'media_desc': afterColumn = 'media_channels'; break;
          case 'goods_items': afterColumn = 'goods_expiry'; break;
          case 'space_area': afterColumn = 'fund_scenes'; break;
          case 'capacity': afterColumn = 'space_area'; break;
          case 'facilities': afterColumn = 'capacity'; break;
          case 'open_hours': afterColumn = 'facilities'; break;
          case 'work_type': afterColumn = 'open_hours'; break;
          case 'salary_range': afterColumn = 'work_type'; break;
          case 'ai_audit_level': afterColumn = 'salary_range'; break;
          case 'ai_audit_reason': afterColumn = 'ai_audit_level'; break;
        }

        await connection.query(`ALTER TABLE resources ADD COLUMN ${field.name} ${field.type} AFTER ${afterColumn}`);
        console.log(`✅ 添加字段: ${field.name}`);
      } else {
        console.log(`⏭️ 字段已存在: ${field.name}`);
      }
    } catch (err) {
      console.error(`❌ 添加字段失败: ${field.name}`, err.message);
    }
  }

  await connection.end();
  console.log('\n完成！');
}

addFields();
