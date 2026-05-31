import os

p = r'D:\WorkBuddy\20260331205655\server\src\routes\wechat.js'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

old = "const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）"

new = """const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）

// 微信开放平台网站应用（PC 扫码登录）
const WEBSITE_APPID = process.env.WECHAT_WEBSITE_APPID || 'WX7914DD87D4F829E6'
const WEBSITE_SECRET = process.env.WECHAT_WEBSITE_SECRET || ''
const WEBSITE_REDIRECT_URI = process.env.WECHAT_WEBSITE_REDIRECT_URI || 'http://localhost:3000/api/wechat/website-callback'
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:5173'"""

if old in content and 'WEBSITE_APPID' not in content:
    content = content.replace(old, new)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: website app config added')
else:
    print('SKIP: already exists or old string not found')
