const mysql = require('mysql2/promise');

async function fixData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });
  
  try {
    // 查询当前数据
    const [rows] = await pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'");
    
    if (rows.length === 0) {
      console.log('No basic_types config found');
      return;
    }
    
    const data = JSON.parse(rows[0].config_value);
    
    // 修复 communityTypes
    if (data.communityTypes && Array.isArray(data.communityTypes)) {
      data.communityTypes = data.communityTypes.map(item => {
        // 如果 name 是对象，说明数据嵌套了
        if (item.name && typeof item.name === 'object' && item.name.name) {
          return { name: item.name.name, enabled: item.enabled !== false };
        }
        return item;
      });
    }
    
    // 修复 residentTypes
    if (data.residentTypes && Array.isArray(data.residentTypes)) {
      data.residentTypes = data.residentTypes.map(item => {
        if (item.name && typeof item.name === 'object' && item.name.name) {
          return { name: item.name.name, enabled: item.enabled !== false };
        }
        return item;
      });
    }
    
    // 也修复其他可能有同样问题的字段
    const typeFields = ['activityTypes', 'enterpriseTypes', 'resourceTypes', 'expertTypes', 'industryTypes'];
    for (const field of typeFields) {
      if (data[field] && Array.isArray(data[field])) {
        data[field] = data[field].map(item => {
          if (item.name && typeof item.name === 'object' && item.name.name) {
            return { name: item.name.name, enabled: item.enabled !== false };
          }
          return item;
        });
      }
    }
    
    // 保存修复后的数据
    const newConfigValue = JSON.stringify(data);
    await pool.query("UPDATE sys_configs SET config_value = ? WHERE config_key = 'basic_types'", [newConfigValue]);
    
    console.log('Data fixed successfully!');
    console.log('communityTypes:', JSON.stringify(data.communityTypes, null, 2));
    console.log('residentTypes:', JSON.stringify(data.residentTypes, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixData();
