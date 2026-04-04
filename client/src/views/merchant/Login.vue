<template>
  <div class="login-page merchant">
    <!-- 功能介绍区域 -->
    <div class="feature-intro">
      <h1>邻盟 · 商家资源精准触达平台</h1>
      <p class="tagline">发布资源，精准匹配，高效合作</p>
      <div class="features">
        <div class="feature-item">
          <el-icon><Goods /></el-icon>
          <span>资源曝光</span>
          <small>面向武汉300+社区展示</small>
        </div>
        <div class="feature-item">
          <el-icon><Connection /></el-icon>
          <span>精准匹配</span>
          <small>AI推荐最适合的社区需求</small>
        </div>
        <div class="feature-item">
          <el-icon><Medal /></el-icon>
          <span>会员权益</span>
          <small>多等级权益，差异化服务</small>
        </div>
        <div class="feature-item">
          <el-icon><Trophy /></el-icon>
          <span>品牌合作</span>
          <small>提升在社区的影响力</small>
        </div>
      </div>
    </div>

    <div class="login-container">
      <div class="login-header">
        <el-icon :size="40" color="#67C23A"><Shop /></el-icon>
        <h2>商家登录</h2>
        <p>邻盟 - 社区资源智能匹配助手</p>
      </div>

      <el-form :model="form" class="login-form">
        <el-form-item>
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            size="large"
            :prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item>
          <div class="code-input">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              size="large"
              :prefix-icon="Key"
            />
            <el-button 
              type="success" 
              size="large"
              :disabled="counting"
              @click="sendCode"
            >
              {{ counting ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
          <el-link type="success" class="forgot-link">忘记密码？</el-link>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="success" 
            size="large" 
            class="login-btn"
            :loading="loading"
            @click="login"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="test-notice">
          <el-alert
            title="测试版提示：验证码已自动填入"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </el-form>

      <div class="login-footer">
        <el-link @click="goBack">← 返回角色选择</el-link>
        <span>还没有账号？<el-link type="success" @click="$router.push('/register/merchant')">立即注册</el-link></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Key, Shop, Goods, Connection, Medal, Trophy } from '@element-plus/icons-vue'
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
    // 如果商家信息不完整，提示补充
    if (!res.data.merchant.company_name || !res.data.merchant.description) {
      setTimeout(() => {
        ElMessage.warning({ message: '请前往个人中心完善商家信息，提升匹配机会！', duration: 5000 })
      }, 1000)
    }
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
.login-page.merchant {
  min-height: 100vh;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 15px 0 5px;
  color: #303133;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-input .el-input {
  flex: 1;
}

.login-btn {
  width: 100%;
}

.forgot-link {
  float: right;
}

.test-notice {
  margin-top: 15px;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .login-container {
    padding: 24px 16px;
    border-radius: 12px;
  }
  .login-header {
    margin-bottom: 20px;
  }
  .login-header h2 {
    font-size: 20px;
    margin: 10px 0 5px;
  }
  .login-header p {
    font-size: 12px;
  }
  .code-input :deep(.el-input) {
    width: 55%;
  }
  .code-input .el-button {
    flex: 1;
    min-width: 0;
  }
  .forgot-link {
    float: none;
    margin-left: 8px;
  }
  .login-footer {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  .test-notice {
    margin-top: 10px;
  }
  .test-notice :deep(.el-alert) {
    font-size: 12px;
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 20px 14px;
    margin: 10px 0;
  }
  .login-page.merchant {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
}

/* 功能介绍样式 */
.feature-intro {
  position: fixed;
  left: 5%;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  max-width: 400px;
  padding-right: 60px;
}

.feature-intro h1 {
  font-size: 32px;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.feature-intro .tagline {
  font-size: 18px;
  opacity: 0.95;
  margin-bottom: 32px;
}

.feature-intro .features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-item .el-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.feature-item span {
  font-weight: 600;
  font-size: 16px;
}

.feature-item small {
  font-size: 13px;
  opacity: 0.85;
}

@media (max-width: 1100px) {
  .feature-intro {
    position: static;
    transform: none;
    max-width: 100%;
    padding: 20px 16px;
    margin-bottom: 0;
    text-align: center;
  }
  .feature-intro h1 {
    font-size: 24px;
  }
  .feature-intro .tagline {
    font-size: 14px;
    margin-bottom: 20px;
  }
  .feature-intro .features {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 400px;
    margin: 0 auto;
  }
  .feature-item {
    align-items: center;
  }
  .feature-item .el-icon {
    font-size: 24px;
  }
  .feature-item span {
    font-size: 14px;
  }
  .feature-item small {
    font-size: 11px;
  }
  .login-page.merchant {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 20px;
  }
  .login-container {
    max-width: 480px;
    width: 100%;
    border-radius: 16px;
    margin: 0 16px;
  }
}
</style>
