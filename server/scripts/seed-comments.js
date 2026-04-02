require('dotenv').config({ path: '.env' })
const mysql = require('mysql2/promise')

async function main() {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng'
  })

  // 清空旧留言
  await c.query('DELETE FROM comments')
  console.log('已清空旧留言')

  // 插入资源留言（社区留言在商家资源下）
  await c.query(`
    INSERT INTO comments (resource_id, user_type, user_id, content, status, created_at) VALUES
    (1, 1, 1, '我们社区计划暑期开展青少年活动，对你们的编程课很感兴趣，可以详细介绍一下课程内容和收费吗？', 1, NOW()),
    (1, 1, 2, '请问体验课可以在我们社区活动中心开展吗？我们有现成的多媒体教室。', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 1, 1, '我们居委会有200平方的活动室，可以容纳多少人一起做健身公开课？', 1, NOW()),
    (3, 1, 3, '我们社区很多年轻妈妈对美甲感兴趣，请问体验价格是多少？', 1, DATE_SUB(NOW(), INTERVAL 2 DAY))
  `)
  console.log('资源留言插入成功')

  // 插入需求留言（商家留言在社区需求下）
  await c.query(`
    INSERT INTO comments (demand_id, user_type, user_id, content, status, created_at) VALUES
    (1, 2, 1, '我们非常愿意赞助这次暑期活动！可以提供免费的编程体验课，名额50人。', 1, NOW()),
    (2, 1, 1, '我们社区老年人较多，请问能安排在周六上午吗？大约50人参与。', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (3, 2, 2, '我们健身会所愿意提供免费的公开课教练，请问活动时间定在什么时候？', 1, NOW())
  `)
  console.log('需求留言插入成功')

  const [rows] = await c.query('SELECT c.*, (SELECT company_name FROM merchants WHERE id = c.user_id AND c.user_type = 2) as merchant_name, (SELECT community_name FROM communities WHERE id = c.user_id AND c.user_type = 1) as community_name FROM comments c ORDER BY c.id')
  console.log('当前留言:')
  rows.forEach(r => {
    const user = r.user_type === 1 ? r.community_name : r.merchant_name
    console.log(`  [${r.id}] ${user}(${r.user_type === 1 ? '社区' : '商家'}) → ${r.demand_id ? '需求' : '资源'} ${r.demand_id || r.resource_id}: ${r.content.substring(0, 30)}...`)
  })

  await c.end()
  console.log('\n留言测试数据创建完成！')
}

main().catch(e => { console.error(e); process.exit(1) })
