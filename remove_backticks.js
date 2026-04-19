const fs = require('fs');
let c = fs.readFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', 'utf8');
// 删除所有反引号
c = c.replace(/`/g, "'");
fs.writeFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', c);
console.log('All backticks removed');
