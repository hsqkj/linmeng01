<template>
  <div class="sso-callback">
    <div class="loading-box">
      <div class="spinner"></div>
      <p>正在登录，请稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const token = route.query.token
  const userType = route.query.userType || 'community'
  const redirect = route.query.redirect || `/${userType}`

  if (!token) {
    // 无 token，直接跳到目标页（未登录状态）
    router.replace(redirect)
    return
  }

  try {
    // 调用后端 SSO 接口，把 ssoToken 换成邻盟 JWT
    const res = await axios.post('/api/auth/sso-login', {
      token,
      userType
    })

    if (res.data && res.data.code === 0 && res.data.data && res.data.data.token) {
      // 存储登录态
      const tokenKey = `${res.data.data.userType}_token`
      localStorage.setItem(tokenKey, res.data.data.token)
      localStorage.setItem('userType', res.data.data.userType)

      // 同时写 cookie（兼容）
      document.cookie = `${tokenKey}=${encodeURIComponent(res.data.data.token)};path=/;max-age=${7*24*3600}`
      document.cookie = `sso_user_type=${res.data.data.userType};path=/;max-age=${7*24*3600}`

      // 跳转到目标页
      router.replace(redirect)
    } else {
      throw new Error(res.data?.msg || '登录失败')
    }
  } catch (err) {
    console.error('[SSO] 登录失败:', err)
    // 登录失败也跳转到目标页，让用户自己处理
    router.replace(redirect)
  }
})
</script>

<style scoped>
.sso-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
.loading-box {
  text-align: center;
  padding: 40px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
p {
  color: #666;
  font-size: 14px;
}
</style>
