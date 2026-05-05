<template>
  <div class="wechat-login-page">
    <!-- 已登录状态 -->
    <div v-if="isLoggedIn" class="logged-in">
      <div class="avatar">
        <img :src="userInfo.avatar || defaultAvatar" />
      </div>
      <div class="name">{{ userInfo.name }}</div>
      <div class="tip">已通过微信授权登录</div>
      <button class="btn-primary" @click="goHome">进入首页</button>
      <button class="btn-link" @click="handleLogout">退出登录</button>
    </div>

    <!-- 登录中 -->
    <div v-else-if="loading" class="loading">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <!-- 需要绑定手机号 -->
    <div v-else-if="needBindPhone" class="bind-phone">
      <div class="avatar">
        <img :src="wechatInfo.avatar || defaultAvatar" />
      </div>
      <div class="name">{{ wechatInfo.nickname || '微信用户' }}</div>
      <div class="tip">请绑定手机号以完成登录</div>

      <div class="form">
        <div class="form-item">
          <select v-model="bindForm.userType" class="form-select">
            <option value="community">社区用户</option>
            <option value="merchant">商家用户</option>
            <option value="ambassador">大使用户</option>
          </select>
        </div>
        <div class="form-item">
          <input
            v-model="bindForm.phone"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
            class="form-input"
          />
        </div>
        <div class="form-item code-item">
          <input
            v-model="bindForm.code"
            type="text"
            maxlength="6"
            placeholder="请输入验证码"
            class="form-input"
          />
          <button class="btn-code" :disabled="codeSending" @click="sendCode">
            {{ codeSending ? `${codeCountdown}s` : '获取验证码' }}
          </button>
        </div>
        <button class="btn-primary" @click="handleBindPhone">绑定并登录</button>
      </div>
    </div>

    <!-- 登录失败 -->
    <div v-else class="login-failed">
      <div class="icon">⚠️</div>
      <div class="tip">{{ errorMsg }}</div>
      <button class="btn-primary" @click="retryAuth">重新授权</button>
      <div class="divider"><span>或</span></div>
      <button class="btn-secondary" @click="goSmsLogin">使用手机号登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
const defaultAvatar = '/default-avatar.png'

const route = useRoute()
const router = useRouter()

const isLoggedIn = ref(false)
const loading = ref(true)
const loadingText = ref('微信授权中...')
const needBindPhone = ref(false)
const errorMsg = ref('')
const userInfo = ref({})
const wechatInfo = ref({})

const bindForm = ref({
  userType: 'community',
  phone: '',
  code: ''
})
const codeSending = ref(false)
const codeCountdown = ref(0)

// API 基础地址
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * 初始化：判断是否在微信内，发起授权
 */
onMounted(() => {
  // 优先检查 URL 中是否有小程序传来的 token（场景A：小程序 webview）
  const urlToken = route.query.token
  const urlUserType = route.query.userType
  if (urlToken) {
    // 小程序 webview 传过来的 token，验证后直接登录
    handleMiniProgramToken(urlToken, urlUserType)
    return
  }

  // 检查本地是否有 token
  const localToken = localStorage.getItem('token')
  if (localToken) {
    checkLoginStatus(localToken)
    return
  }

  // 判断是否在微信内
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)
  if (!isWechat) {
    // 非微信内，跳转到手机号登录
    loading.value = false
    errorMsg.value = '请在微信中打开以使用微信授权登录'
    return
  }

  // 检查 URL 中是否有 code（微信回调带回，场景B：微信内置浏览器）
  const code = route.query.code
  if (code) {
    // 用 code 换登录信息
    handleWechatAuth(code)
  } else {
    // 没有 code，发起微信授权
    redirectToWechatAuth()
  }
})

/**
 * 场景A：小程序 webview 传过来的 token，静默登录
 */
async function handleMiniProgramToken(token, userType) {
  loading.value = true
  loadingText.value = '身份验证中...'

  try {
    const res = await axios.post(`${API_BASE}/auth/mini-login`, { token, userType })
    if (res.data.code === 0) {
      const data = res.data.data
      // 保存登录信息
      localStorage.setItem('token', data.token)
      localStorage.setItem('userType', data.userType)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('userName', data.userName)

      userInfo.value = {
        name: data.userName,
        avatar: data.avatar || defaultAvatar,
        phone: data.phone
      }
      isLoggedIn.value = true
      loading.value = false
    } else {
      throw new Error(res.data.msg || '身份验证失败')
    }
  } catch (err) {
    // token 失效，尝试微信授权
    console.warn('小程序 token 验证失败，尝试微信授权:', err.message)
    redirectToWechatAuth()
  }
}

/**
 * 发起微信网页授权（跳转到微信授权页）
 */
function redirectToWechatAuth() {
  const currentUrl = window.location.href.split('#')[0]  // 去掉 hash
  const appid = 'wxa382e1c9fb93780e'                   // 微信公众号 AppID
  const redirectUri = encodeURIComponent(currentUrl)
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=linmeng#wechat_redirect`

  window.location.href = authUrl
}

/**
 * 用微信返回的 code 请求后端，完成登录
 */
async function handleWechatAuth(code) {
  loading.value = true
  loadingText.value = '正在登录...'

  try {
    const res = await axios.post(`${API_BASE}/wechat/h5-auth`, { code })

    if (res.data.code === 0) {
      const data = res.data.data

      if (data.isNew) {
        // 新用户，需要绑定手机号
        needBindPhone.value = true
        wechatInfo.value = {
          openid: data.openid,
          unionid: data.unionid,
          nickname: data.nickname,
          avatar: data.avatar
        }
        loading.value = false
      } else {
        // 已绑定，直接登录
        localStorage.setItem('token', data.token)
        localStorage.setItem('userType', data.userType)
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('userName', data.userName)

        userInfo.value = {
          name: data.userName,
          avatar: data.avatar,
          phone: data.phone
        }
        isLoggedIn.value = true
        loading.value = false
      }
    } else {
      throw new Error(res.data.msg || '登录失败')
    }
  } catch (err) {
    loading.value = false
    errorMsg.value = err.message || '微信授权失败，请重试'
  }
}

/**
 * 发送验证码
 */
async function sendCode() {
  if (!bindForm.value.phone || !/^1[3-9]\d{9}$/.test(bindForm.value.phone)) {
    alert('请输入正确的手机号')
    return
  }

  codeSending.value = true
  codeCountdown.value = 60

  try {
    await axios.post(`${API_BASE}/sms/send`, { phone: bindForm.value.phone })
    alert('验证码已发送')
  } catch {
    alert('验证码发送失败')
  }

  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(timer)
      codeSending.value = false
    }
  }, 1000)
}

/**
 * 绑定手机号
 */
async function handleBindPhone() {
  const { userType, phone, code } = bindForm.value
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    alert('请输入正确的手机号')
    return
  }
  if (!code) {
    alert('请输入验证码')
    return
  }

  loading.value = true
  loadingText.value = '绑定中...'

  try {
    const res = await axios.post(`${API_BASE}/wechat/h5-bind-phone`, {
      openid: wechatInfo.value.openid,
      unionid: wechatInfo.value.unionid,
      phone,
      code,
      userType
    })

    if (res.data.code === 0) {
      const data = res.data.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('userType', data.userType)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('userName', data.userName)

      userInfo.value = {
        name: data.userName,
        avatar: wechatInfo.value.avatar,
        phone
      }
      isLoggedIn.value = true
      needBindPhone.value = false
    } else {
      throw new Error(res.data.msg || '绑定失败')
    }
  } catch (err) {
    alert(err.message || '绑定失败')
  } finally {
    loading.value = false
  }
}

/**
 * 检查本地 token 是否有效
 */
async function checkLoginStatus(token) {
  try {
    // 简单判断：解码 token 是否过期（这里用简单逻辑，实际应调后端验证接口）
    const str = atob(token)
    const parts = str.split(':')
    const timestamp = parseInt(parts[3])
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      // token 过期，清除重新授权
      localStorage.clear()
      redirectToWechatAuth()
      return
    }

    // token 有效
    userInfo.value = {
      name: localStorage.getItem('userName') || '用户',
      avatar: defaultAvatar
    }
    isLoggedIn.value = true
    loading.value = false
  } catch {
    localStorage.clear()
    redirectToWechatAuth()
  }
}

/**
 * 进入首页
 */
function goHome() {
  const userType = localStorage.getItem('userType') || 'community'
  const routes = {
    community: '/community/home',
    merchant: '/merchant/home',
    ambassador: '/ambassador/home'
  }
  router.push(routes[userType] || '/')
}

/**
 * 退出登录
 */
function handleLogout() {
  localStorage.clear()
  isLoggedIn.value = false
  needBindPhone.value = false
  wechatInfo.value = {}
  redirectToWechatAuth()
}

/**
 * 重新授权
 */
function retryAuth() {
  redirectToWechatAuth()
}

/**
 * 跳转到手机号登录
 */
function goSmsLogin() {
  router.push('/login')
}
</script>

<style scoped>
.wechat-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.logged-in,
.bind-phone,
.login-failed,
.loading {
  background: #fff;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #667eea;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.tip {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.loading {
  padding: 60px 30px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form {
  text-align: left;
}

.form-item {
  margin-bottom: 16px;
}

.form-input,
.form-select {
  width: 100%;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.code-item {
  display: flex;
  gap: 12px;
}

.code-item .form-input {
  flex: 1;
}

.btn-code {
  width: 110px;
  height: 44px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.btn-code:disabled {
  background: #ccc;
}

.btn-primary {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.btn-secondary {
  width: 100%;
  height: 44px;
  background: #fff;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.btn-link {
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  margin-top: 16px;
  cursor: pointer;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #ccc;
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #eee;
}

.divider span {
  padding: 0 12px;
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
