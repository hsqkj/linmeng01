#!/bin/bash
cd /var/www/linmeng/server/src/controllers

# 1. 修复 FROM merchants 查询 - 缺少反引号
sed -i "s/FROM merchants m WHERE m.id = ?,/FROM merchants m WHERE m.id = ?\`,/" merchantController.js

# 2. 修复 stats 查询的参数位置
sed -i 's/as totalResources\),$/as totalResources\`)/' merchantController.js
sed -i 's/, \[merchantId, merchantId, merchantId\])/, [merchantId, merchantId, merchantId])/' merchantController.js

# 3. 修复 stat 赋值语句
sed -i 's/const stat = stats\[0\]; {}/const stat = stats[0]/' merchantController.js

# 4. 修复 tags 条件语句
sed -i 's/merchant\.tags; typeof/typeof/' merchantController.js

echo "All fixes applied!"
