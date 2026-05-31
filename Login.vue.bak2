<template>
  <div class="comm-login-page">
    <div class="comm-login-body">

      <!-- ===================== -->
      <!-- 阶段1：协议同意页     -->
      <!-- ===================== -->
      <div v-if="phase === 'agree'" class="phase-agree">
        <div class="comm-logo">
          <div class="logo-icon">🏘</div>
          <div class="logo-text">邻盟</div>
          <div class="logo-sub">社区工作者登录</div>
        </div>

        <div class="agree-hint">
          请先阅读并同意
          <a href="#" @click.prevent="showTerms('service')" class="link">《服务条款》</a>
          和
          <a href="#" @click.prevent="showTerms('privacy')" class="link">《隐私协议》</a>
        </div>

        <button class="btn-agree" @click="onAgree">同意</button>

        <div class="other-login-section">
          <div class="divider-line"><span>其他登录方式</span></div>
          <div class="other-login-icons">
            <div class="other-login-item" @click="onWebsiteLogin">
              <div class="other-icon wechat-icon">💬</div>
              <span>微信扫码</span>
            </div>
            <div class="other-login-item" @click="switchToPhone">
              <div class="other-icon phone-icon">📱</div>
              <span>手机号</span>
            </div>
          </div>
        </div>

        <div class="bottom-agree">
          <label class="agree-checkbox">
            <input type="checkbox" v-model="agreedTerms" />
            <span class="check-box" :class="{ checked: agreedTerms }">
              <span v-if="agreedTerms" class="check-mark">✓</span>
            </span>
            <span class="agree-text">
              我已阅读并同意
              <a href="#" @click.prevent="showTerms('service')" class="link">《服务条款》</a>
              和
              <a href="#" @click.prevent="showTerms('privacy')" class="link">《隐私协议》</a>
            </span>
          </label>
        </div>
      </div>

      <!-- ===================== -->
      <!-- 阶段2：微信快捷登录页  -->
      <!-- ===================== -->
      <div v-if="phase === 'wechat'" class="phase-wechat">
        <div class="comm-logo">
          <div class="logo-icon">🏘</div>
          <div class="logo-text">邻盟</div>
          <div class="logo-sub">社区工作者登录</div>
        </div>

        <!-- 微信快捷登录按钮 -->
        <button class="btn-wechat-login" @click="onWechatLogin">
          <svg viewBox="0 0 1024 1024" width="22" height="22" style="flex-shrink:0">
            <path d="M690.1 377.4c5.9 0 11.8 0.2 17.6 0.5-24.4-128.7-158.3-227.1-313.4-227.1C209 150.8 62.4 274.8 62.4 428.6c0 94.3 55.2 174.5 135.1 223.6l-31.6 94.5 112.1-55.6c38.1 10.2 77.3 17.1 118.5 17.1 5.4 0 10.8-0.2 16.2-0.5-3.4-17.1-5.3-34.8-5.3-53 0-158.5 137.7-277.3 282.7-277.3zM557.4 302.2c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40zM273.7 382.2c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z" fill="#fff"/>
            <path d="M962.4 660.7c0-126.8-127.3-229.7-284.3-229.7-157.3 0-284.3 102.9-284.3 229.7S520.8 890.4 678.1 890.4c34.5 0 67.8-5.3 99.1-14.8l91.6 45.4-25.8-77.3c68.5-42.4 119.4-111.1 119.4-183z" fill="#fff"/>
          </svg>
          微信快捷登录
        </button>
        <div class="wechat-hint">使用微信授权，一键登录</div>

        <div class="other-login-section">
          <div class="divider-line"><span>其他登录方式</span></div>
          <div class="other-login-icons">
            <div class="other-login-item" @click="onWebsiteLogin">
              <div class="other-icon wechat-icon">💬</div>
              <span>微信扫码</span>
            </div>
            <div class="other-login-item" @click="switchToPhone">
              <div class="other-icon phone-icon">📱</div>
              <span>手机号</span>
            </div>
          </div>
        </div>

        <div class="bottom-agree">
          <label class="agree-checkbox">
            <span class="check-box checked">
              <span class="check-mark">✓</span>
            </span>
            <span class="agree-text">
              我已阅读并同意
              <a href="#" @click.prevent="showTerms('service')" class="link">《服务条款》</a>
              和
              <a href="#" @click.prevent="showTerms('privacy')" class="link">《隐私协议》</a>
            </span>
          </label>
        </div>
      </div>

      <!-- ===================== -->
      <!-- 阶段3：手机号登录     -->
      <!-- ===================== -->
      <div v-if="phase === 'phone'" class="phase-phone">
        <div class="comm-logo" style="margin-bottom:24px">
          <div class="logo-icon">🏘</div>
          <div class="logo-text">邻盟</div>
          <div class="logo-sub">社区工作者登录</div>
        </div>

        <div class="phone-form">
          <div class="form-item">
            <div class="phone-input-wrap">
              <span class="country-code">+86</span>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="请输入手机号"
                maxlength="11"
                class="phone-input"
              />
            </div>
          </div>

          <div class="form-item">
            <div class="code-input-wrap">
              <input
                v-model="form.code"
                type="text"
                placeholder="请输入验证码"
                maxlength="6"
                inputmode="numeric"
                class="code-input"
              />
              <button
                class="btn-send-code"
                :disabled="codeCountdown > 0 || !isPhoneValid"
                @click="sendCode"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>

          <!-- 登录按钮 -->
          <button
            class="btn-phone-login"
            :disabled="!form.phone || form.code.length < 4 || submitting"
            @click="phoneLogin"
          >
            {{ submitting ? '登录中...' : '登录' }}
          </button>
        </div>

        <!-- 底部链接 -->
        <div class="phone-bottom-links">
          <div class="link-left" @click="router.push('/register/community')">
            没有账号？<span class="link">立即注册</span>
          </div>
          <div class="link-right" @click="phase = 'wechat'">
            ← 返回微信登录
          </div>
        </div>
      </div>

    </div><!-- /comm-login-body -->

    <!-- ===================== -->
    <!-- 微信授权弹窗（非微信环境模拟登录） -->
    <!-- ===================== -->
    <div v-if="showAuthDialog" class="auth-overlay" @click.self="onAuthDeny">
      <div class="auth-dialog">
        <div class="auth-header">
          <div class="auth-logo">🏘</div>
          <div class="auth-app-name">邻盟 申请使用</div>
        </div>
        <div class="auth-request-title">你的昵称、头像</div>
        <div class="auth-user-info">
          <div class="auth-avatar-placeholder">🏘</div>
          <div class="auth-username">微信用户</div>
        </div>
        <div class="auth-btns">
          <button class="auth-btn-allow" @click="onAuthAllow" :disabled="authLoading">
            {{ authLoading ? '授权中...' : '允许' }}
          </button>
          <button class="auth-btn-deny" @click="onAuthDeny">拒绝</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// ============ 阶段控制 ============
const phase = ref('agree')          // 'agree' | 'wechat' | 'phone'
const agreedTerms = ref(false)
const showAuthDialog = ref(false)
const authLoading = ref(false)
const submitting = ref(false)
const codeCountdown = ref(0)
let countdownTimer = null

const form = ref({
  phone: '',
  code: ''
})

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(form.value.phone))

// ============ 阶段切换 ============
function onAgree() {
  agreedTerms.value = true
  phase.value = 'wechat'
}

function switchToPhone() {
  phase.value = 'phone'
}

// ============ PC 微信扫码登录 ============
function onWebsiteLogin() {
  const params = new URLSearchParams({
    userType: 'community',
    redirect: window.location.origin + '/community'
  })
  window.location.href = `/api/wechat/website-auth?${params.toString()}`
}

// ============ 微信登录逻辑 ============
const WX_APPID = 'wxa382e1c9fb93780e'
const WX_REDIRECT = encodeURIComponent('https://3qall.com/wechat-login-community?from=community')

function onWechatLogin() {
  const ua = navigator.userAgent.toLowerCase()
  const isWechat = ua.includes('micromessenger')
  if (isWechat) {
    doOAuthRedirect()
  } else {
    showAuthDialog.value = true
  }
}

function doOAuthRedirect() {
  window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WX_APPID}&redirect_uri=${WX_REDIRECT}&response_type=code&scope=snsapi_userinfo&state=community#wechat_redirect`
}

function onAuthAllow() {
  authLoading.value = true
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('micromessenger')) {
    doOAuthRedirect()
  } else {
    // 非微信环境：关闭弹窗并切换到手机号登录
    showAuthDialog.value = false
    phase.value = 'phone'
    ElMessage.info('请在微信客户端中使用微信登录，或使用手机号登录')
  }
}

async function mockLogin() {
  try {
    const res = await fetch('/api/community/wechat/mock-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openid: 'mock_comm_dev', nickname: '社区用户', avatar: '' })
    }).then(r => r.json())
    if (res.code === 0 || res.code === 200) {
      const data = res.data || res
      localStorage.setItem('community_token', data.token)
      localStorage.setItem('community_info', JSON.stringify(data))
      showAuthDialog.value = false
      ElMessage.success('登录成功')
      router.push('/community')
    } else {
      ElMessage.error(res.msg || '登录失败')
    }
  } catch {
    ElMessage.error('登录失败，请重试')
  } finally {
    authLoading.value = false
  }
}

function onAuthDeny() {
  showAuthDialog.value = false
}

// ============ 手机号登录逻辑 ============
async function sendCode() {
  if (!isPhoneValid.value) return
  try {
    const response = await fetch('/api/public/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.value.phone, type: 'login' })
    })
    const res = await response.json()
    const msg = res.msg || res.message || '发送失败'
    // 模拟模式自动填入
    if (res.code_value) {
      form.value.code = res.code_value
      ElMessage.success(`[模拟] 验证码已自动填充: ${res.code_value}`)
    }
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('验证码已发送')
      codeCountdown.value = 60
      countdownTimer = setInterval(() => {
        codeCountdown.value--
        if (codeCountdown.value <= 0) clearInterval(countdownTimer)
      }, 1000)
    } else if (response.status === 404 && msg.includes('尚未注册')) {
      ElMessageBox.confirm('该手机号尚未注册，是否前往注册？', '提示', {
        confirmButtonText: '去注册',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        router.push('/register/community')
      }).catch(() => {})
    } else {
      ElMessage.error(msg)
    }
  } catch {
    ElMessage.error('发送失败，请稍后重试')
  }
}

async function phoneLogin() {
  if (submitting.value) return
  if (!isPhoneValid.value) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (form.value.code.length < 4) {
    ElMessage.warning('请输入验证码')
    return
  }
  submitting.value = true
  try {
    const res = await fetch('/api/community/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.value.phone, code: form.value.code })
    }).then(r => r.json())
    if (res.code === 0 || res.code === 200) {
      const data = res.data || res
      localStorage.setItem('community_token', data.token)
      localStorage.setItem('community_info', JSON.stringify(data.community || data))

      // 如果有微信绑定信息（扫码后未绑定用户），后台绑定
      const bindInfo = window.__wechat_bind_info
      if (bindInfo && data.token) {
        try {
          await fetch('/api/wechat/bind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              openid: bindInfo.openid,
              unionid: bindInfo.unionid || '',
              user_type: bindInfo.userType || 'community',
              phone: form.value.phone,
              userId: data.community?.id || data.id
            })
          })
          delete window.__wechat_bind_info
        } catch (e) {
          console.warn('微信绑定失败:', e)
        }
      }

      ElMessage.success('登录成功')
      router.push('/community')
    } else {
      ElMessage.error(res.msg || '登录失败')
    }
  } catch {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function showTerms(type) {
  ElMessage.info(type === 'service' ? '服务条款页面开发中' : '隐私协议页面开发中')
}

onMounted(() => {
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
})

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
/* ===== 整体布局 ===== */
.comm-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #26a269 0%, #1a7a4c 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.comm-login-body {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px;
  box-shadow: 0 24px 60px rgba(0,0,0,.2);
}

/* ===== 品牌标识 ===== */
.comm-logo {
  text-align: center;
  margin-bottom: 32px;
}
.logo-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}
.logo-sub {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

/* ===== 阶段1：协议页 ===== */
.phase-agree .agree-hint {
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-bottom: 24px;
}

/* ===== 同意按钮 ===== */
.btn-agree {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #26a269, #1a7a4c);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 2px;
  margin-bottom: 32px;
  transition: all .2s;
}
.btn-agree:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(38,162,105,.4); }

/* ===== 阶段2：微信登录页 ===== */
.phase-wechat .comm-logo { margin-bottom: 28px; }

.btn-wechat-login {
  width: 100%;
  height: 48px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  transition: all .2s;
}
.btn-wechat-login:hover { background: #06ad56; transform: translateY(-1px); }

.wechat-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 28px;
}

/* ===== 其他登录方式 ===== */
.other-login-section { margin-bottom: 20px; }
.divider-line {
  display: flex;
  align-items: center;
  gap: 0;
  color: #ccc;
  font-size: 12px;
  margin-bottom: 16px;
}
.divider-line::before, .divider-line::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8e8;
}
.divider-line span { padding: 0 12px; color: #bbb; white-space: nowrap; }
.other-login-icons {
  display: flex;
  justify-content: center;
  gap: 32px;
}
.other-login-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.other-login-item span { font-size: 12px; color: #666; }
.other-icon {
  width: 44px;
  height: 44px;
  border: 1.5px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #fff;
  transition: border-color .2s;
}
.other-icon:hover { border-color: #26a269; }
.other-icon.wechat-icon:hover { border-color: #07c160; background: #f0faf4; }

/* ===== 底部协议勾选 ===== */
.bottom-agree {
  width: 100%;
  display: flex;
  justify-content: center;
}
.agree-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
}
.agree-checkbox input[type="checkbox"] { display: none; }
.check-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #ccc;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s;
  background: #fff;
}
.check-box.checked { background: #26a269; border-color: #26a269; }
.check-mark { color: #fff; font-size: 11px; font-weight: 700; }
.agree-text { font-size: 12px; color: #888; line-height: 1.5; }
.link { color: #26a269; text-decoration: none; }

/* ===== 阶段3：手机号登录 ===== */
.phase-phone .comm-logo { margin-bottom: 20px; }
.phone-form { width: 100%; }
.form-item { margin-bottom: 14px; }
.phone-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  height: 46px;
}
.country-code {
  padding: 0 12px;
  font-size: 15px;
  color: #333;
  border-right: 1px solid #ddd;
  height: 100%;
  display: flex;
  align-items: center;
  background: #f9f9f9;
  white-space: nowrap;
}
.phone-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 14px;
  font-size: 15px;
  color: #333;
  font-family: inherit;
}
.code-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.code-input {
  flex: 1;
  height: 46px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 15px;
  outline: none;
  font-family: inherit;
}
.phone-input:focus, .code-input:focus { border-color: #26a269; }
.btn-send-code {
  height: 46px;
  padding: 0 16px;
  background: #fff;
  border: 1.5px solid #26a269;
  border-radius: 10px;
  color: #26a269;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  min-width: 100px;
  transition: all .2s;
  font-family: inherit;
}
.btn-send-code:hover:not(:disabled) { background: #26a269; color: #fff; }
.btn-send-code:disabled { border-color: #ccc; color: #ccc; cursor: not-allowed; }
.btn-phone-login {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #26a269, #1a7a4c);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  transition: all .2s;
  font-family: inherit;
}
.btn-phone-login:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(38,162,105,.4); }
.btn-phone-login:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.phone-bottom-links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-bottom: 8px;
  font-size: 13px;
}
.link-left { color: #666; cursor: pointer; }
.link-right { color: #26a269; cursor: pointer; }
.link-right:hover { text-decoration: underline; }

/* ===== 微信授权弹窗 ===== */
.auth-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.auth-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 24px 20px 20px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 8px 40px rgba(0,0,0,.18);
}
.auth-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.auth-logo { font-size: 28px; }
.auth-app-name { font-size: 14px; color: #666; }
.auth-request-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}
.auth-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  margin-bottom: 24px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.auth-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #26a269, #1a7a4c);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}
.auth-username { font-size: 16px; color: #333; font-weight: 500; }
.auth-btns { display: flex; gap: 12px; }
.auth-btn-allow {
  flex: 1;
  height: 44px;
  background: #26a269;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s;
  font-family: inherit;
}
.auth-btn-allow:hover { background: #1a7a4c; }
.auth-btn-deny {
  flex: 1;
  height: 44px;
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background .2s;
  font-family: inherit;
}
.auth-btn-deny:hover { background: #f5f5f5; }

/* ===== 响应式 ===== */
@media (max-width: 480px) {
  .comm-login-body { padding: 32px 20px; border-radius: 16px; }
  .btn-send-code { min-width: 88px; font-size: 13px; padding: 0 10px; }
}
</style>
