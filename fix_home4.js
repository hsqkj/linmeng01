const fs = require('fs');
let c = fs.readFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', 'utf8');
c = c.replace(/FROM merchants m WHERE m\.id = \?\`,/g, "FROM merchants m WHERE m.id = ?',");
c = c.replace(/as totalResources\)\s*,/g, "as totalResources',");
c = c.replace(/\), \[merchantId, merchantId, merchantId\]\)/g, "), [merchantId, merchantId, merchantId])");
fs.writeFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', c);
console.log('Fixed');
