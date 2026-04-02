<template>
  <div class="login-page admin">
    <div class="login-container">
      <div class="login-header">
        <el-icon :size="40" color="#909399"><Setting /></el-icon>
        <h2>管理后台</h2>
        <p>邻盟 - 社区资源智能匹配助手</p>
      </div>

      <el-form :model="form" class="login-form" @submit.prevent="login">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Key"
            type="password"
            show-password
            @keyup.enter="login"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="login"
          >登录</el-button>
        </el-form-item>
        <div class="test-notice">
          <el-alert title="测试账号：admin / admin123" type="info" :closable="false" show-icon />
        </div>
      </el-form>

      <div class="login-footer">
        <el-link @click="goBack">← 返回角色选择</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Key } from '@element-plus/icons-vue'
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
.login-page.admin {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #3d5a80 100%);
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

.login-header { text-align: center; margin-bottom: 30px; }
.login-header h2 { margin: 15px 0 5px; }
.login-header p { color: #909399; font-size: 14px; }

.code-input { display: flex; gap: 10px; }
.code-input .el-input { flex: 1; }
.login-footer { padding-top: 20px; border-top: 1px solid #ebeef5; }
</style>
