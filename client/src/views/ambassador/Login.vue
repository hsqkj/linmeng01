<template>
  <div class="ambassador-login">
    <div class="login-container">
      <div class="login-left">
        <div class="brand">
          <div class="logo">邻</div>
          <div class="brand-name">邻盟</div>
        </div>
        <h1>招商大使中心</h1>
        <p class="subtitle">发展优质商家会员，坐享丰厚佣金收益</p>
        <div class="benefits">
          <div class="benefit-item">
            <span class="benefit-icon">🏘️</span>
            <div>
              <div class="benefit-title">社区招商更容易</div>
              <div class="benefit-desc">一键生成专属渠道码，快速触达目标商家</div>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">📈</span>
            <div>
              <div class="benefit-title">管道收益更丰厚</div>
              <div class="benefit-desc">高提成比例，永久绑定持续收益</div>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">💰</span>
            <div>
              <div class="benefit-title">等级越高权益越大</div>
              <div class="benefit-desc">等级越高，权益越高，收益越大</div>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2>大使登录</h2>

          <!-- 登录方式切换 -->
          <div class="login-tabs">
            <button :class="['tab-btn', loginMode === 'code' ? 'active' : '']" @click="loginMode = 'code'">验证码登录</button>
            <button :class="['tab-btn', loginMode === 'password' ? 'active' : '']" @click="loginMode = 'password'">密码登录</button>
          </div>

          <el-form :model="loginForm" label-position="top">
            <el-form-item label="手机号">
              <el-input v-model="loginForm.phone" placeholder="请输入手机号" maxlength="11" size="large" />
            </el-form-item>
            <!-- 验证码模式 -->
            <el-form-item v-if="loginMode === 'code'" label="验证码">
              <div class="code-row">
                <el-input v-model="loginForm.code" placeholder="验证码" size="large" style="flex:1" />
                <el-button type="primary" plain size="large" @click="sendCode" :disabled="countdown > 0" style="width:120px">
                  {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <!-- 密码模式 -->
            <el-form-item v-else label="登录密码">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入登录密码" size="large" show-password />
            </el-form-item>
          </el-form>
          <el-button type="warning" size="large" style="width:100%;margin-top:8px;font-size:16px" :loading="loading" @click="doLogin">
            登录大使中心
          </el-button>
          <div class="login-links">
            <span>还不是大使？</span>
            <el-button text type="primary" @click="showApply = true">申请成为招商大使</el-button>
          </div>

          <div class="test-hint">
            <span class="test-label">测试账号</span>
            <span class="test-phone">188 0000 0003</span>
            <span class="test-code">验证码：123456</span>
          </div>
          <div class="other-logins">
            <el-divider>其他登录</el-divider>
            <div class="login-role-btns">
              <el-button text size="small" @click="$router.push('/login/community')">社区工作者登录</el-button>
              <el-button text size="small" @click="$router.push('/login/merchant')">商家登录</el-button>
              <el-button text size="small" @click="$router.push('/admin/login')">管理后台</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showApply" title="申请成为招商大使" width="500px">
      <el-form label-position="top">
        <el-form-item label="姓名"><el-input v-model="applyForm.real_name" placeholder="真实姓名" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="applyForm.phone" placeholder="手机号" /></el-form-item>
        <el-form-item label="申请理由"><el-input v-model="applyForm.reason" type="textarea" :rows="3" placeholder="简要说明您的人脉资源和推广能力" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApply = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ambassadorLogin } from '@/api/ambassador'
import { applyAmbassador, sendSms } from '@/api/public'

const router = useRouter()
const loginForm = ref({ phone: '', code: '', password: '' })
const loginMode = ref('code') // 'code' | 'password'
const countdown = ref(0)
const showAutoFill = ref(false)
const showApply = ref(false)
const loading = ref(false)
const applyForm = ref({ real_name: '', phone: '', reason: '' })

// 手机号格式验证
const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

async function sendCode() {
  if (!loginForm.value.phone) { ElMessage.warning('请先输入手机号'); return }
  if (!isValidPhone(loginForm.value.phone)) { ElMessage.warning('请输入正确的手机号（11位，以1开头）'); return }
  try {
    await sendSms({ phone: loginForm.value.phone, type: 'login' })
    ElMessage.success('验证码已发送')
    showAutoFill.value = true
    countdown.value = 60
    const t = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(t) }, 1000)
  } catch {
    ElMessage.error('发送验证码失败，请稍后重试')
  }
}

async function doLogin() {
  if (!loginForm.value.phone) { ElMessage.warning('请填写手机号'); return }
  if (!isValidPhone(loginForm.value.phone)) { ElMessage.warning('请输入正确的手机号（11位，以1开头）'); return }
  if (loginMode.value === 'code' && !loginForm.value.code) { ElMessage.warning('请填写验证码'); return }
  if (loginMode.value === 'password' && !loginForm.value.password) { ElMessage.warning('请填写登录密码'); return }
  loading.value = true
  try {
    const payload = loginMode.value === 'code'
      ? { phone: loginForm.value.phone, code: loginForm.value.code }
      : { phone: loginForm.value.phone, password: loginForm.value.password }
    const res = await ambassadorLogin(payload)
    localStorage.setItem('ambassador_token', res.data.token)
    localStorage.setItem('ambassador_info', JSON.stringify(res.data.ambassador))
    ElMessage.success('登录成功！')
    setTimeout(() => router.push('/ambassador'), 500)
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '登录失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

async function submitApply() {
  if (!applyForm.value.real_name || !applyForm.value.phone) {
    ElMessage.warning('请填写姓名和手机号')
    return
  }
  try {
    await applyAmbassador({
      real_name: applyForm.value.real_name,
      phone: applyForm.value.phone,
      reason: applyForm.value.reason
    })
    showApply.value = false
    ElMessage.success('申请已提交！平台将在1-3个工作日内审核')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '提交申请失败')
  }
}
</script>

<style scoped>
.ambassador-login {
  min-height: 100vh;
  background: linear-gradient(160deg, #0d1b2a 0%, #1a2940 50%, #2d1b4e 100%);
  display: flex; align-items: center; justify-content: center; padding: 40px 20px;
  position: relative; overflow: hidden;
}
.ambassador-login::before {
  content: '';
  position: absolute; top: -120px; right: -80px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(129,61,156,.2) 0%, transparent 70%);
  border-radius: 50%;
}
.login-container { display: grid; grid-template-columns: 1fr 420px; gap: 60px; max-width: 1000px; width: 100%; align-items: center; position: relative; z-index: 1; }
.login-left { color: #fff; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
.logo { width: 50px; height: 50px; background: linear-gradient(135deg, #813d9c, #5e2b74); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: #fff; }
.brand-name { font-size: 22px; font-weight: 700; color: #c77dff; }
.login-left h1 { font-size: 34px; font-weight: 800; margin-bottom: 12px; background: linear-gradient(135deg, #c77dff, #e0aaff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { color: rgba(255,255,255,.65); font-size: 15px; margin-bottom: 36px; }
.benefits { display: flex; flex-direction: column; gap: 20px; }
.benefit-item { display: flex; align-items: flex-start; gap: 16px; }
.benefit-icon { font-size: 28px; }
.benefit-title { font-size: 15px; font-weight: 600; color: #e0aaff; }
.benefit-desc { color: rgba(255,255,255,.6); font-size: 13px; margin-top: 4px; }
.login-right { display: flex; justify-content: flex-end; }
.login-card { background: #fff; border-radius: 20px; padding: 40px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,.3); }
.login-card h2 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #1a1a1a; }
.login-tabs {
  display: flex; gap: 0; margin-bottom: 20px;
  border: 2px solid #e0e0e0; border-radius: 10px; overflow: hidden;
}
.tab-btn {
  flex: 1; padding: 10px 0; border: none; background: #fff;
  font-size: 14px; font-weight: 500; color: #666; cursor: pointer;
  transition: all .2s; font-family: inherit;
}
.tab-btn.active { background: #813d9c; color: #fff; font-weight: 600; }
.tab-btn:not(.active):hover { background: #f5f5f5; }
.code-row { display: flex; gap: 12px; }

.login-links { text-align: center; margin-top: 16px; font-size: 14px; color: #909399; }
.other-logins { margin-top: 8px; }
.login-role-btns { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }

:deep(.el-button--warning) { background: linear-gradient(135deg, #813d9c, #5e2b74) !important; border-color: transparent !important; }

@media (max-width: 768px) {
  .ambassador-login { padding: 20px 12px; }
  .login-container { grid-template-columns: 1fr; gap: 16px; max-width: 420px; }
  .login-left { text-align: center; padding: 16px 0; }
  .login-left h1 { font-size: 22px; }
  .subtitle { font-size: 13px; margin-bottom: 20px; }
  .benefits { flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 12px; }
  .benefit-item { flex-direction: column; align-items: center; gap: 6px; max-width: 100px; }
  .benefit-icon { font-size: 22px; }
  .benefit-title { font-size: 12px; }
  .benefit-desc { display: none; }
  .login-right { justify-content: center; width: 100%; }
  .login-card { padding: 20px 16px; border-radius: 16px; }
  .login-card h2 { font-size: 20px; margin-bottom: 18px; text-align: center; }
  .login-links { font-size: 13px; }
  .other-logins { margin-top: 6px; }
}

.test-hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;
}
.test-label {
  background: #faad14;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}
.test-phone {
  color: #333;
  font-weight: 500;
}
.test-code {
  color: #52c41a;
  font-weight: 600;
}
</style>
