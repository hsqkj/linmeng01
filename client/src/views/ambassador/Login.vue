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
            <span class="benefit-icon">🎯</span>
            <div>
              <div class="benefit-title">首次成交佣金 20%</div>
              <div class="benefit-desc">商家首次缴纳会费，立得20%提成</div>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🔄</span>
            <div>
              <div class="benefit-title">续费佣金 10%</div>
              <div class="benefit-desc">每年续费持续获得提成</div>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">💰</span>
            <div>
              <div class="benefit-title">月结提现</div>
              <div class="benefit-desc">满100元即可申请提现，按月结算</div>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2>大使登录</h2>
          <el-form :model="loginForm" label-position="top">
            <el-form-item label="手机号">
              <el-input v-model="loginForm.phone" placeholder="请输入手机号" maxlength="11" size="large" />
            </el-form-item>
            <el-form-item label="验证码">
              <div class="code-row">
                <el-input v-model="loginForm.code" placeholder="验证码" size="large" style="flex:1" />
                <el-button type="primary" plain size="large" @click="sendCode" :disabled="countdown > 0" style="width:120px">
                  {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
                </el-button>
              </div>
              <div class="auto-fill-tip" v-if="showAutoFill">
                测试版验证码已自动填入：<strong>{{ loginForm.code }}</strong>
              </div>
            </el-form-item>
          </el-form>
          <el-button type="warning" size="large" style="width:100%;margin-top:8px;font-size:16px" @click="doLogin">
            登录大使中心
          </el-button>
          <div class="login-links">
            <span>还不是大使？</span>
            <el-button text type="primary" @click="showApply = true">申请成为招商大使</el-button>
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
        <el-form-item label="姓名"><el-input placeholder="真实姓名" /></el-form-item>
        <el-form-item label="手机号"><el-input placeholder="手机号" /></el-form-item>
        <el-form-item label="申请理由"><el-input type="textarea" :rows="3" placeholder="简要说明您的人脉资源和推广能力" /></el-form-item>
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

const router = useRouter()
const loginForm = ref({ phone: '13900001111', code: '' })
const countdown = ref(0)
const showAutoFill = ref(false)
const showApply = ref(false)

function sendCode() {
  if (!loginForm.value.phone) { ElMessage.warning('请先输入手机号'); return }
  loginForm.value.code = '888888'
  showAutoFill.value = true
  countdown.value = 60
  const t = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(t) }, 1000)
  ElMessage.success('验证码已发送（测试版：888888）')
}

function doLogin() {
  if (!loginForm.value.phone || !loginForm.value.code) { ElMessage.warning('请填写手机号和验证码'); return }
  ElMessage.success('登录成功！')
  setTimeout(() => router.push('/ambassador'), 800)
}

function submitApply() {
  showApply.value = false
  ElMessage.success('申请已提交！平台将在1-3个工作日内审核')
}
</script>

<style scoped>
.ambassador-login { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
.login-container { display: grid; grid-template-columns: 1fr 420px; gap: 60px; max-width: 1000px; width: 100%; align-items: center; }
.login-left { color: #fff; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
.logo { width: 50px; height: 50px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: #fff; }
.brand-name { font-size: 22px; font-weight: 700; color: #F59E0B; }
.login-left h1 { font-size: 36px; font-weight: 800; margin-bottom: 12px; background: linear-gradient(135deg, #F59E0B, #FCD34D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 36px; }
.benefits { display: flex; flex-direction: column; gap: 20px; }
.benefit-item { display: flex; align-items: flex-start; gap: 16px; }
.benefit-icon { font-size: 28px; }
.benefit-title { font-size: 16px; font-weight: 600; color: #FCD34D; }
.benefit-desc { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px; }
.login-right { display: flex; justify-content: flex-end; }
.login-card { background: #fff; border-radius: 20px; padding: 40px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.login-card h2 { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #1a1a2e; }
.code-row { display: flex; gap: 12px; }
.auto-fill-tip { margin-top: 6px; font-size: 12px; color: #909399; background: #f5f7fa; padding: 6px 10px; border-radius: 6px; }
.login-links { text-align: center; margin-top: 16px; font-size: 14px; color: #909399; }
.other-logins { margin-top: 8px; }
.login-role-btns { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }

@media (max-width: 768px) {
  .login-container { grid-template-columns: 1fr; gap: 30px; }
  .login-left { text-align: center; }
  .benefits { align-items: flex-start; }
}
</style>
