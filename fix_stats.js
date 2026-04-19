const fs = require('fs');
let c = fs.readFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', 'utf8');
// 修复stats查询末尾的SQL语句 - 需要添加反引号结束模板字符串
c = c.replace(
  /as totalResources',\n\s*\[merchantId, merchantId, merchantId\]\n\s*\)/g,
  "as totalResources\`,\n      [merchantId, merchantId, merchantId]\n    )"
);
fs.writeFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', c);
console.log('Fixed stats query');
