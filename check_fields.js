const mysql = require('./server/node_modules/mysql2/promise');

async function checkAndAddFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  try {
    // 检查字段是否存在
    const [rows] = await connection.query('DESCRIBE resources');
    const fields = rows.map(r => r.Field);
    console.log('当前 resources 表字段数量:', fields.length);

    if (!fields.includes('expected_rewards')) {
      await connection.query('ALTER TABLE resources ADD COLUMN expected_rewards TEXT COMMENT "期望回报类型" AFTER coverage');
      console.log('已添加 expected_rewards 字段');
    } else {
      console.log('expected_rewards 字段已存在');
    }

    if (!fields.includes('expected_reward_desc')) {
      await connection.query('ALTER TABLE resources ADD COLUMN expected_reward_desc TEXT COMMENT "期望回报说明" AFTER expected_rewards');
      console.log('已添加 expected_reward_desc 字段');
    } else {
      console.log('expected_reward_desc 字段已存在');
    }

    // 验证
    const [newRows] = await connection.query('DESCRIBE resources');
    const newFields = newRows.map(r => r.Field);
    console.log('\n更新后字段数量:', newFields.length);
    console.log('包含 expected_rewards:', newFields.includes('expected_rewards'));
    console.log('包含 expected_reward_desc:', newFields.includes('expected_reward_desc'));

  } finally {
    await connection.end();
  }
}

checkAndAddFields().catch(console.error);
