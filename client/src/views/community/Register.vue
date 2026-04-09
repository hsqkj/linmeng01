<template>
  <div class="register-page">
    <!-- 功能介绍区域 -->
    <div class="feature-intro">
      <h1>邻盟 · 社区资源智能匹配助手</h1>
      <p class="tagline">连接社区与商家，共创美好生活</p>
      <div class="features">
        <div class="feature-item">
          <el-icon><Connection /></el-icon>
          <span>智能匹配</span>
          <small>AI算法精准推送匹配资源</small>
        </div>
        <div class="feature-item">
          <el-icon><CircleCheck /></el-icon>
          <span>高效对接</span>
          <small>一键联系，实时沟通</small>
        </div>
        <div class="feature-item">
          <el-icon><Trophy /></el-icon>
          <span>撮合奖励</span>
          <small>成功合作可获得奖励</small>
        </div>
      </div>
    </div>

    <div class="register-container">
      <div class="register-header">
        <el-icon :size="40" color="#409EFF"><House /></el-icon>
        <h2>社区工作者注册</h2>
        <p>邻盟 - 社区资源智能匹配助手</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
        <el-form-item prop="district">
          <div class="region-select-group">
            <el-select v-model="form.district" placeholder="区/开发区" size="large" @change="onDistrictChange">
              <el-option v-for="d in districts" :key="d" :label="d" :value="d" />
            </el-select>
            <el-select v-model="form.street" placeholder="街道/镇" size="large" :disabled="!form.district" @change="onStreetChange">
              <el-option v-for="s in filteredStreets" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
            <el-select v-model="form.community" placeholder="社区" size="large" :disabled="!form.street">
              <el-option v-for="c in filteredCommunities" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </div>
        </el-form-item>

        <el-form-item prop="manager">
          <el-input
            v-model="form.manager"
            placeholder="请输入负责人姓名"
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
              type="primary"
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
            <el-link type="primary" @click.prevent="$router.push('/legal/terms')">《邻盟平台服务协议》</el-link>
            和
            <el-link type="primary" @click.prevent="$router.push('/legal/privacy')">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
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
        <el-link @click="$router.push('/login/community')">← 已有账号？立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Key, User, OfficeBuilding, Location, Connection, CircleCheck, Trophy } from '@element-plus/icons-vue'
import { getRegions, sendSms } from '@/api/public'

const router = useRouter()
const formRef = ref(null)

// 地区数据（从后端加载）
const allRegions = ref([])

const form = reactive({
  district: '',
  street: '',
  community: '',
  manager: '',
  phone: '',
  code: '',
  agree: false
})

const rules = {
  district: [{ required: true, message: '请选择所在区', trigger: 'change' }],
  street: [{ required: true, message: '请选择街道/镇', trigger: 'change' }],
  community: [{ required: true, message: '请选择社区', trigger: 'change' }],
  manager: [{ required: true, message: '请输入负责人姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 从后端加载地区数据
async function loadRegions() {
  try {
    const res = await getRegions()
    allRegions.value = res.data || []
  } catch {
    ElMessage.error('加载地区数据失败')
    allRegions.value = []
  }
}

// 行政区列表（parent_id = 0 或 null 表示顶级，跳过顶级直接显示区）
const districts = computed(() => {
  // 找出顶级地区
  const topLevel = allRegions.value.filter(r => !r.parent_id || r.parent_id === 0 || r.parent_id === '0')
  // 如果顶级只有一个且是"武汉市"，直接显示它的子级（区）
  if (topLevel.length === 1 && (topLevel[0].name === '武汉市' || topLevel[0].region_name === '武汉市')) {
    return allRegions.value
      .filter(r => r.parent_id === topLevel[0].id)
      .map(r => r.name || r.region_name)
      .filter(Boolean)
  }
  // 否则显示顶级地区
  return topLevel.map(r => r.name || r.region_name).filter(Boolean)
})

// 根据选择的区获取街道列表
const filteredStreets = computed(() => {
  if (!form.district) return []
  const district = allRegions.value.find(r => (r.name || r.region_name) === form.district)
  if (!district) return []
  return allRegions.value
    .filter(r => r.parent_id === district.id)
    .map(r => ({ label: r.name || r.region_name, value: r.name || r.region_name }))
})

// 根据选择的街道获取社区列表
const filteredCommunities = computed(() => {
  if (!form.street) return []
  const street = allRegions.value.find(r => (r.name || r.region_name) === form.street)
  if (!street) return []
  return allRegions.value
    .filter(r => r.parent_id === street.id)
    .map(r => ({ label: r.name || r.region_name, value: r.name || r.region_name }))
})

function onDistrictChange() {
  form.street = ''
  form.community = ''
}

function onStreetChange() {
  form.community = ''
}

const counting = ref(false)
const countdown = ref(60)

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
      router.push('/login/community')
    }, 1500)
  })
}

// 初始化加载地区数据
onMounted(async () => {
  loadRegions()
})

</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* 区街社区选择框一行显示 */
.region-select-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.region-select-group .el-select {
  flex: 1;
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
  font-size: 36px;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    max-width: 480px;
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
