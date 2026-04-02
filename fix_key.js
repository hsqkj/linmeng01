const fs = require('fs');
const path = 'c:/Users/12494/WorkBuddy/20260331205655/client/src/views/admin/UsersMerchant.vue';
let content = fs.readFileSync(path, 'utf8');
// Fix " :"  -> ":"  (remove space before key binding)
content = content.replace(/" :key="/g, '":key="');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed :key binding');
