#!/usr/bin/env python3
import sys

# 读取文件
with open('/var/www/linmeng/server/src/routes/merchant.js', 'r') as f:
    content = f.read()

# 1. 删除第一处 /home 路由（在认证中间件之前的那行）
content = content.replace("router.get('/home', MerchantController.getHome)\n", "")

# 2. 在第二个 authMerchant 之后添加路由
old_text = "// 需要认证的路由\nrouter.use(authMerchant)"
new_text = """// 需要认证的路由
router.use(authMerchant)

// 商家首页
router.get('/home', MerchantController.getHome)"""

content = content.replace(old_text, new_text)

# 写回文件
with open('/var/www/linmeng/server/src/routes/merchant.js', 'w') as f:
    f.write(content)

print("Done!")
