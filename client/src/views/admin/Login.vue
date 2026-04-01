<template>
  <div class="login-page admin">
    <div class="login-container">
      <div class="login-header">
        <el-icon :size="40" color="#909399"><Setting /></el-icon>
        <h2>管理后台</h2>
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
            <el-input v-model="form.code" placeholder="验证码" size="large" :prefix-icon="Key" />
            <el-button type="info" size="large" @click="login">登录</el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-link @click="goBack">← 返回角色选择</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Key } from '@element-plus/icons-vue'

const router = useRouter()
const form = reactive({ phone: '13700137000', code: '888888' })

const login = () => { router.push('/admin') }
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
