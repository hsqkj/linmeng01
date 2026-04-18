const mysql = require('mysql2');
const local = mysql.createConnection({host:'localhost',user:'root',password:'root',database:'linmeng'});

local.query('SELECT * FROM communities WHERE id=22', (e, rows) => {
  if(e || rows.length === 0) {
    console.log('本地无ID22数据');
    local.end();
    return;
  }
  const r = rows[0];
  
  // 通过SSH直接更新服务器
  const fs = require('fs');
  const { execSync } = require('child_process');
  
  const tags = JSON.stringify(r.tags || []);
  const images = JSON.stringify(r.images || []);
  const proofImages = JSON.stringify(r.proof_images || []);
  
  const sql = `mysql -uroot -proot linmeng -e "
UPDATE communities SET 
  username='${r.username}',
  real_name='${r.real_name}',
  phone='${r.phone}',
  district='${r.district}',
  street='${r.street}',
  community='${r.community}',
  community_name=NULL,
  position='${r.position || ''}',
  households=${r.households},
  total_households=${r.total_households || 'NULL'},
  family_ratio=${r.family_ratio},
  elderly_ratio=${r.elderly_ratio},
  public_space_area=${r.public_space_area},
  has_outdoor_plaza=${r.has_outdoor_plaza},
  has_commercial=${r.has_commercial},
  has_school=${r.has_school},
  has_park=${r.has_park},
  merchant_count=${r.merchant_count},
  logo='${r.logo || ''}',
  description='${r.description || ''}',
  images='${images}',
  address='${r.address || ''}',
  lat=${r.lat || 'NULL'},
  lng=${r.lng || 'NULL'},
  proof_images='${proofImages}',
  tags='${tags}',
  status=${r.status},
  reject_reason=NULL,
  updated_at=NOW()
WHERE id=22" 2>/dev/null`;
  
  console.log('执行SQL更新...');
  try {
    execSync('ssh -i "D:\\\\WorkBuddy\\\\linmeng2026key.pem" -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "' + sql.replace(/"/g, '\\"') + '"');
    console.log('✅ 服务器ID22更新成功!');
  } catch(err) {
    console.log('❌ 更新失败:', err.message);
  }
  
  local.end();
});
