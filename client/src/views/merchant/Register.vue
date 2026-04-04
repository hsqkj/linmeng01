<template>
  <div class="register-page">
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

    <div class="register-container">
      <div class="register-header">
        <el-icon :size="40" color="#67C23A"><Shop /></el-icon>
        <h2>商家注册</h2>
        <p>邻盟 - 社区资源智能匹配助手</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入商家/企业名称"
            size="large"
            :prefix-icon="Shop"
          />
        </el-form-item>

        <el-form-item prop="category">
          <el-select
            v-model="form.category"
            placeholder="请选择行业分类"
            size="large"
            style="width: 100%"
            :loading="loadingIndustries"
          >
            <el-option v-for="ind in industries" :key="ind" :label="ind" :value="ind" />
          </el-select>
        </el-form-item>

        <el-form-item prop="contact">
          <el-input
            v-model="form.contact"
            placeholder="请输入联系人姓名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            size="large"
            :prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item prop="code">
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
          <el-checkbox v-model="form.agree">
            我已阅读并同意
            <el-link type="success" @click.prevent="$router.push('/legal/terms')">《邻盟平台服务协议》</el-link>
            和
            <el-link type="success" @click.prevent="$router.push('/legal/privacy')">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="success"
            size="large"
            class="register-btn"
            :disabled="!form.agree"
            @click="register"
          >
            立即注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <el-link @click="$router.push('/login/merchant')">← 已有账号？立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Key, User, Shop, Goods, Connection, Medal, Trophy } from '@element-plus/icons-vue'
import { getIndustries } from '@/api/public'
import { sendSms } from '@/api/public'

const router = useRouter()
const formRef = ref(null)
const industries = ref([])
const loadingIndustries = ref(false)

const form = reactive({
  name: '',
  category: '',
  contact: '',
  phone: '',
  code: '',
  agree: false
})

const rules = {
  name: [{ required: true, message: '请输入商家/企业名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择行业分类', trigger: 'change' }],
  contact: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const counting = ref(false)
const countdown = ref(60)

// 加载行业分类
async function loadIndustries() {
  loadingIndustries.value = true
  try {
    const res = await getIndustries()
    industries.value = res.data || []
  } catch {
    ElMessage.error('加载行业分类失败')
    industries.value = []
  } finally {
    loadingIndustries.value = false
  }
}

// 发送验证码
async function sendCode() {
  if (!form.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (counting.value) return

  try {
    await sendSms({ phone: form.phone, type: 'register' })
    ElMessage.success('验证码已发送')
    counting.value = true
    countdown.value = 60

    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        counting.value = false
      }
    }, 1000)
  } catch (e) {
    ElMessage.error(e.message || '发送验证码失败')
  }
}

const register = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    if (!form.agree) {
      ElMessage.warning('请先阅读并同意服务协议')
      return
    }
    ElMessage.success('注册成功！即将跳转到登录页面...')
    setTimeout(() => {
      router.push('/login/merchant')
    }, 1500)
  })
}

onMounted(() => {
  loadIndustries()
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  margin: 15px 0 5px;
  color: #303133;
}

.register-header p {
  color: #909399;
  font-size: 14px;
}

.register-form {
  margin-bottom: 20px;
}

.code-input {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-input .el-input {
  flex: 1;
}

.register-btn {
  width: 100%;
}

.register-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .register-container {
    padding: 24px 16px;
    border-radius: 12px;
  }
  .register-header {
    margin-bottom: 20px;
  }
  .register-header h2 {
    font-size: 20px;
    margin: 10px 0 5px;
  }
  .register-header p {
    font-size: 12px;
  }
  .code-input :deep(.el-input) {
    width: 55%;
  }
  .code-input .el-button {
    flex: 1;
    min-width: 0;
  }
  .register-footer {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 20px 14px;
    margin: 10px 0;
  }
  .register-page {
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
  .register-page {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 20px;
  }
  .register-container {
    max-width: 480px;
    width: 100%;
    border-radius: 16px;
    margin: 0 16px;
    padding: 24px;
  }
  .register-header {
    margin-bottom: 20px;
  }
  .register-header h2 {
    font-size: 20px;
    margin: 10px 0 5px;
  }
  .register-header p {
    font-size: 12px;
  }
  .register-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  .code-input :deep(.el-input) {
    width: 55%;
  }
  .code-input .el-button {
    flex: 1;
    min-width: 0;
  }
  .register-footer {
    text-align: center;
    padding-top: 16px;
  }
}

@media (max-width: 768px) {
  .feature-intro {
    padding: 16px 14px;
  }
  .feature-intro h1 {
    font-size: 20px;
  }
  .feature-intro .features {
    gap: 8px;
  }
  .feature-item .el-icon {
    font-size: 22px;
  }
  .feature-item span {
    font-size: 13px;
  }
  .feature-item small {
    font-size: 10px;
  }
  .register-container {
    padding: 20px 14px;
    border-radius: 12px;
    margin: 0 10px;
  }
  .register-form :deep(.el-form-item) {
    margin-bottom: 14px;
  }
}
</style>
