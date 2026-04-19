#!/bin/bash

# 在 recommend/demands 路由后添加 home 路由
sed -i "s|router.get('/recommend/demands', MerchantController.getRecommendDemands)|router.get('/recommend/demands', MerchantController.getRecommendDemands)\nrouter.get('/home', MerchantController.getHome)|" /var/www/linmeng/server/src/routes/merchant.js

# 验证
grep -n "home" /var/www/linmeng/server/src/routes/merchant.js
