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
        <div class="role-hint">绑定为 {{ roleConfig[bindForm.userType]?.label }}</div>
        <SmsCodeInput
          v-model="bindForm.code"
          v-model:phone="bindForm.phone"
          codeType="bind"
          :theme="roleConfig[bindForm.userType]?.theme || 'green'"
          :customSend="sendCode"
          @enter="handleBindPhone"
          @phone-error="(msg) => ElMessage.warning(msg)"
          @send-error="(err) => ElMessage.error(err?.message || '发送失败')"
        />
        <button class="btn-primary" @click="handleBindPhone">绑定并登录</button>
      </div>
    </div>

    <!-- 登录失败 -->
    <div v-else class="login-failed">
      <div class="icon">⚠️</div>
      <div class="tip">{{ errorMsg }}</div>
      <button class="btn-primary" @click="retryAuth">重新授权</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import { sendSms } from '@/api/public'
import { getProfile } from '@/api/community'

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

// 根据 URL 参数确定用户类型，默认 community
const userTypeFromUrl = ref('community')

const bindForm = ref({
  userType: 'community',
  phone: '',
  code: ''
})

// 角色配置（用于显示和跳转）
const roleConfig = {
  community: { label: '社区用户', homePath: '/community/home', theme: 'green' },
  merchant: { label: '商家用户', homePath: '/merchant/home', theme: 'blue' },
  ambassador: { label: '大使用户', homePath: '/ambassador/home', theme: 'red' }
}

// 监听登录状态，自动跳转首页
watch(isLoggedIn, (newVal) => {
  if (newVal) {
    goHome()
  }
})

/**
 * 初始化：判断是否在微信内，发起授权
 */
// 从 cookie 读取指定 key
function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  } catch { return '' }
}

onMounted(() => {
  // 优先检查 URL 中是否有小程序传来的 token（场景A：小程序 webview）
  const urlToken = route.query.token
  const urlUserType = route.query.userType

  // 获取 URL 中的 userType 参数
  const validTypes = ['community', 'merchant', 'ambassador']
  if (urlUserType && validTypes.includes(urlUserType)) {
    userTypeFromUrl.value = urlUserType
    bindForm.value.userType = urlUserType
    localStorage.setItem('userType', urlUserType)
  }

  if (urlToken) {
    // 小程序 webview 传过来的 token，验证后直接登录
    handleMiniProgramToken(urlToken, urlUserType)
    return
  }

  // 检查本地是否有 token（按端存储，优先 localStorage，兜底 cookie）
  const localUserType = localStorage.getItem('userType') || 'community'
  const tokenKey = `${localUserType}_token`
  let localToken = localStorage.getItem(tokenKey)
  if (!localToken) {
    // 兜底：cookie（SSO WebView 场景）
    localToken = getCookie(tokenKey)
    if (localToken) {
      // 同步到 localStorage，后续路由守卫能直接命中
      localStorage.setItem(tokenKey, localToken)
    }
  }
  if (localToken) {
    checkLoginStatus(localToken)
    return
  }

  // 判断是否在微信内（含小程序 webview 传参识别）
  const ua = navigator.userAgent
  const isMiniProgram = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'miniprogram'
  const isWechat = /MicroMessenger/i.test(ua) || isMiniProgram
  if (!isWechat) {
    loading.value = false
    errorMsg.value = '请在微信中打开以使用微信授权登录'
    return
  }

  // 检查 URL 中是否有 code（微信回调带回）
  // 注意：微信可能把 code 放在 # 前面或后面，需要都检查
  let code = route.query.code

  // 如果 route.query 中没有，检查 window.location.search（# 前面的参数）
  if (!code) {
    const searchParams = new URLSearchParams(window.location.search)
    code = searchParams.get('code')
  }

  if (code) {
    // 清除 URL 中的 code，保留当前路由路径
    const cleanUrl = window.location.pathname + window.location.hash
    window.history.replaceState(null, '', cleanUrl)
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
    // 优先使用 SSO 登录接口（JWT签名验证，更安全）
    const res = await request.post('/auth/sso-login', { token, userType })
    // request 拦截器已过滤：code 非 0/200 会走 catch
    const data = res.data
    // 统一存储：按端存储 token
    const tokenKey = `${data.userType}_token`
    localStorage.setItem(tokenKey, data.token)
    localStorage.setItem('userType', data.userType)
    localStorage.setItem('userId', String(data.userId))
    localStorage.setItem('userName', data.userName)

    userInfo.value = {
      name: data.userName,
      avatar: data.avatar || defaultAvatar,
      phone: data.phone
    }
    isLoggedIn.value = true
    loading.value = false
  } catch (err) {
    // SSO token 失效，尝试微信授权
    console.warn('小程序 token 验证失败，尝试微信授权:', err.message)
    redirectToWechatAuth()
  }
}

/**
 * 发起微信网页授权（跳转到微信授权页）
 * redirect_uri 指向带 hash 路由的 wechat-login 页
 * 回调后由 index.html 中的原生 JS 提取 code 并转发到正确路由
 */
function redirectToWechatAuth() {
  const state = route.query.state || localStorage.getItem('userType') || 'community'
  // 回调地址必须是不带 hash 的完整 URL（微信 OAuth 规范）
  // index.html 中的原生 JS 会提取 code 并转发到 /wechat-login-xxx
  const redirectUri = encodeURIComponent('https://3qall.com/wechat-callback')
  const appid = 'wxa382e1c9fb93780e'
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
  window.location.href = authUrl
}

/**
 * 用微信返回的 code 请求后端，完成登录
 */
async function handleWechatAuth(code) {
  loading.value = true
  loadingText.value = '正在登录...'

  try {
    const result = await request.post(`/wechat/h5-auth`, { code })

    if (result.code === 0 || result.code === 200) {
      const data = result.data

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
        // 已绑定，直接登录（按端存储 token）
        const tokenKey = `${data.userType}_token`
        localStorage.setItem(tokenKey, data.token)
        localStorage.setItem('userType', data.userType)
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('userName', data.userName)

        // 立即获取并保存 community_info，避免首页渲染时缺少用户信息
        if (data.userType === 'community') {
          try {
            const profileRes = await getProfile()
            localStorage.setItem('community_info', JSON.stringify(profileRes.data || {}))
          } catch {}
        }

        userInfo.value = {
          name: data.userName,
          avatar: data.avatar,
          phone: data.phone
        }
        isLoggedIn.value = true
        loading.value = false
      }
    } else {
      throw new Error(result.message || '登录失败')
    }
  } catch (err) {
    loading.value = false
    errorMsg.value = err.message || '微信授权失败，请重试'
  }
}

/**
 * 发送验证码（返回 Promise 给 SmsCodeInput 组件调用）
 */
async function sendCode({ phone } = {}) {
  const tel = phone || bindForm.value.phone
  if (!tel || !/^1[3-9]\d{9}$/.test(tel)) {
    return Promise.reject(new Error('请输入正确的手机号'))
  }

  try {
    await sendSms({ phone: tel, type: 'bind' })
    ElMessage.success('验证码已发送')
  } catch (err) {
    const msg = err.response?.data?.msg || err.message || '验证码发送失败'
    ElMessage.error(msg)
    return Promise.reject(new Error(msg))
  }
}

/**
 * 绑定手机号
 */
async function handleBindPhone() {
  const { userType, phone, code } = bindForm.value
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!code) {
    ElMessage.warning('请输入验证码')
    return
  }

  loading.value = true
  loadingText.value = '绑定中...'

  try {
    const res = await request.post(`/wechat/h5-bind-phone`, {
      openid: wechatInfo.value.openid,
      unionid: wechatInfo.value.unionid,
      phone,
      code,
      userType
    })

    if (res.code !== 0) {
      throw new Error(res.msg || res.message || '绑定失败')
    }

    const data = res.data
    // 按端存储 token
    const tokenKey = `${data.userType}_token`
    localStorage.setItem(tokenKey, data.token)
    localStorage.setItem('userType', data.userType)
    localStorage.setItem('userId', data.userId)
    localStorage.setItem('userName', data.userName)

    // 立即获取并保存 community_info
    if (data.userType === 'community') {
      try {
        const profileRes = await getProfile()
        localStorage.setItem('community_info', JSON.stringify(profileRes.data || {}))
      } catch {}
    }

    userInfo.value = {
      name: data.userName,
      avatar: wechatInfo.value.avatar,
      phone
    }
    isLoggedIn.value = true
    needBindPhone.value = false
  } catch (err) {
    loading.value = false
    ElMessage.error(err.response?.data?.msg || err.message || '绑定失败')
  }
}

/**
 * 检查本地 token 是否有效
 */
async function checkLoginStatus(token) {
  try {
    const res = await request.get(`/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.code === 200) {
      const data = res.data
      userInfo.value = {
        name: data.userName || '用户',
        avatar: data.avatar || defaultAvatar
      }
      isLoggedIn.value = true
      loading.value = false
    } else {
      throw new Error('token 无效')
    }
  } catch {
    // token 无效，清除并重新授权
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
    community: '/community',
    merchant: '/merchant',
    ambassador: '/ambassador'
  }
  router.push(routes[userType] || '/community/home')
}

/**
 * 重新授权
 */
function retryAuth() {
  redirectToWechatAuth()
}
</script>

<style scoped>
.wechat-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #26a269 0%, #1a7a4c 100%);
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
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #26a269;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
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
  border: 4px solid #e8f7ed;
  border-top: 4px solid #26a269;
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
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  outline: none;
}

.form-input:focus {
  border-color: #26a269;
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
  background: #e8f7ed;
  color: #26a269;
  border: 1.5px solid #26a269;
  border-radius: 10px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}

.btn-code:hover:not(:disabled) {
  background: #26a269;
  color: #fff;
}

.btn-code:disabled {
  background: #f5f5f5;
  border-color: #e0e0e0;
  color: #ccc;
}

/* 角色提示 */
.role-hint {
  text-align: center;
  font-size: 14px;
  color: #26a269;
  margin-bottom: 16px;
  padding: 8px 16px;
  background: #e8f7ed;
  border-radius: 20px;
  font-weight: 500;
}

.btn-primary {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #26a269 0%, #1a7a4c 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all .2s;
  font-family: inherit;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(38, 162, 105, 0.4);
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
