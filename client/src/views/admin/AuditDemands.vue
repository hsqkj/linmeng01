<template>
  <div class="audit-page">
    <h2>需求审核</h2>
    <div class="pending-banner">
      <el-icon color="#F56C6C" :size="20"><Warning /></el-icon>
      当前待审核需求 <strong>12条</strong>，请及时处理
    </div>
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="需求类型" style="width:130px">
        <el-option label="全部" value="" />
        <el-option label="活动赞助" value="活动赞助" />
        <el-option label="专家服务" value="专家服务" />
        <el-option label="空间运营" value="空间运营" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="审核状态" style="width:130px">
        <el-option label="全部" value="" />
        <el-option label="待审核" value="待审核" />
        <el-option label="已通过" value="已通过" />
        <el-option label="已驳回" value="已驳回" />
      </el-select>
      <el-input v-model="searchKey" placeholder="搜索需求名称" style="width:200px" clearable />
      <el-button type="primary" :disabled="!selectedRows.length" @click="batchApprove">批量通过（{{ selectedRows.length }}）</el-button>
      <el-button type="danger" :disabled="!selectedRows.length" @click="batchReject">批量驳回（{{ selectedRows.length }}）</el-button>
    </div>
    <el-table :data="demands" stripe border @selection-change="selectedRows = $event" v-loading="loading">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="title" label="需求名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="demand_type" label="类型" width="90">
        <template #default="{ row }"><el-tag :type="typeColors[row.demand_type]" size="small">{{ typeLabels[row.demand_type] || row.demand_type }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="community_name" label="发布社区" width="130" />
      <el-table-column prop="created_at" label="提交时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusColors[row.status]" size="small">{{ statusLabels[row.status] || row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
          <el-button v-if="row.status === 0" text type="success" size="small" @click="approve(row)">通过</el-button>
          <el-button v-if="row.status === 0" text type="danger" size="small" @click="openRejectDialog(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <!-- 需求详情对话框 -->
    <el-dialog v-model="showDetail" title="需求详情" width="720px">
      <div v-if="currentRow" class="detail-view">
        <div class="detail-header">
          <h3>{{ currentRow.title }}</h3>
          <el-tag :type="typeColors[currentRow.demand_type]">{{ typeLabels[currentRow.demand_type] }}</el-tag>
          <el-tag :type="statusColors[currentRow.status]">{{ statusLabels[currentRow.status] }}</el-tag>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布社区">{{ currentRow.community_name }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ fmtTime(currentRow.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="活动类型">{{ currentRow.activity_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="目标人群">{{ (currentRow.target_audience || []).join('、') || '—' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentRow.start_time || '—' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentRow.end_time || '—' }}</el-descriptions-item>
          <el-descriptions-item label="活动地点">{{ currentRow.location_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="预计参与">{{ currentRow.expected_count ? currentRow.expected_count + '人' : '—' }}</el-descriptions-item>
          <el-descriptions-item label="需求详情" :span="2">{{ currentRow.content || '—' }}</el-descriptions-item>
        </el-descriptions>
        <div class="audit-actions" v-if="currentRow.status === 0">
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:12px">
            <el-button type="success" @click="approve(currentRow); showDetail=false">审核通过</el-button>
            <el-button type="danger" @click="openRejectDialog(currentRow); showDetail=false">驳回</el-button>
          </div>
        </div>
        <div v-if="currentRow.status === 2 && currentRow.reject_reason" style="margin-top:12px;padding:12px;background:#fff5f5;border-radius:6px;color:#F56C6C">
          <strong>驳回原因：</strong>{{ currentRow.reject_reason }}
        </div>
      </div>
    </el-dialog>

    <!-- 驳回原因对话框 -->
    <el-dialog v-model="showRejectDialog" title="驳回原因" width="420px">
      <el-form label-position="top">
        <el-form-item label="请填写驳回原因（将通知发布方）" required>
          <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="如：内容不符合发布规范，请修改后重新提交..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { getDemandAuditList, passDemand, rejectDemand } from '@/api/admin'

const filterType = ref(''), filterStatus = ref('待审核'), searchKey = ref('')
const selectedRows = ref([]), showDetail = ref(false), showRejectDialog = ref(false)
const currentRow = ref(null), rejectReason = ref(''), rejectTarget = ref(null)
const demands = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10

const typeLabels = { 1: '活动赞助', 2: '专家服务', 3: '空间运营' }
const typeColors = { 1: 'primary', 2: 'success', 3: 'warning' }
const statusLabels = { 0: '待审核', 1: '已通过', 2: '已驳回' }
const statusColors = { 0: 'warning', 1: 'success', 2: 'danger' }

async function loadDemands() {
  loading.value = true
  try {
    const res = await getDemandAuditList({ page: page.value, pageSize })
    demands.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || demands.value.length
  } catch { demands.value = [] }
  finally { loading.value = false }
}

onMounted(() => { loadDemands() })

function viewDetail(row) { currentRow.value = row; showDetail.value = true }

async function approve(row) {
  try {
    await ElMessageBox.confirm(`确认通过"${row.title}"的审核？通过后将对商家展示。`, '审核确认', { type: 'success', confirmButtonText: '确认通过', cancelButtonText: '取消' })
    await passDemand(row.id)
    row.status = 1
    ElMessage.success('已通过审核')
  } catch {}
}

function openRejectDialog(row) {
  rejectTarget.value = row
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  try {
    await rejectDemand(rejectTarget.value.id, { reason: rejectReason.value })
    rejectTarget.value.status = 2
    rejectTarget.value.reject_reason = rejectReason.value
    showRejectDialog.value = false
    ElMessage.success('已驳回，驳回原因已通知发布方')
  } catch { ElMessage.error('操作失败') }
}

async function batchApprove() {
  try {
    await ElMessageBox.confirm(`确认批量通过选中的 ${selectedRows.value.length} 条需求？`, '批量审核确认', { type: 'success' })
    await Promise.allSettled(selectedRows.value.map(r => passDemand(r.id)))
    ElMessage.success(`已批量通过 ${selectedRows.value.length} 条`)
    loadDemands()
  } catch {}
}

async function batchReject() {
  try {
    const { value } = await ElMessageBox.prompt('请输入批量驳回原因', '批量驳回确认', {
      confirmButtonText: '确认驳回', cancelButtonText: '取消', inputType: 'textarea', inputPlaceholder: '请填写驳回原因'
    })
    if (!value?.trim()) { ElMessage.warning('请填写原因'); return }
    await Promise.allSettled(selectedRows.value.map(r => rejectDemand(r.id, { reason: value })))
    ElMessage.success('已批量驳回')
    loadDemands()
  } catch {}
}

function onPageChange(p) { page.value = p; loadDemands() }
function fmtTime(t) { return t ? String(t).slice(0, 16).replace('T', ' ') : '' }
</script>

<style scoped>
.audit-page { max-width: 1200px; margin: 0 auto; }
.audit-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.pending-banner { background: #fff5f5; border: 1px solid #ffd0d0; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #F56C6C; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.detail-header h3 { margin: 0; }
.audit-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
</style>
