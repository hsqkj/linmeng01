const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const [rows] = await pool.query('SELECT id, title, start_time, end_time, deadline, target_audience, tags FROM demands LIMIT 3');
  console.log('需求数据格式：');
  rows.forEach(r => {
    console.log('---');
    console.log('ID:', r.id);
    console.log('标题:', r.title);
    console.log('开始时间:', r.start_time, typeof r.start_time);
    console.log('结束时间:', r.end_time, typeof r.end_time);
    console.log('截止日期:', r.deadline, typeof r.deadline);
    console.log('目标对象:', r.target_audience);
    console.log('标签:', r.tags);
  });

  await pool.end();
}

check().catch(console.error);
