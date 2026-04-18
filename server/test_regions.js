const mysql = require('mysql2')
const c = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'linmeng'
})

// 查询街道数据（level=3）
c.query('SELECT id, name, level, parent_id FROM regions WHERE level = 3 ORDER BY id', (e, streets) => {
  console.log('=== 街道数据 (level=3) ===')
  console.log(JSON.stringify(streets, null, 2))
  
  // 查询社区数据（level=4），筛选parent_id为关东街道或关山街道
  const streetIds = streets.filter(s => s.name === '关东街道' || s.name === '关山街道').map(s => s.id)
  c.query('SELECT id, name, level, parent_id FROM regions WHERE level = 4 AND parent_id IN (?)', [streetIds], (e, communities) => {
    console.log('\n=== 社区数据 (level=4，关联关东/关山街道) ===')
    console.log(JSON.stringify(communities, null, 2))
    c.end()
  })
})