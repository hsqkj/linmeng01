const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  // 修复 expert_types - 键名加引号
  const expertTypes = [
    {name:"法律咨询",status:1,sort_order:1},
    {name:"医疗健康",status:1,sort_order:2},
    {name:"心理辅导",status:1,sort_order:3},
    {name:"教育培训",status:1,sort_order:4},
    {name:"技能培训",status:1,sort_order:5},
    {name:"金融理财",status:1,sort_order:6},
    {name:"社会工作",status:1,sort_order:7},
    {name:"文艺指导",status:1,sort_order:8},
    {name:"体育健身",status:1,sort_order:9},
    {name:"营养指导",status:1,sort_order:10},
    {name:"IT技术",status:1,sort_order:11},
    {name:"财务税务",status:1,sort_order:12},
    {name:"人力资源",status:1,sort_order:13},
    {name:"亲子教育",status:1,sort_order:14},
    {name:"老年服务",status:1,sort_order:15},
    {name:"志愿服务",status:1,sort_order:16},
    {name:"环保公益",status:1,sort_order:17},
    {name:"社区建设",status:1,sort_order:18},
    {name:"婚姻家庭",status:1,sort_order:19},
    {name:"职业规划",status:1,sort_order:20},
    {name:"中医养生",status:1,sort_order:22},
    {name:"瑜伽冥想",status:1,sort_order:23},
    {name:"宠物护理",status:1,sort_order:24},
    {name:"家居装修",status:1,sort_order:25},
    {name:"汽车维修",status:1,sort_order:26},
    {name:"摄影摄像",status:1,sort_order:27},
    {name:"美妆造型",status:1,sort_order:28},
    {name:"烹饪烘焙",status:1,sort_order:29},
    {name:"其他",status:1,sort_order:99}
  ];

  const expertJson = JSON.stringify(expertTypes);
  await conn.execute(
    'UPDATE sys_configs SET config_value = ? WHERE config_key = ?',
    [expertJson, 'expert_types']
  );
  console.log('expert_types 已修复');

  // 修复 anti_flying_level - 改为正确的 JSON 格式
  const levelConfig = {Lv3: 500};
  const levelJson = JSON.stringify(levelConfig);
  await conn.execute(
    'UPDATE sys_configs SET config_value = ? WHERE config_key = ?',
    [levelJson, 'anti_flying_level']
  );
  console.log('anti_flying_level 已修复');

  // 验证
  const [expert] = await conn.execute(
    'SELECT config_value FROM sys_configs WHERE config_key = ?',
    ['expert_types']
  );
  try {
    JSON.parse(expert[0].config_value);
    console.log('expert_types JSON 验证通过');
  } catch(e) {
    console.log('expert_types JSON 验证失败:', e.message);
  }

  const [level] = await conn.execute(
    'SELECT config_value FROM sys_configs WHERE config_key = ?',
    ['anti_flying_level']
  );
  try {
    JSON.parse(level[0].config_value);
    console.log('anti_flying_level JSON 验证通过');
  } catch(e) {
    console.log('anti_flying_level JSON 验证失败:', e.message);
  }

  await conn.end();
  console.log('完成');
}

fix().catch(console.error);
