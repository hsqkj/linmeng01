const fs = require('fs');
const lines = fs.readFileSync('c:/Users/12494/WorkBuddy/20260331205655/client/src/views/admin/UsersMerchant.vue', 'utf8').split('\n');
for(let i=94;i<99;i++) console.log((i+1)+': '+JSON.stringify(lines[i]));
