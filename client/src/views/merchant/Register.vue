<template>
  <div class="register-page">
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
          >
            <el-option label="教育培训" value="教育培训" />
            <el-option label="医院诊所" value="医院诊所" />
            <el-option label="药店" value="药店" />
            <el-option label="餐饮小吃" value="餐饮小吃" />
            <el-option label="生鲜水果" value="生鲜水果" />
            <el-option label="美业" value="美业" />
            <el-option label="保健养生" value="保健养生" />
            <el-option label="体育健身" value="体育健身" />
            <el-option label="银行保险" value="银行保险" />
            <el-option label="电信服务" value="电信服务" />
            <el-option label="商超零售" value="商超零售" />
            <el-option label="快递物流" value="快递物流" />
            <el-option label="家政服务" value="家政服务" />
            <el-option label="废旧回收" value="废旧回收" />
            <el-option label="五金建材" value="五金建材" />
            <el-option label="家居装修" value="家居装修" />
            <el-option label="家纺布艺" value="家纺布艺" />
            <el-option label="电子电器" value="电子电器" />
            <el-option label="房产中介" value="房产中介" />
            <el-option label="汽车服务" value="汽车服务" />
            <el-option label="旅游服务" value="旅游服务" />
            <el-option label="鲜花礼品" value="鲜花礼品" />
            <el-option label="电影演出" value="电影演出" />
            <el-option label="娱乐休闲" value="娱乐休闲" />
            <el-option label="服装服饰" value="服装服饰" />
            <el-option label="酒店宾馆" value="酒店宾馆" />
            <el-option label="茶艺咖啡" value="茶艺咖啡" />
            <el-option label="宠物服务" value="宠物服务" />
            <el-option label="眼镜" value="眼镜" />
            <el-option label="酒水饮料" value="酒水饮料" />
            <el-option label="办公用品" value="办公用品" />
            <el-option label="设备租赁" value="设备租赁" />
            <el-option label="社工服务" value="社工服务" />
            <el-option label="养老服务" value="养老服务" />
            <el-option label="新闻媒体" value="新闻媒体" />
            <el-option label="自媒体" value="自媒体" />
            <el-option label="IT互联网" value="IT互联网" />
            <el-option label="软件开发" value="软件开发" />
            <el-option label="图文广告" value="图文广告" />
            <el-option label="电子电器维修" value="电子电器维修" />
            <el-option label="家居维修" value="家居维修" />
            <el-option label="美发" value="美发" />
            <el-option label="建筑工程" value="建筑工程" />
            <el-option label="其他" value="其他" />
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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Key, User, Shop } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)

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

const sendCode = () => {
  if (!form.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (counting.value) return

  form.code = '123456'
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
    padding: 30px 20px;
  }
}
</style>
