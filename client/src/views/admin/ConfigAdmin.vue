<template>
  <div class="page">
    <h2>管理员配置</h2>
    <div class="tip-box">⚠️ 管理员账号具有平台管理权限，请谨慎配置，操作日志将被记录</div>

    <div class="section-card">
      <div class="section-title-row">
        <span class="section-title">管理员列表</span>
        <el-button type="primary" @click="openAddAdmin"><el-icon><Plus /></el-icon> 新增管理员</el-button>
      </div>
      <el-table :data="admins" stripe border v-loading="loading">
        <el-table-column type="index" width="50" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="username" label="账号" width="140" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role==='超级管理员'?'danger':row.role==='运营管理员'?'warning':'info'" size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="权限范围" min-width="220">
          <template #default="{ row }">
            <el-tag v-for="p in (row.permissions || [])" :key="p" size="small" style="margin:2px">{{ permLabel[p] || p }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="160">
          <template #default="{ row }">{{ formatTime(row.last_login_at) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ?'success':'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editAdmin(row)" :disabled="row.role==='超级管理员'">编辑</el-button>
            <el-button text type="warning" size="small" @click="resetPwd(row)">重置密码</el-button>
            <el-button v-if="row.role!=='超级管理员'" text :type="row.status===1?'danger':'success'" size="small" @click="toggleAdmin(row)">
              {{ row.status===1?'禁用':'启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 权限说明 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">角色权限说明</div>
      <el-table :data="rolePermissions" border>
        <el-table-column prop="module" label="功能模块" width="160" />
        <el-table-column label="超级管理员" width="130" align="center">
          <template #default="{ row }"><el-icon color="#67C23A"><CircleCheck /></el-icon></template>
        </el-table-column>
        <el-table-column label="运营管理员" width="130" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.ops" color="#67C23A"><CircleCheck /></el-icon>
            <el-icon v-else color="#C0C4CC"><CircleClose /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="审核员" width="130" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.auditor" color="#67C23A"><CircleCheck /></el-icon>
            <el-icon v-else color="#C0C4CC"><CircleClose /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="财务员" width="130" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.finance" color="#67C23A"><CircleCheck /></el-icon>
            <el-icon v-else color="#C0C4CC"><CircleClose /></el-icon>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑管理员对话框 -->
    <el-dialog v-model="showDialog" :title="editMode?'编辑管理员':'新增管理员'" width="560px">
      <el-form :model="adminForm" label-width="90px">
        <el-form-item label="姓名" required>
          <el-input v-model="adminForm.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="账号" required>
          <el-input v-model="adminForm.username" placeholder="登录用账号，建议用手机号" :disabled="editMode" />
        </el-form-item>
        <el-form-item v-if="!editMode" label="初始密码" required>
          <el-input v-model="adminForm.password" type="password" placeholder="至少8位，含字母和数字" show-password />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="adminForm.phone" placeholder="用于接收系统通知" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="adminForm.role" style="width:200px" @change="onRoleChange">
            <el-option label="运营管理员" value="运营管理员" />
            <el-option label="审核员" value="审核员" />
            <el-option label="财务员" value="财务员" />
            <el-option label="自定义权限" value="自定义" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="perm-grid">
            <el-checkbox v-for="perm in allPermissions" :key="perm.key" v-model="adminForm.permKeys[perm.key]" :disabled="adminForm.role!=='自定义'">
              {{ perm.label }}
            </el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAdmin">{{ editMode?'保存修改':'确认添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '@/api/admin'

const loading = ref(false)
const admins = ref([])
const showDialog = ref(false)
const editMode = ref(false)
const editId = ref(null)

const allPermissions = [
  { key: 'users', label: '用户管理' },
  { key: 'audit', label: '内容审核' },
  { key: 'matching', label: '撮合管理' },
  { key: 'comments', label: '留言管理' },
  { key: 'finance', label: '财务管理' },
  { key: 'config_basic', label: '基础配置' },
  { key: 'config_member', label: '会员配置' },
  { key: 'config_rating', label: '商家评级' },
  { key: 'config_algo', label: '算法配置' },
  { key: 'config_tags', label: '标签配置' },
  { key: 'config_banner', label: '广告配置' },
  { key: 'config_admin', label: '管理员配置' },
  { key: 'config_ambassador', label: '大使配置' }
]

const permLabel = {}
allPermissions.forEach(p => { permLabel[p.key] = p.label })

const rolePresets = {
  '运营管理员': ['users', 'audit', 'matching', 'comments', 'config_tags', 'config_banner', 'config_rating'],
  '审核员': ['audit', 'comments'],
  '财务员': ['finance'],
  '自定义': []
}

const adminForm = ref({
  name: '', username: '', password: '', phone: '', role: '运营管理员',
  permKeys: {}
})

const rolePermissions = [
  { module: '用户管理', ops: true, auditor: false, finance: false },
  { module: '内容审核', ops: true, auditor: true, finance: false },
  { module: '撮合管理', ops: true, auditor: false, finance: false },
  { module: '留言管理', ops: true, auditor: true, finance: false },
  { module: '财务管理', ops: false, auditor: false, finance: true },
  { module: '基础配置', ops: false, auditor: false, finance: false },
  { module: '会员配置', ops: false, auditor: false, finance: false },
  { module: '商家评级', ops: true, auditor: false, finance: false },
  { module: '算法配置', ops: false, auditor: false, finance: false },
  { module: '标签配置', ops: true, auditor: false, finance: false },
  { module: '广告配置', ops: true, auditor: false, finance: false },
  { module: '管理员配置', ops: false, auditor: false, finance: false }
]

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadAdmins() {
  loading.value = true
  try {
    const res = await getAdmins()
    admins.value = res.data || []
  } catch {
    admins.value = []
  } finally {
    loading.value = false
  }
}

function onRoleChange(role) {
  const keys = rolePresets[role] || []
  const permKeys = {}
  allPermissions.forEach(p => { permKeys[p.key] = keys.includes(p.key) })
  adminForm.value.permKeys = permKeys
}

function openAddAdmin() {
  editMode.value = false
  editId.value = null
  adminForm.value = { name: '', username: '', password: '', phone: '', role: '运营管理员', permKeys: {} }
  onRoleChange('运营管理员')
  showDialog.value = true
}

function editAdmin(row) {
  if (row.role === '超级管理员') { ElMessage.warning('超级管理员不可编辑'); return }
  editMode.value = true
  editId.value = row.id
  adminForm.value = {
    name: row.real_name || '',
    username: row.username,
    phone: row.phone || '',
    role: row.role,
    permKeys: {}
  }
  // Map permission keys to checkbox state
  const perms = row.permissions || []
  allPermissions.forEach(p => {
    adminForm.value.permKeys[p.key] = perms.includes(p.key)
  })
  showDialog.value = true
}

async function saveAdmin() {
  if (!adminForm.value.name.trim() || !adminForm.value.username.trim()) {
    ElMessage.warning('请填写姓名和账号'); return
  }
  if (!editMode.value && !adminForm.value.password) {
    ElMessage.warning('请填写初始密码'); return
  }
  const perms = allPermissions.filter(p => adminForm.value.permKeys[p.key]).map(p => p.key)
  try {
    if (!editMode.value) {
      await createAdmin({
        username: adminForm.value.username,
        password: adminForm.value.password,
        realName: adminForm.value.name,
        phone: adminForm.value.phone,
        role: adminForm.value.role,
        permissions: perms
      })
      ElMessage.success('管理员已添加')
    } else {
      await updateAdmin(editId.value, {
        realName: adminForm.value.name,
        phone: adminForm.value.phone,
        role: adminForm.value.role,
        permissions: perms
      })
      ElMessage.success('管理员信息已更新')
    }
    showDialog.value = false
    loadAdmins()
  } catch {
    ElMessage.error('操作失败，请检查账号是否已存在')
  }
}

function resetPwd(row) {
  ElMessageBox.confirm(`确认重置"${row.real_name}"的登录密码？重置后将发送新密码到其手机。`, '重置密码', { type: 'warning' })
    .then(() => ElMessage.success('密码已重置，新密码已发送到 ' + (row.phone || '绑定的手机号'))).catch(() => {})
}

async function toggleAdmin(row) {
  const action = row.status === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确认${action}"${row.real_name}"的管理员账号？`, action + '确认', { type: 'warning' })
    await updateAdmin(row.id, { realName: row.real_name, phone: row.phone, role: row.role, permissions: row.permissions || [] })
    row.status = row.status === 1 ? 0 : 1
    ElMessage.success(`已${action}`)
  } catch {
    // 用户取消
  }
}

onMounted(() => { loadAdmins() })
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #fff5f5; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #F56C6C; font-size: 14px; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.section-title { font-size: 16px; font-weight: 700; }
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.perm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
</style>
