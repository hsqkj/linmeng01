<template>
  <div class="login-wrap comm-bg">
    <!-- 品牌 -->
    <div class="login-brand">
      <div class="login-brand-logo">🏘 邻盟</div>
      <div class="login-brand-sub">社区资源智能匹配助手</div>
    </div>
    <div class="login-back">
      <a href="#" @click.prevent="goBack">← 返回选择</a>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <div class="icon">🏘</div>
        <h2>社区工作者登录</h2>
        <p>邻盟 · 社区资源智能匹配</p>
      </div>

      <!-- 登录方式切换 -->
      <div class="login-tabs">
        <button :class="['tab-btn', loginMode === 'code' ? 'active' : '']" @click="loginMode = 'code'">验证码登录</button>
        <button :class="['tab-btn', loginMode === 'password' ? 'active' : '']" @click="loginMode = 'password'">密码登录</button>
        <button :class="['tab-btn', loginMode === 'wechat' ? 'active' : '']" @click="switchToWechat">微信登录</button>
      </div>

      <!-- 手机登录表单 -->
      <template v-if="loginMode !== 'wechat'">
        <SmsCodeInput
          v-model="form.code"
          v-model:phone="form.phone"
          codeType="login"
          theme="green"
          :customSend="sendCode"
          @enter="login"
          v-if="loginMode === 'code'"
        />

        <!-- 密码模式 -->
        <div v-if="loginMode === 'password'" class="form-group">
          <label>登录密码</label>
          <input class="form-control" v-model="form.password" type="password" placeholder="请输入登录密码" />
        </div>

        <button class="btn-login comm" @click="login" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </template>

      <!-- 微信登录区域 -->
      <template v-else>
        <div class="wechat-login-area">
          <div class="wechat-icon-wrap">
            <span class="wechat-icon">💬</span>
          </div>

          <!-- 首次登录：需要绑定 -->
          <template v-if="!wechatBound">
            <p class="wechat-tip">首次登录需要绑定手机号</p>
            <SmsCodeInput
              v-model="form.code"
              v-model:phone="form.phone"
              codeType="bind"
              theme="green"
              :customSend="sendCode"
              @enter="wechatBindAndLogin"
            />
            <button class="btn-login comm" @click="wechatBindAndLogin" :disabled="loading">
              {{ loading ? '登录中...' : '绑定并登录' }}
            </button>
          </template>

          <!-- 已绑定：直接自动登录 -->
          <template v-else>
            <p class="wechat-tip">欢迎回来，正在登录...</p>
            <div class="wechat-bound-info">
              <span class="wechat-avatar">💬</span>
              <span class="wechat-nickname">{{ storedNickname || '微信用户' }}</span>
            </div>
          </template>
        </div>
      </template>

      <div class="login-divider">
        <div class="login-tips">
          <div class="login-tip">
            <i>🔗</i>
            <span>智能匹配</span>
          </div>
          <div class="login-tip">
            <i>✅</i>
            <span>高效对接</span>
          </div>
          <div class="login-tip">
            <i>🎁</i>
            <span>撮合奖励</span>
          </div>
        </div>
      </div>

      <div class="login-footer">
        还没有账号？<a class="reg-link" @click="$router.push('/register/community')">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import { communityLogin } from '@/api/community'
import { sendSms } from '@/api/public'
import { wechatBindLogin } from '@/api/public'

const router = useRouter()
const route = useRoute()

const loginMode = ref('code') // 'code' | 'password' | 'wechat'

const form = reactive({
  phone: '',
  code: '',
  password: ''
})

const loading = ref(false)

// 微信登录状态
const wechatBound = ref(false)
const storedOpenid = ref('')
const storedNickname = ref('')
const storedUserId = ref('')
const storedToken = ref('')

// 检测微信登录状态
onMounted(() => {
  const openid = localStorage.getItem('wechat_openid')
  const nickname = localStorage.getItem('wechat_nickname')
  const userId = localStorage.getItem('wechat_user_id')
  const token = localStorage.getItem('wechat_token')

  if (openid && token) {
    storedOpenid.value = openid
    storedNickname.value = nickname || ''
    storedUserId.value = userId || ''
    storedToken.value = token

    // 如果是微信登录页面且已绑定，自动登录
    if (loginMode.value === 'wechat' || route.path.includes('wechat')) {
      wechatBound.value = true
      autoWechatLogin()
    }
  }
})

// 切换到微信登录
const switchToWechat = () => {
  loginMode.value = 'wechat'

  // 检查是否已绑定
  const openid = localStorage.getItem('wechat_openid')
  const token = localStorage.getItem('wechat_token')

  if (openid && token) {
    wechatBound.value = true
    // 触发自动登录
    setTimeout(() => autoWechatLogin(), 100)
  } else {
    wechatBound.value = false
  }
}

// 自动微信登录
const autoWechatLogin = async () => {
  const token = storedToken.value
  const userId = storedUserId.value
  const openid = storedOpenid.value

  if (!token) {
    ElMessage.warning('请先绑定微信')
    return
  }

  loading.value = true
  try {
    localStorage.setItem('community_token', token)
    localStorage.setItem('community_info', JSON.stringify({ id: userId, openid }))
    ElMessage.success('登录成功')
    // 直接跳转首页
    location.href = '/#/community'
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
    wechatBound.value = false
  } finally {
    loading.value = false
  }
}

// 微信绑定并登录
const wechatBindAndLogin = async () => {
  if (!form.phone) {
    ElMessage.warning('请填写手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!form.code) {
    ElMessage.warning('请填写验证码')
    return
  }

  const openid = localStorage.getItem('wechat_openid')
  if (!openid) {
    ElMessage.warning('微信授权失败，请重新点击微信登录')
    return
  }

  loading.value = true
  try {
    const res = await wechatBindLogin({
      phone: form.phone,
      code: form.code,
      openid: openid,
      userType: 'community'
    })

    // 保存登录信息
    localStorage.setItem('community_token', res.data.token)
    localStorage.setItem('community_info', JSON.stringify(res.data.community))
    localStorage.setItem('wechat_user_id', res.data.community.id)
    localStorage.setItem('wechat_token', res.data.token)

    ElMessage.success('绑定成功，欢迎使用！')
    location.href = '/#/community'
  } catch (e) {
    ElMessage.error(e.message || '绑定失败')
  } finally {
    loading.value = false
  }
}

// 发送验证码（供SmsCodeInput组件调用）
const sendCode = async ({ phone, type }) => {
  await sendSms({ phone, type })
  ElMessage.success('验证码已发送')
}

const login = async () => {
  if (!form.phone) {
    ElMessage.warning('请填写手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的手机号（11位，以1开头）')
    return
  }
  if (loginMode.value === 'code' && !form.code) {
    ElMessage.warning('请填写验证码')
    return
  }
  if (loginMode.value === 'password' && !form.password) {
    ElMessage.warning('请填写登录密码')
    return
  }
  loading.value = true
  try {
    const payload = loginMode.value === 'code'
      ? { phone: form.phone, code: form.code }
      : { phone: form.phone, password: form.password }
    const res = await communityLogin(payload)
    localStorage.setItem('community_token', res.data.token)
    localStorage.setItem('community_info', JSON.stringify(res.data.community))
    ElMessage.success('登录成功')
    router.push('/community')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => { router.push('/') }
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}
.comm-bg { background: linear-gradient(135deg, #26a269, #1a7a4c); }

.login-brand { position: absolute; top: 24px; left: 32px; z-index: 2; }
.login-brand-logo { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.login-brand-sub { font-size: 12px; color: rgba(255,255,255,.75); margin-top: 2px; }
.login-back { position: absolute; top: 28px; right: 32px; z-index: 2; }
.login-back a { color: rgba(255,255,255,.85); text-decoration: none; font-size: 14px; }
.login-back a:hover { color: #fff; }

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 60px rgba(0,0,0,.15);
  position: relative;
  z-index: 1;
}

.login-header { text-align: center; margin-bottom: 32px; }
.login-header .icon { font-size: 44px; margin-bottom: 12px; display: block; }
.login-header h2 { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
.login-header p { color: #666; font-size: 14px; }

.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 7px; }
.form-control {
  width: 100%; padding: 12px 14px;
  border: 2px solid #e0e0e0; border-radius: 10px;
  font-size: 15px; outline: none; transition: border-color .2s;
  background: #fff; font-family: inherit;
}
.form-control:focus { border-color: #26a269; }
.input-addon { display: flex; }
.input-addon .addon {
  padding: 12px 14px; background: #f5f5f5;
  border: 2px solid #e0e0e0; border-right: none;
  border-radius: 10px 0 0 10px; font-size: 15px; color: #555; white-space: nowrap;
}
.input-addon .form-control { border-radius: 0 10px 10px 0; }
.code-btn {
  padding: 10px 16px; background: #e8f7ed; color: #26a269;
  border: 2px solid #26a269; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all .2s; font-family: inherit;
}
.code-btn:hover { background: #26a269; color: #fff; }
.code-btn:disabled { opacity: .6; cursor: not-allowed; }

.btn-login {
  width: 100%; padding: 14px; border: none; border-radius: 10px;
  font-size: 16px; font-weight: 600; cursor: pointer; color: #fff;
  transition: all .2s; margin-top: 6px; font-family: inherit;
}
.btn-login.comm { background: linear-gradient(135deg, #26a269, #1a7a4c); }
.btn-login:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
.btn-login:disabled { opacity: .7; cursor: not-allowed; transform: none; }

.login-divider { border-top: 1px solid #eee; margin-top: 24px; padding-top: 20px; }
.login-tabs {
  display: flex; gap: 0; margin-bottom: 24px;
  border: 2px solid #e0e0e0; border-radius: 10px; overflow: hidden;
}
.tab-btn {
  flex: 1; padding: 10px 0; border: none; background: #fff;
  font-size: 14px; font-weight: 500; color: #666; cursor: pointer;
  transition: all .2s; font-family: inherit;
}
.tab-btn.active { background: #26a269; color: #fff; font-weight: 600; }
.tab-btn:not(.active):hover { background: #f5f5f5; }
.login-tips { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; text-align: center; }
.login-tip { padding: 10px 6px; background: #f9f9f9; border-radius: 10px; }
.login-tip i { font-size: 22px; margin-bottom: 4px; display: block; font-style: normal; }
.login-tip span { display: block; font-size: 12px; font-weight: 600; color: #333; }
.login-footer { text-align: center; margin-top: 18px; font-size: 13px; color: #666; }
.reg-link { color: #26a269; font-weight: 600; cursor: pointer; text-decoration: none; margin-left: 4px; }
.reg-link:hover { text-decoration: underline; }

/* 微信登录区域 */
.wechat-login-area { text-align: center; padding: 20px 0; }
.wechat-icon-wrap { margin-bottom: 16px; }
.wechat-icon { font-size: 48px; }
.wechat-tip { color: #666; font-size: 14px; margin-bottom: 20px; }
.wechat-warn { color: #e6a23c; font-size: 13px; margin-top: 12px; }
.wechat-bound-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f5f9f6;
  border-radius: 12px;
  margin-top: 12px;
}
.wechat-avatar { font-size: 32px; }
.wechat-nickname { font-size: 16px; color: #333; font-weight: 500; }

@media (max-width: 480px) {
  .login-card { padding: 32px 20px; border-radius: 16px; }
  .login-brand { top: 16px; left: 16px; }
  .login-back { top: 20px; right: 16px; }
  .login-tabs { flex-wrap: wrap; }
  .tab-btn { flex: none; width: 33.33%; }
}
</style>
