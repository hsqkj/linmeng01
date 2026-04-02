<template>
  <div class="audit-page">
    <h2>资源审核</h2>
    <div class="pending-banner"><el-icon color="#F56C6C" :size="20"><Warning /></el-icon>当前待审核资源 <strong>{{ pendingCount }}条</strong>，请及时处理</div>
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="资源类型" style="width:130px">
        <el-option label="全部" value="" />
        <el-option v-for="t in ['资金赞助','物资提供','人力支持','技术支持','专业服务','媒体报道']" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="审核状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="待审核" value="待审核" /><el-option label="已通过" value="已通过" /><el-option label="已驳回" value="已驳回" />
      </el-select>
      <el-input v-model="searchKey" placeholder="搜索资源名称" style="width:200px" clearable />
      <el-button type="primary" :disabled="!selected.length" @click="batchApprove">批量通过</el-button>
    </div>
    <el-table :data="resources" stripe border @selection-change="selected = $event" v-loading="loading">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="title" label="资源标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="resource_type" label="类型" width="110"><template #default="{ row }"><el-tag size="small">{{ row.resource_type }}</el-tag></template></el-table-column>
      <el-table-column prop="company_name" label="发布商家" width="140" />
      <el-table-column prop="member_level" label="会员等级" width="100"><template #default="{ row }"><el-tag :type="levelColors[levelLabel(row.member_level)]" size="small">{{ levelLabel(row.member_level) }}</el-tag></template></el-table-column>
      <el-table-column prop="created_at" label="提交时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag :type="statusColors[row.status]" size="small">{{ statusLabels[row.status] }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewResource(row)">查看</el-button>
          <el-button v-if="row.status === 0" text type="success" size="small" @click="approveResource(row)">通过</el-button>
          <el-button v-if="row.status === 0" text type="danger" size="small" @click="openRejectDialog(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <!-- 资源详情对话框 -->
    <el-dialog v-model="showDetail" title="资源详情" width="700px" v-if="currentResource">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资源标题" :span="2">{{ currentResource.title }}</el-descriptions-item>
        <el-descriptions-item label="资源类型"><el-tag size="small">{{ currentResource.resource_type }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="审核状态"><el-tag :type="statusColors[currentResource.status]" size="small">{{ statusLabels[currentResource.status] }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="发布商家">{{ currentResource.company_name }}</el-descriptions-item>
        <el-descriptions-item label="会员等级"><el-tag :type="levelColors[levelLabel(currentResource.member_level)]" size="small">{{ levelLabel(currentResource.member_level) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ fmtTime(currentResource.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="服务范围">{{ currentResource.service_scope || '—' }}</el-descriptions-item>
        <el-descriptions-item label="资源说明" :span="2">{{ currentResource.content || '—' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="currentResource.status === 2 && currentResource.reject_reason" style="margin-top:12px;padding:12px;background:#fff5f5;border-radius:6px;color:#F56C6C">
        <strong>驳回原因：</strong>{{ currentResource.reject_reason }}
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentResource.status === 0" type="success" @click="approveResource(currentResource); showDetail=false">通过</el-button>
        <el-button v-if="currentResource.status === 0" type="danger" @click="openRejectDialog(currentResource); showDetail=false">驳回</el-button>
      </template>
    </el-dialog>

    <!-- 驳回对话框 -->
    <el-dialog v-model="showRejectDialog" title="资源驳回" width="420px">
      <el-form label-position="top">
        <el-form-item label="驳回原因（将通知商家）" required>
          <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="如：资源描述不明确，请补充具体内容..." />
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
import { getResourceAuditList, passResource, rejectResource } from '@/api/admin'

const filterType = ref(''), filterStatus = ref('待审核'), searchKey = ref('')
const selected = ref([]), showDetail = ref(false), showRejectDialog = ref(false)
const currentResource = ref(null), rejectReason = ref(''), rejectTarget = ref(null)
const resources = ref([])
const loading = ref(false)
const total = ref(0)
const pendingCount = ref(0)
const page = ref(1)
const pageSize = 10

const levelLabel = (lvl) => ({ 1:'普通会员', 2:'银牌会员', 3:'金牌会员', 4:'铂金会员', 5:'钻石会员' })[lvl] || '普通会员'
const levelColors = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }
const statusLabels = { 0: '待审核', 1: '已通过', 2: '已驳回' }
const statusColors = { 0: 'warning', 1: 'success', 2: 'danger' }

async function loadResources() {
  loading.value = true
  try {
    const res = await getResourceAuditList({ page: page.value, pageSize })
    resources.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || resources.value.length
    pendingCount.value = res.data?.total || res.data?.pagination?.total || resources.value.length
  } catch { resources.value = [] }
  finally { loading.value = false }
}

onMounted(() => { loadResources() })

function viewResource(row) { currentResource.value = row; showDetail.value = true }

async function approveResource(row) {
  try {
    await ElMessageBox.confirm(`确认通过"${row.title}"的审核？`, '审核确认', { type: 'success' })
    await passResource(row.id)
    row.status = 1
    ElMessage.success('已通过审核')
  } catch {}
}

function openRejectDialog(row) { rejectTarget.value = row; rejectReason.value = ''; showRejectDialog.value = true }

async function confirmReject() {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  try {
    await rejectResource(rejectTarget.value.id, { reason: rejectReason.value })
    rejectTarget.value.status = 2
    rejectTarget.value.reject_reason = rejectReason.value
    showRejectDialog.value = false
    ElMessage.success('已驳回，原因已通知商家')
  } catch { ElMessage.error('操作失败') }
}

async function batchApprove() {
  try {
    await ElMessageBox.confirm(`确认批量通过选中的 ${selected.value.length} 条资源？`, '批量审核确认', { type: 'success' })
    await Promise.allSettled(selected.value.map(r => passResource(r.id)))
    ElMessage.success('批量通过成功')
    loadResources()
  } catch {}
}

function onPageChange(p) { page.value = p; loadResources() }
function fmtTime(t) { return t ? String(t).slice(0, 16).replace('T', ' ') : '' }
</script>
<style scoped>
.audit-page { max-width: 1200px; margin: 0 auto; }
.audit-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.pending-banner { background: #fff5f5; border: 1px solid #ffd0d0; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #F56C6C; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
