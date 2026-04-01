<template>
  <div class="page">
    <h2>管理员配置</h2>
    <div class="tip-box">⚠️ 管理员账号具有平台管理权限，请谨慎配置，操作日志将被记录</div>

    <div class="section-card">
      <div class="section-title-row">
        <span class="section-title">管理员列表</span>
        <el-button type="primary" @click="openAddAdmin"><el-icon><Plus /></el-icon> 新增管理员</el-button>
      </div>
      <el-table :data="admins" stripe border>
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="account" label="账号" width="140" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role==='超级管理员'?'danger':row.role==='运营管理员'?'warning':'info'" size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="权限范围" min-width="220">
          <template #default="{ row }">
            <el-tag v-for="p in row.permissions" :key="p" size="small" style="margin:2px">{{ p }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录" width="150" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status==='启用'?'success':'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editAdmin(row)" :disabled="row.role==='超级管理员'&&row.isSuper">编辑</el-button>
            <el-button text type="warning" size="small" @click="resetPwd(row)">重置密码</el-button>
            <el-button v-if="!row.isSuper" text :type="row.status==='启用'?'danger':'success'" size="small" @click="toggleAdmin(row)">
              {{ row.status==='启用'?'禁用':'启用' }}
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
          <el-input v-model="adminForm.account" placeholder="登录用账号，建议用手机号" :disabled="editMode" />
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
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const showDialog = ref(false), editMode = ref(false)

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

const rolePresets = {
  '运营管理员': ['users', 'audit', 'matching', 'comments', 'config_tags', 'config_banner', 'config_rating'],
  '审核员': ['audit', 'comments'],
  '财务员': ['finance'],
  '自定义': []
}

const adminForm = ref({
  name: '', account: '', password: '', phone: '', role: '运营管理员',
  permKeys: { users: true, audit: true, matching: true, comments: true, config_tags: true, config_banner: true }
})

const admins = reactive([
  {
    name: '大彭', account: 'admin', role: '超级管理员', phone: '138****0000',
    permissions: ['全部权限'], lastLogin: '2026-04-01 20:00', status: '启用', isSuper: true
  },
  {
    name: '王运营', account: 'ops_wang', role: '运营管理员', phone: '139****1111',
    permissions: ['用户管理', '内容审核', '撮合管理', '留言管理'], lastLogin: '2026-04-01 09:30', status: '启用', isSuper: false
  },
  {
    name: '李审核', account: 'audit_li', role: '审核员', phone: '136****2222',
    permissions: ['内容审核', '留言管理'], lastLogin: '2026-03-31 16:00', status: '启用', isSuper: false
  },
  {
    name: '张财务', account: 'finance_zhang', role: '财务员', phone: '135****3333',
    permissions: ['财务管理'], lastLogin: '2026-03-30 14:00', status: '启用', isSuper: false
  }
])

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

function openAddAdmin() {
  editMode.value = false
  adminForm.value = { name: '', account: '', password: '', phone: '', role: '运营管理员', permKeys: {} }
  onRoleChange('运营管理员')
  showDialog.value = true
}

function editAdmin(row) {
  if (row.isSuper) { ElMessage.warning('超级管理员不可编辑'); return }
  editMode.value = true
  adminForm.value = { name: row.name, account: row.account, phone: row.phone, role: row.role, permKeys: {} }
  row.permissions.forEach(p => {
    const key = allPermissions.find(a => a.label === p)?.key
    if (key) adminForm.value.permKeys[key] = true
  })
  showDialog.value = true
}

function onRoleChange(role) {
  const keys = rolePresets[role] || []
  const permKeys = {}
  allPermissions.forEach(p => { permKeys[p.key] = keys.includes(p.key) })
  adminForm.value.permKeys = permKeys
}

function saveAdmin() {
  if (!adminForm.value.name.trim() || !adminForm.value.account.trim()) {
    ElMessage.warning('请填写姓名和账号'); return
  }
  const perms = allPermissions.filter(p => adminForm.value.permKeys[p.key]).map(p => p.label)
  if (!editMode.value) {
    admins.push({ name: adminForm.value.name, account: adminForm.value.account, role: adminForm.value.role, phone: adminForm.value.phone, permissions: perms, lastLogin: '-', status: '启用', isSuper: false })
    ElMessage.success('管理员已添加')
  } else {
    const target = admins.find(a => a.account === adminForm.value.account)
    if (target) { target.name = adminForm.value.name; target.role = adminForm.value.role; target.phone = adminForm.value.phone; target.permissions = perms }
    ElMessage.success('管理员信息已更新')
  }
  showDialog.value = false
}

function resetPwd(row) {
  ElMessageBox.confirm(`确认重置"${row.name}"的登录密码？重置后将发送新密码到其手机。`, '重置密码', { type: 'warning' })
    .then(() => ElMessage.success('密码已重置，新密码已发送到 ' + row.phone)).catch(() => {})
}

function toggleAdmin(row) {
  const action = row.status === '启用' ? '禁用' : '启用'
  ElMessageBox.confirm(`确认${action}"${row.name}"的管理员账号？`, action + '确认', { type: 'warning' })
    .then(() => { row.status = row.status === '启用' ? '禁用' : '启用'; ElMessage.success(`已${action}`) }).catch(() => {})
}
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
