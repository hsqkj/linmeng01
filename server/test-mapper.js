const mysql = require('mysql2/promise');
const typeMapper = require('./src/services/typeMapper');

async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'root', database: 'linmeng' });

  // 初始化 typeMapper
  await typeMapper.initialize();

  // 获取一条有数字数组的需求
  const [rows] = await pool.query('SELECT id, title, target_audience, tags FROM demands WHERE id = 37');
  const row = rows[0];
  console.log('原始数据:', JSON.stringify({target_audience: row.target_audience, tags: row.tags}));

  // 解析 JSON
  let target_audience = JSON.parse(row.target_audience || '[]');
  let tags = JSON.parse(row.tags || '[]');
  console.log('解析后:', {target_audience, tags});

  // 转换
  target_audience = typeMapper.getTypeNames('residentTypes', target_audience);
  tags = typeMapper.getTypeNames('communityTags', tags);
  console.log('转换后:', {target_audience, tags});

  await pool.end();
}
test().catch(console.error);
