#!/bin/bash
cd /var/www/linmeng/server/src/controllers
# 修复 if 条件语句中的分号
sed -i 's/merchant\.resource_types; typeof/typeof/' merchantController.js
echo "Fixed!"
