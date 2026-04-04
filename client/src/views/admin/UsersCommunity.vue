<template>
  <div class="users-page">
    <h2>社区工作者管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索社区名称/姓名" style="width:240px" clearable />
      <el-select v-model="filterDistrict" placeholder="所属街道" style="width:140px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="d in districtOptions" :key="d.value" :label="d.label" :value="d.value" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="审核状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="待审核" value="待审核" /><el-option label="已通过" value="已通过" /><el-option label="已禁用" value="已禁用" />
      </el-select>
    </div>
    <el-table :data="users" stripe border v-loading="loading">
      <el-table-column type="index" width="50" />
      <el-table-column prop="real_name" label="姓名" width="90" />
      <el-table-column prop="community_name" label="所属社区" min-width="150" />
      <el-table-column prop="district" label="所属街道" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="created_at" label="注册时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag[row.status]" size="small">{{ statusLabels[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewUser(row)">详情</el-button>
          <el-button v-if="row.status === 0" text type="success" size="small" @click="approveUser(row)">通过</el-button>
          <el-button v-if="row.status === 1" text type="danger" size="small" @click="disableUser(row)">禁用</el-button>
          <el-button v-if="row.status === 2" text type="success" size="small" @click="enableUser(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <!-- 社区详细信息对话框 -->
    <el-dialog v-model="showDetail" title="社区工作者详细信息" width="800px" v-if="currentUser">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ currentUser.real_name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
            <el-descriptions-item label="社区名称" :span="2">{{ currentUser.community_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="所属街道">{{ currentUser.district || '—' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ fmtTime(currentUser.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="statusTag[currentUser.status]" size="small">{{ statusLabels[currentUser.status] }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="发布记录" name="records">
          <el-empty description="暂无发布记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="标签" name="tags">
          <el-empty description="暂无标签信息" :image-size="60" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentUser.status === 0" type="success" @click="approveUser(currentUser); showDetail=false">通过审核</el-button>
        <el-button v-if="currentUser.status === 1" type="danger" @click="disableUser(currentUser); showDetail=false">禁用账号</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommunities, updateCommunityStatus, getRegions } from '@/api/admin'

const search = ref(''), filterDistrict = ref(''), filterStatus = ref('')
const showDetail = ref(false), currentUser = ref(null), detailTab = ref('basic')
const users = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10
const districtOptions = ref([])

async function loadDistrictOptions() {
  try {
    const res = await getRegions({ level: 2 })
    const list = res.data?.list || res.data || []
    districtOptions.value = list.map(r => ({ label: r.name, value: r.name }))
  } catch { districtOptions.value = [] }
}

const statusLabels = { 0: '待审核', 1: '已通过', 2: '已禁用' }
const statusTag = { 0: 'warning', 1: 'success', 2: 'danger' }

async function loadUsers() {
  loading.value = true
  try {
    const statusMap = { '待审核': 0, '已通过': 1, '已禁用': 2 }
    const params = { page: page.value, pageSize }
    if (filterStatus.value) params.status = statusMap[filterStatus.value]
    if (search.value) params.keyword = search.value
    const res = await getCommunities(params)
    users.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || users.value.length
  } catch { users.value = [] }
  finally { loading.value = false }
}

onMounted(() => { loadUsers(); loadDistrictOptions() })

watch([search, filterDistrict, filterStatus], () => {
  page.value = 1
  loadUsers()
})

function viewUser(row) { currentUser.value = row; detailTab.value = 'basic'; showDetail.value = true }

async function approveUser(row) {
  try {
    await ElMessageBox.confirm('确认通过该社区工作者的注册审核？', '审核确认', { type: 'success', confirmButtonText: '确认通过', cancelButtonText: '取消' })
    await updateCommunityStatus(row.id, { status: 1 })
    row.status = 1
    ElMessage.success('已通过审核')
  } catch {}
}

async function disableUser(row) {
  try {
    await ElMessageBox.confirm(`确认禁用该社区账号？禁用后该用户将无法登录平台。`, '禁用确认', { type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消' })
    await updateCommunityStatus(row.id, { status: 2 })
    row.status = 2
    ElMessage.success('已禁用')
  } catch {}
}

async function enableUser(row) {
  try {
    await ElMessageBox.confirm('确认恢复该账号？', '恢复确认', { type: 'info' })
    await updateCommunityStatus(row.id, { status: 1 })
    row.status = 1
    ElMessage.success('账号已恢复')
  } catch {}
}

function onPageChange(p) { page.value = p; loadUsers() }
function fmtTime(t) { return t ? String(t).slice(0, 16).replace('T', ' ') : '' }
</script>
<style scoped>
.users-page { max-width: 1200px; margin: 0 auto; }
.users-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.tags-section { padding: 8px 0; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
