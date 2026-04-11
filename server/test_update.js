const mysql = require('mysql2/promise')

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng',
    port: 3306,
    charset: 'utf8mb4'
  })

  try {
    // 检查资源33的当前状态
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = 33')
    console.log('Current resource:', JSON.stringify(rows[0], null, 2))
    console.log('')

    // 模拟 updateResource 的 SQL
    console.log('Testing UPDATE with:')
    console.log('  resource_type = 0')
    console.log('  title = test')
    console.log('  content = test')

    await pool.query(
      'UPDATE resources SET resource_type = ?, title = ?, content = ?, images = ?, tags = ?, min_amount = ?, max_amount = ?, quantity = ?, specs = ?, pickup_way = ?, staff_count = ?, work_duration = ?, skill_requirements = ?, service_scope = ?, certification = ?, price_range = ?, media_type = ?, coverage = ?, professional_type = ?, tech_types = ?, tech_service_type = ?, goods_expiry = ?, fund_scenes = ?, media_channels = ?, valid_until = ?, expected_rewards = ?, expected_reward_desc = ?, status = 0 WHERE id = ?',
      [0, 'test', 'test', '[]', '[]', 0, 50000, 0, '', '', 0, 0, '', '', '', '', '', '', '', '[]', '', null, '[]', '[]', null, '[]', '', 33]
    )

    console.log('UPDATE successful!')

    // 恢复原值
    await pool.query('UPDATE resources SET title = ? WHERE id = 33', [rows[0].title])
    console.log('Restored original title')

  } catch (err) {
    console.error('Error:', err.message)
    console.error('SQL State:', err.sqlState)
    console.error('SQL Code:', err.sqlMessage)
  }

  await pool.end()
}

test()
