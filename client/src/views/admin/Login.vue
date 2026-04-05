<template>
  <div class="login-wrap admin-bg">
    <div class="login-brand">
      <div class="login-brand-logo">⚙️ 邻盟</div>
      <div class="login-brand-sub">平台管理后台</div>
    </div>
    <div class="login-back">
      <a href="#" @click.prevent="goBack">← 返回选择</a>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="icon">🛡️</div>
        <h2>管理员登录</h2>
        <p>邻盟 · 平台管理后台</p>
      </div>

      <div class="form-group">
        <label>用户名</label>
        <input class="form-control" v-model="form.username" placeholder="请输入用户名" @keyup.enter="login" />
      </div>

      <div class="form-group">
        <label>密码</label>
        <input class="form-control" v-model="form.password" placeholder="请输入密码" type="password" @keyup.enter="login" />
      </div>

      <button class="btn-login admin" @click="login" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <div class="login-test">测试账号：admin / admin123</div>

      <div class="login-footer">
        <a class="back-link" @click="goBack">← 返回角色选择</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin } from '@/api/admin'

const router = useRouter()
const form = reactive({ username: 'admin', password: 'admin123' })
const loading = ref(false)

const login = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await adminLogin({ username: form.username, password: form.password })
    localStorage.setItem('admin_token', res.data.token)
    localStorage.setItem('admin_info', JSON.stringify(res.data.admin))
    ElMessage.success('登录成功')
    router.push('/admin')
  } catch (e) {
    // 错误已在request拦截器中处理
  } finally {
    loading.value = false
  }
}
const goBack = () => { router.push('/') }
</script>

<style scoped>
.login-wrap {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; padding: 20px; position: relative;
}
.admin-bg { background: linear-gradient(135deg, #1a5fb4, #14407a); }
.login-brand { position: absolute; top: 24px; left: 32px; z-index: 2; }
.login-brand-logo { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.login-brand-sub { font-size: 12px; color: rgba(255,255,255,.75); margin-top: 2px; }
.login-back { position: absolute; top: 28px; right: 32px; z-index: 2; }
.login-back a { color: rgba(255,255,255,.85); text-decoration: none; font-size: 14px; }
.login-card {
  background: #fff; border-radius: 20px; padding: 48px 40px;
  width: 100%; max-width: 420px;
  box-shadow: 0 24px 60px rgba(0,0,0,.2); z-index: 1;
}
.login-header { text-align: center; margin-bottom: 32px; }
.login-header .icon { font-size: 44px; margin-bottom: 12px; display: block; }
.login-header h2 { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
.login-header p { color: #666; font-size: 14px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 7px; }
.form-control {
  width: 100%; padding: 12px 14px; border: 2px solid #e0e0e0;
  border-radius: 10px; font-size: 15px; outline: none;
  transition: border-color .2s; background: #fff; font-family: inherit;
}
.form-control:focus { border-color: #1a5fb4; }
.btn-login {
  width: 100%; padding: 14px; border: none; border-radius: 10px;
  font-size: 16px; font-weight: 600; cursor: pointer; color: #fff;
  transition: all .2s; margin-top: 6px; font-family: inherit;
}
.btn-login.admin { background: linear-gradient(135deg, #1a5fb4, #14407a); }
.btn-login:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
.btn-login:disabled { opacity: .7; cursor: not-allowed; transform: none; }
.login-test {
  padding: 10px 14px; background: #f0f7ff; border-radius: 8px;
  font-size: 12px; text-align: center; border: 1px dashed #1a5fb4;
  color: #1a5fb4; margin-top: 14px;
}
.login-footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
.back-link { color: #888; font-size: 13px; cursor: pointer; }
.back-link:hover { color: #1a5fb4; }
@media (max-width: 768px) {
  .login-card {
    padding: 28px 20px;
    max-width: 100%;
    border-radius: 16px;
  }
  .login-header {
    margin-bottom: 24px;
  }
  .login-header h2 {
    font-size: 20px;
  }
  .login-header p {
    font-size: 12px;
  }
  .login-brand {
    top: 16px;
    left: 16px;
  }
  .login-brand-logo {
    font-size: 18px;
  }
  .login-back {
    top: 20px;
    right: 16px;
  }
  .login-test {
    font-size: 11px;
    padding: 8px 10px;
  }
  .login-footer {
    font-size: 12px;
  }
}
@media (max-width: 480px) {
  .login-card { padding: 24px 16px; }
  .login-brand { top: 16px; left: 16px; }
  .login-back { top: 20px; right: 16px; }
}
</style>
