import re

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Login.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

modified = False

# 1. 在 "agree" 阶段的 "其他登录方式" 里加上 "微信扫码"
#    找到 agree 阶段的 other-login-icons，在手机号 item 前插入微信扫码 item
old_agree_icons = '''          <div class="other-login-icons">
            <div class="other-login-item" @click="switchToPhone">
              <div class="other-icon phone-icon">📱</div>
              <span>手机号</span>
            </div>
          </div>'''

new_agree_icons = '''          <div class="other-login-icons">
            <div class="other-login-item" @click="onWebsiteLogin">
              <div class="other-icon wechat-icon">💬</div>
              <span>微信扫码</span>
            </div>
            <div class="other-login-item" @click="switchToPhone">
              <div class="other-icon phone-icon">📱</div>
              <span>手机号</span>
            </div>
          </div>'''

if old_agree_icons in content and 'onWebsiteLogin' not in content:
    # 只替换 agree 阶段里的（第一个匹配）
    content = content.replace(old_agree_icons, new_agree_icons, 1)
    print('OK: added QR icon in agree phase')
    modified = True
else:
    print('SKIP: agree phase icons already patched or not found')

# 2. 在 "wechat" 阶段的 "其他登录方式" 里也加上 "微信扫码"（PC端备用）
old_wechat_icons = '''          <div class="other-login-icons">
            <div class="other-login-item" @click="switchToPhone">
              <div class="other-icon phone-icon">📱</div>
              <span>手机号</span>
            </div>
          </div>'''

new_wechat_icons = '''          <div class="other-login-icons">
            <div class="other-login-item" @click="onWebsiteLogin">
              <div class="other-icon wechat-icon">💬</div>
              <span>微信扫码</span>
            </div>
            <div class="other-login-item" @click="switchToPhone">
              <div class="other-icon phone-icon">📱</div>
              <span>手机号</span>
            </div>
          </div>'''

# 只替换 wechat 阶段里的（第二个匹配）——用更精确的上下文
old_wechat_block = '''      <div v-if="phase === 'wechat'" class="phase-wechat">'''

if 'onWebsiteLogin' in content and old_wechat_block in content:
    # wechat 阶段的 other-login-icons 已经在第一次替换时被一起换了（两个阶段的 HTML 结构一样）
    # 检查一下 wechat 阶段里是否已经有微信扫码
    idx = content.find(old_wechat_block)
    wechat_section = content[idx:idx+2000]
    if '微信扫码' not in wechat_section:
        print('WARN: wechat phase may still need QR icon - check manually')
    else:
        print('OK: wechat phase already has QR icon')

# 3. 在 script 里添加 onWebsiteLogin 函数（在 onAgree 函数之后插入）
if 'onWebsiteLogin' not in content:
    old_script = '''function onAgree() {
  agreedTerms.value = true
  phase.value = 'wechat'
}'''

    new_script = '''function onAgree() {
  agreedTerms.value = true
  phase.value = 'wechat'
}

// ============ PC 微信扫码登录 ============
function onWebsiteLogin() {
  // 跳转到后端网站应用扫码路由，state 里带 userType 和 redirect
  const params = new URLSearchParams({
    userType: 'community',
    redirect: window.location.origin + '/community'
  })
  window.location.href = `/api/wechat/website-auth?${params.toString()}`
}'''

    if old_script in content:
        content = content.replace(old_script, new_script, 1)
        print('OK: added onWebsiteLogin function')
        modified = True
    else:
        print('ERROR: cannot find insertion point for onWebsiteLogin')
else:
    print('SKIP: onWebsiteLogin already exists')

# 4. 在 onMounted 里加上 URL 参数检测（处理扫码回调）
if 'wechat_login=success' not in content:
    old_mounted = '''onMounted(() => {
  // 已登录则直接跳转
  if (localStorage.getItem('community_token')) {
    router.push('/community')
  }
})'''

    new_mounted = '''onMounted(() => {
  // 已登录则直接跳转
  if (localStorage.getItem('community_token')) {
    router.push('/community')
    return
  }

  // 处理微信网站应用扫码登录回调
  const params = new URLSearchParams(window.location.search)
  const wechatLogin = params.get('wechat_login')
  const wechatNew = params.get('wechat_new')
  const wechatError = params.get('wechat_error')

  if (wechatError) {
    ElMessage.error('微信登录失败：' + decodeURIComponent(wechatError))
    // 清除 URL 参数
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (wechatLogin === 'success') {
    const token = params.get('token')
    const userId = params.get('userId')
    const userType = params.get('userType')
    if (token) {
      localStorage.setItem('community_token', token)
      ElMessage.success('微信登录成功')
      // 获取用户信息并存储
      fetch(`/api/community/info`, {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(r => r.json()).then(res => {
        if (res.code === 0 || res.code === 200) {
          localStorage.setItem('community_info', JSON.stringify(res.data || res))
        }
        router.push('/community')
      }).catch(() => {
        router.push('/community')
      })
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  if (wechatNew === 'true') {
    const openid = params.get('openid')
    const unionid = params.get('unionid')
    const nickname = params.get('nickname')
    const avatar = params.get('avatar')
    // 未绑定的微信用户：提示绑定手机号
    ElMessage.info('请绑定手机号以完成登录')
    phase.value = 'phone'
    // 存储微信信息，绑定手机号时一起提交
    window.__wechat_bind_info = { openid, unionid, nickname, avatar, userType: params.get('userType') || 'community' }
    window.history.replaceState({}, '', window.location.pathname)
  }
})'''

    if old_mounted in content:
        content = content.replace(old_mounted, new_mounted, 1)
        print('OK: added QR callback handling in onMounted')
        modified = True
    else:
        print('ERROR: cannot find onMounted to patch')
else:
    print('SKIP: wechat_login callback already exists')

# 5. 在 style 里加上 wechat-icon 的样式（绿色边框）
if '.wechat-icon' not in content:
    # 在 .phone-icon 样式后面插入
    old_style = ''':hover { border-color: #26a269; }'''
    new_style = ''':hover { border-color: #26a269; }
.other-icon.wechat-icon:hover { border-color: #07c160; background: #f0faf4; }'''
    # 更精确的匹配
    old_style_block = '''.other-icon:hover { border-color: #26a269; }
.link { color: #26a269; text-decoration: none; }'''
    new_style_block = '''.other-icon:hover { border-color: #26a269; }
.other-icon.wechat-icon:hover { border-color: #07c160; background: #f0faf4; }
.link { color: #26a269; text-decoration: none; }'''
    if old_style_block in content:
        content = content.replace(old_style_block, new_style_block, 1)
        print('OK: added wechat-icon hover style')
        modified = True
    else:
        print('WARN: could not add wechat-icon style, add manually')

if modified:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('\nDONE: Login.vue patched')
else:
    print('\nNo changes made (already patched?)')
