import os

file_path = r'D:\WorkBuddy\20260331205655\server\src\routes\wechat.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 检查是否已添加
if 'WEBSITE_APPID' in content:
    print('Already patched, skipping.')
    exit(0)

old_marker = "const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）"

new_block = """const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）

// 微信开放平台网站应用（PC 扫码登录）
const WEBSITE_APPID = process.env.WECHAT_WEBSITE_APPID || 'WX7914DD87D4F829E6'
const WEBSITE_SECRET = process.env.WECHAT_WEBSITE_SECRET || ''
const WEBSITE_REDIRECT_URI = process.env.WECHAT_WEBSITE_REDIRECT_URI || 'http://localhost:3000/api/wechat/website-callback'
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:5173'"""

if old_marker in content:
    content = content.replace(old_marker, new_block, 1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: config added')
else:
    print('ERROR: marker not found')
