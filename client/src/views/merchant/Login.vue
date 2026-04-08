<template>
  <div class="login-wrap merch-bg">
    <div class="login-brand">
      <div class="login-brand-logo">🏪 邻盟</div>
      <div class="login-brand-sub">商家 · 专家资源精准触达平台</div>
    </div>
    <div class="login-back">
      <a href="#" @click.prevent="goBack">← 返回选择</a>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="icon">🏪</div>
        <h2>商家 / 专家登录</h2>
        <p>邻盟 · 社区资源智能匹配</p>
      </div>

      <div class="form-group">
        <label>手机号</label>
        <div class="input-addon">
          <span class="addon">+86</span>
          <input class="form-control" v-model="form.phone" placeholder="请输入手机号" type="tel" />
        </div>
      </div>

      <div class="form-group">
        <label>验证码</label>
        <div style="display:flex;gap:10px">
          <input class="form-control" v-model="form.code" placeholder="请输入验证码" style="flex:1" />
          <button class="code-btn" @click="sendCode" :disabled="counting">
            {{ counting ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>
      </div>

      <button class="btn-login merch" @click="login" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <div class="login-divider">
        <div class="login-tips">
          <div class="login-tip">
            <i>📦</i><span>资源曝光</span>
          </div>
          <div class="login-tip">
            <i>🔗</i><span>精准匹配</span>
          </div>
          <div class="login-tip">
            <i>👑</i><span>会员权益</span>
          </div>
        </div>
      </div>

      <div class="login-footer">
        还没有账号？<a class="reg-link" @click="$router.push('/register/merchant')">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { merchantLogin } from '@/api/merchant'

const router = useRouter()

const form = reactive({
  phone: '13900139000',
  code: '123456',
  remember: false
})

const counting = ref(false)
const countdown = ref(60)
const loading = ref(false)

const sendCode = () => {
  if (!form.phone) { ElMessage.warning('请先输入手机号'); return }
  if (counting.value) return
  form.code = '123456'
  ElMessage.success('验证码已发送（测试版：123456）')
  counting.value = true
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      counting.value = false
    }
  }, 1000)
}

const login = async () => {
  if (!form.phone || !form.code) {
    ElMessage.warning('请填写手机号和验证码')
    return
  }
  loading.value = true
  try {
    const res = await merchantLogin({ phone: form.phone, code: form.code })
    localStorage.setItem('merchant_token', res.data.token)
    localStorage.setItem('merchant_info', JSON.stringify(res.data.merchant))
    ElMessage.success('登录成功！')
    router.push('/merchant')
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
.merch-bg { background: linear-gradient(135deg, #e66100, #b84d00); }
.login-brand { position: absolute; top: 24px; left: 32px; z-index: 2; }
.login-brand-logo { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.login-brand-sub { font-size: 12px; color: rgba(255,255,255,.75); margin-top: 2px; }
.login-back { position: absolute; top: 28px; right: 32px; z-index: 2; }
.login-back a { color: rgba(255,255,255,.85); text-decoration: none; font-size: 14px; }
.login-card {
  background: #fff; border-radius: 20px; padding: 48px 40px;
  width: 100%; max-width: 440px;
  box-shadow: 0 24px 60px rgba(0,0,0,.15); position: relative; z-index: 1;
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
.form-control:focus { border-color: #e66100; }
.input-addon { display: flex; }
.input-addon .addon {
  padding: 12px 14px; background: #f5f5f5;
  border: 2px solid #e0e0e0; border-right: none;
  border-radius: 10px 0 0 10px; font-size: 15px; color: #555;
}
.input-addon .form-control { border-radius: 0 10px 10px 0; }
.code-btn {
  padding: 10px 16px; background: #fff0e0; color: #e66100;
  border: 2px solid #e66100; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all .2s; font-family: inherit;
}
.code-btn:hover { background: #e66100; color: #fff; }
.code-btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-login {
  width: 100%; padding: 14px; border: none; border-radius: 10px;
  font-size: 16px; font-weight: 600; cursor: pointer; color: #fff;
  transition: all .2s; margin-top: 6px; font-family: inherit;
}
.btn-login.merch { background: linear-gradient(135deg, #e66100, #b84d00); }
.btn-login:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
.btn-login:disabled { opacity: .7; cursor: not-allowed; transform: none; }

.login-divider { border-top: 1px solid #eee; margin-top: 24px; padding-top: 20px; }
.login-tips { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; text-align: center; }
.login-tip { padding: 10px 6px; background: #f9f9f9; border-radius: 10px; }
.login-tip i { font-size: 22px; margin-bottom: 4px; display: block; font-style: normal; }
.login-tip span { display: block; font-size: 12px; font-weight: 600; color: #333; }
.login-footer { text-align: center; margin-top: 18px; font-size: 13px; color: #666; }
.reg-link { color: #e66100; font-weight: 600; cursor: pointer; text-decoration: none; margin-left: 4px; }
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
  .login-tips {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .login-tip {
    padding: 8px 4px;
  }
  .login-tip i {
    font-size: 18px;
  }
  .login-tip span {
    font-size: 11px;
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
