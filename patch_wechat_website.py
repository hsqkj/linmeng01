import re

file_path = r'D:\WorkBuddy\20260331205655\server\src\routes\wechat.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在配置区插入网站应用配置（在 PUBLIC_SECRET 行之后）
if 'WEBSITE_APPID' not in content:
    old_config = "const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）"
    new_config = """const PUBLIC_SECRET = process.env.WECHAT_PUBLIC_SECRET || ''  // 公众号密钥（需配置）

// 微信开放平台网站应用（PC 扫码登录）
const WEBSITE_APPID = process.env.WECHAT_WEBSITE_APPID || 'WX7914DD87D4F829E6'
const WEBSITE_SECRET = process.env.WECHAT_WEBSITE_SECRET || '929e4a397a41d2963809d375476c7819'
const WEBSITE_REDIRECT_URI = process.env.WECHAT_WEBSITE_REDIRECT_URI || 'https://3qall.com/api/wechat/website-callback'
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'https://3qall.com'"""
    content = content.replace(old_config, new_config, 1)
    print('OK: config added')
else:
    print('SKIP: config already exists')

# 2. 在 H5 auth 路由之前插入网站应用路由
#    找到 "============ 微信公众号网页授权（H5登录） ============" 这一行
#    在其前面插入网站扫码登录路由

website_routes = '''
// ============ 微信开放平台网站应用（PC 扫码登录） ============

/**
 * PC 微信扫码登录 - 重定向到微信二维码页面
 * GET /api/wechat/website-auth
 * Query: ?userType=community&redirect=xxx
 */
router.get('/website-auth', (req, res) => {
  const { userType = 'community', redirect } = req.query
  const state = [userType, redirect || ''].join('|')
  const scope = 'snsapi_login'
  const redirectUri = encodeURIComponent(WEBSITE_REDIRECT_URI)
  const qrUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WEBSITE_APPID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
  res.redirect(qrUrl)
})

/**
 * PC 微信扫码登录 - 微信回调处理
 * GET /api/wechat/website-callback
 * Query: ?code=xxx&state=xxx
 */
router.get('/website-callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code) {
      return res.redirect(`${FRONTEND_BASE}/community/login?wechat_error=no_code`)
    }

    // 解析 state
    const [userType = 'community', redirectUrl = ''] = (state || '').split('|')

    // 1. 用 code 换 access_token + openid（网站应用，用 WEBSITE_SECRET）
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WEBSITE_APPID}&secret=${WEBSITE_SECRET}&code=${code}&grant_type=authorization_code`
    const tokenRes = await axios.get(tokenUrl)

    if (tokenRes.data.errcode) {
      console.error('微信网站应用授权错误:', tokenRes.data)
      return res.redirect(`${FRONTEND_BASE}/community/login?wechat_error=${tokenRes.data.errmsg || 'auth_failed'}`)
    }

    const { openid, unionid, access_token } = tokenRes.data

    // 2. 获取用户信息
    let nickname = '', avatar = ''
    try {
      const userRes = await axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`)
      if (!userRes.data.errcode) {
        nickname = userRes.data.nickname || ''
        avatar = userRes.data.headimgurl || ''
      }
    } catch (e) {
      // 不影响登录流程
    }

    // 3. 查找绑定关系（网站应用的 openid 和公众号 openid 不同，但 unionid 相同）
    const [bindRows] = await db.query(
      'SELECT user_type, user_id, phone FROM wechat_user_bind WHERE unionid = ? OR (openid = ? AND user_type = ?) LIMIT 1',
      [unionid || '', openid, userType]
    )

    if (bindRows.length > 0) {
      // 已绑定：直接登录
      const bind = bindRows[0]
      
      // 如果之前没有记录这个 openid，插入（网站应用 openid 和公众号 openid 不同）
      if (openid && unionid) {
        await db.query(
          'INSERT IGNORE INTO wechat_user_bind (unionid, openid, user_type, user_id, phone) VALUES (?, ?, ?, ?, ?)',
          [unionid, openid, bind.user_type, bind.user_id, bind.phone || '']
        )
      }

      const token = generateToken(openid, bind.user_id, bind.user_type)

      // 重定向到前端，带上 token
      const finalRedirect = redirectUrl || `${FRONTEND_BASE}/community`
      return res.redirect(`${finalRedirect}?wechat_login=success&token=${token}&userType=${bind.user_type}&userId=${bind.user_id}`)
    } else {
      // 未绑定：重定向到前端绑定页面，带上 openid/unionid
      const finalRedirect = redirectUrl || `${FRONTEND_BASE}/community/login`
      return res.redirect(`${finalRedirect}?wechat_new=true&openid=${openid}&unionid=${unionid || ''}&nickname=${encodeURIComponent(nickname)}&avatar=${encodeURIComponent(avatar)}&userType=${userType}`)
    }
  } catch (error) {
    console.error('PC微信扫码登录回调失败:', error)
    return res.redirect(`${FRONTEND_BASE}/community/login?wechat_error=server_error`)
  }
})

'''

if '// ============ 微信公众号网页授权（H5登录） ============' in content and 'website-auth' not in content:
    content = content.replace(
        '// ============ 微信公众号网页授权（H5登录） ============',
        website_routes + '// ============ 微信公众号网页授权（H5登录） ============'
    )
    print('OK: website routes added')
else:
    print('SKIP: website routes already exist or marker not found')

# 3. 在 module.exports 之前加上注释分隔
#   不需要额外操作，路由已经加好了

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('DONE')
