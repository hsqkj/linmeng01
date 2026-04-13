<template>
  <div class="ambassador-profile" v-loading="loading">
    <h2>个人中心</h2>

    <el-tabs v-model="activeTab">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <div class="profile-section">
          <div class="profile-avatar">
            <img :src="profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.real_name || '大使')}&background=F59E0B&color=fff&size=128`" class="avatar-img" />
          </div>
          
          <el-descriptions :column="2" border class="profile-info">
            <el-descriptions-item label="登录账号">{{ profile.username || profile.phone }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ profile.real_name || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="手机号码">{{ profile.phone || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="渠道码">
              <el-tag type="warning" size="small">{{ profile.qr_code || '未生成' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="入驻时间">{{ profile.created_at ? profile.created_at.slice(0, 10) : '—' }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="profile.status === 1 ? 'success' : 'info'" size="small">
                {{ profile.status === 1 ? '正常' : profile.status === 0 ? '审核中' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- 修改密码 -->
      <el-tab-pane label="修改密码" name="password">
        <div class="password-form">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            为保障账号安全，请定期更换密码。新密码长度不能少于6位。
          </el-alert>
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px" style="max-width: 400px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="passwordLoading">确认修改</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 账号信息 -->
      <el-tab-pane label="账号信息" name="account">
        <div class="account-section">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            填写您的收款账户信息，用于接收提成提现。账户信息仅用于财务结算，请确保信息准确。
          </el-alert>
          
          <el-form :model="accountForm" label-width="120px" style="max-width: 500px">
            <el-form-item label="账户类型">
              <el-select v-model="accountForm.account_type" placeholder="选择账户类型" style="width: 100%">
                <el-option label="支付宝" value="alipay" />
                <el-option label="微信" value="wechat" />
                <el-option label="银行转账" value="bank" />
              </el-select>
            </el-form-item>
            <el-form-item label="账户名称">
              <el-input v-model="accountForm.account_name" placeholder="请输入账户名称（真实姓名）" />
            </el-form-item>
            <el-form-item label="账户号码">
              <el-input v-model="accountForm.account_number" placeholder="请输入账户号码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveAccount" :loading="saving">保存账户信息</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAmbassadorProfile, updateAmbassadorPassword, setWithdrawAccount } from '@/api/ambassador'

const loading = ref(false)
const saving = ref(false)
const passwordLoading = ref(false)
const activeTab = ref('basic')
const passwordFormRef = ref(null)

const profile = ref({
  id: '',
  username: '',
  real_name: '',
  phone: '',
  avatar: '',
  qr_code: '',
  status: 1,
  created_at: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const accountForm = ref({
  account_type: '',
  account_name: '',
  account_number: ''
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await getAmbassadorProfile()
    if (res.data) {
      profile.value = res.data
      // 加载账号信息
      accountForm.value = {
        account_type: res.data.account_type || '',
        account_name: res.data.account_name || '',
        account_number: res.data.account_number || ''
      }
    }
  } catch (err) {
    console.error('加载个人资料失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleChangePassword() {
  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }
  passwordLoading.value = true
  try {
    await updateAmbassadorPassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (err) {
    ElMessage.error(err.message || '修改失败')
  } finally {
    passwordLoading.value = false
  }
}

async function saveAccount() {
  if (!accountForm.value.account_type) {
    ElMessage.warning('请选择账户类型')
    return
  }
  if (!accountForm.value.account_name) {
    ElMessage.warning('请输入账户名称')
    return
  }
  if (!accountForm.value.account_number) {
    ElMessage.warning('请输入账户号码')
    return
  }
  
  saving.value = true
  try {
    await setWithdrawAccount(accountForm.value)
    ElMessage.success('账户信息已保存')
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.ambassador-profile {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.ambassador-profile h2 {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 700;
}

.profile-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.profile-avatar {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #F59E0B;
}

.profile-info {
  margin-top: 16px;
}

.password-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.account-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

@media (max-width: 768px) {
  .ambassador-profile {
    padding: 12px;
  }
  
  .ambassador-profile h2 {
    font-size: 18px;
  }
}
</style>
