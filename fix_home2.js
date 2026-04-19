#!/usr/bin/env node
const fs = require('fs');
let content = fs.readFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', 'utf8');

// 问题1: FROM merchants m WHERE m.id = ?`, 应该是 FROM merchants m WHERE m.id = ?`, 
content = content.replace(
  /FROM merchants m WHERE m\.id = \?`,\n\s*\[merchantId\]\n\s*\)/g,
  "FROM merchants m WHERE m.id = ?',\n      [merchantId]\n    )"
);

// 问题2: SELECT ... as totalResources)` 缺少反引号，参数位置错误
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM resources WHERE status = 1\) as totalResources\)\n\s*,\s*\[merchantId, merchantId, merchantId\]\)/g,
  "(SELECT COUNT(*) FROM resources WHERE status = 1) as totalResources\',\n      [merchantId, merchantId, merchantId]\n    )"
);

fs.writeFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', content);
console.log('Done!');
