<template>
  <div class="demands-list-page">
    <h2>需求列表</h2>
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="需求类型" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option label="活动赞助" value="活动赞助" />
        <el-option label="专家服务" value="专家服务" />
        <el-option label="空间运营" value="空间运营" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option label="待审核" :value="0" />
        <el-option label="已通过" :value="1" />
        <el-option label="已驳回" :value="2" />
      </el-select>
      <el-input v-model="searchKey" placeholder="搜索需求名称" style="width:200px" clearable @keyup.enter="loadData" />
      <el-button type="primary" @click="loadData">搜索</el-button>
    </div>
    <el-table :data="demands" stripe border v-loading="loading">
      <el-table-column prop="title" label="需求名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="demand_type" label="类型" width="90">
        <template #default="{ row }"><el-tag :type="typeColors[row.demand_type]" size="small">{{ typeLabels[row.demand_type] || row.demand_type }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="community_name" label="发布社区" width="130" />
      <el-table-column prop="view_count" label="浏览量" width="80" align="center" />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusColors[row.status]" size="small">{{ statusLabels[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetail" title="需求详情" width="720px">
      <div v-if="currentRow">
        <div class="detail-header">
          <h3>{{ currentRow.title }}</h3>
          <el-tag :type="typeColors[currentRow.demand_type]">{{ typeLabels[currentRow.demand_type] }}</el-tag>
          <el-tag :type="statusColors[currentRow.status]">{{ statusLabels[currentRow.status] }}</el-tag>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布社区">{{ currentRow.community_name }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ fmtTime(currentRow.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="活动类型">{{ currentRow.activity_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="目标人群">{{ (currentRow.target_audience || []).join('、') || '—' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ fmtTime(currentRow.start_time) || '—' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ fmtTime(currentRow.end_time) || '—' }}</el-descriptions-item>
          <el-descriptions-item label="活动地点">{{ currentRow.location_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="预计参与">{{ currentRow.expected_count ? currentRow.expected_count + '人' : '—' }}</el-descriptions-item>
          <el-descriptions-item label="需求详情" :span="2">{{ currentRow.content || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const demands = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKey = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showDetail = ref(false)
const currentRow = ref(null)

const typeLabels = {
  0: '活动赞助', 1: '专家服务', 2: '空间运营',
  3: '物资赞助', 4: '健康服务', 5: '教育培训'
}
const typeColors = {
  0: 'primary', 1: 'success', 2: 'warning',
  3: 'danger', 4: 'info', 5: 'warning'
}
const statusColors = { 0: 'info', 1: 'success', 2: 'danger' }
const statusLabels = { 0: '待审核', 1: '已通过', 2: '已驳回' }

function fmtTime(t) {
  if (!t) return '—'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKey.value) params.keyword = searchKey.value
    if (filterType.value) params.type = filterType.value
    if (filterStatus.value !== '') params.status = filterStatus.value
    const res = await request.get('/admin/demands', { params })
    demands.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || 0
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  page.value = p
  loadData()
}

function viewDetail(row) {
  currentRow.value = row
  showDetail.value = true
}

onMounted(() => { loadData() })
</script>

<style scoped>
.demands-list-page h2 { margin-bottom: 20px; font-size: 18px; font-weight: 600; }
.filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.detail-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.detail-header h3 { margin: 0; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
