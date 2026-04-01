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
    <el-table :data="demands" stripe border @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="name" label="需求名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="90">
        <template #default="{ row }"><el-tag :type="typeColors[row.type]" size="small">{{ row.type }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="community" label="发布社区" width="130" />
      <el-table-column prop="submitTime" label="提交时间" width="150" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusColors[row.status]" size="small">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
          <el-button v-if="row.status === '待审核'" text type="success" size="small" @click="approve(row)">通过</el-button>
          <el-button v-if="row.status === '待审核'" text type="danger" size="small" @click="openRejectDialog(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="35" :page-size="10" /></div>

    <!-- 需求详情对话框 -->
    <el-dialog v-model="showDetail" title="需求详情" width="720px">
      <div v-if="currentRow" class="detail-view">
        <div class="detail-header">
          <h3>{{ currentRow.name }}</h3>
          <el-tag :type="typeColors[currentRow.type]">{{ currentRow.type }}</el-tag>
          <el-tag :type="statusColors[currentRow.status]">{{ currentRow.status }}</el-tag>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布社区">{{ currentRow.community }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentRow.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="活动时间" :span="2">2026-06-01 09:00 ~ 17:00</el-descriptions-item>
          <el-descriptions-item label="活动类型">亲子活动</el-descriptions-item>
          <el-descriptions-item label="活动地点">室外 · 南门广场</el-descriptions-item>
          <el-descriptions-item label="预计参与人数">800人</el-descriptions-item>
          <el-descriptions-item label="目标人群">亲子家庭、老年群体</el-descriptions-item>
          <el-descriptions-item label="所需赞助类型">资金赞助（5万元）、物资提供（气球道具等）</el-descriptions-item>
          <el-descriptions-item label="商家可获回报">冠名权、展台2个、公众号推文3篇、社区LED广告屏1周</el-descriptions-item>
          <el-descriptions-item label="活动描述" :span="2">本次活动为社区年度亲子活动，预计参与800名居民，诚邀企业赞助，企业将获得充分的品牌曝光机会...</el-descriptions-item>
        </el-descriptions>
        <div class="audit-actions" v-if="currentRow.status === '待审核'">
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:12px">
            <el-button type="success" @click="approve(currentRow); showDetail=false">审核通过</el-button>
            <el-button type="danger" @click="openRejectDialog(currentRow); showDetail=false">驳回</el-button>
          </div>
        </div>
        <div v-if="currentRow.status === '已驳回' && currentRow.rejectReason" style="margin-top:12px;padding:12px;background:#fff5f5;border-radius:6px;color:#F56C6C">
          <strong>驳回原因：</strong>{{ currentRow.rejectReason }}
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const filterType = ref(''), filterStatus = ref('待审核'), searchKey = ref('')
const selectedRows = ref([]), showDetail = ref(false), showRejectDialog = ref(false)
const currentRow = ref(null), rejectReason = ref(''), rejectTarget = ref(null)

const typeColors = { '活动赞助': 'primary', '专家服务': 'success', '空间运营': 'warning' }
const statusColors = { '待审核': 'warning', '已通过': 'success', '已驳回': 'danger' }

const demands = reactive([
  { name: '六一儿童节亲子嘉年华赞助', type: '活动赞助', community: '阳光花园社区', submitTime: '2026-04-01 09:15', status: '待审核', rejectReason: '' },
  { name: '老年人心理健康讲座', type: '专家服务', community: '幸福里社区', submitTime: '2026-04-01 10:30', status: '待审核', rejectReason: '' },
  { name: '社区广场运营合作', type: '空间运营', community: '翠竹苑社区', submitTime: '2026-03-31 16:40', status: '待审核', rejectReason: '' },
  { name: '端午节包粽子活动', type: '活动赞助', community: '幸福里社区', submitTime: '2026-03-30 14:20', status: '已通过', rejectReason: '' },
  { name: '亲子编程启蒙课', type: '专家服务', community: '阳光花园社区', submitTime: '2026-03-29 09:10', status: '已驳回', rejectReason: '内容描述不清晰，请补充专家服务的具体内容和时间安排后重新提交。' }
])

function viewDetail(row) { currentRow.value = row; showDetail.value = true }

function approve(row) {
  ElMessageBox.confirm(`确认通过"${row.name}"的审核？通过后将对商家展示。`, '审核确认', {
    type: 'success', confirmButtonText: '确认通过', cancelButtonText: '取消'
  }).then(() => { row.status = '已通过'; ElMessage.success('已通过审核') }).catch(() => {})
}

function openRejectDialog(row) {
  rejectTarget.value = row
  rejectReason.value = ''
  showRejectDialog.value = true
}

function confirmReject() {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  rejectTarget.value.status = '已驳回'
  rejectTarget.value.rejectReason = rejectReason.value
  showRejectDialog.value = false
  ElMessage.success('已驳回，驳回原因已通知发布方')
}

function batchApprove() {
  ElMessageBox.confirm(`确认批量通过选中的 ${selectedRows.value.length} 条需求？`, '批量审核确认', { type: 'success' })
    .then(() => {
      selectedRows.value.forEach(r => { if (r.status === '待审核') r.status = '已通过' })
      ElMessage.success(`已批量通过 ${selectedRows.value.length} 条`)
    }).catch(() => {})
}

function batchReject() {
  ElMessageBox.prompt('请输入批量驳回原因', '批量驳回确认', {
    confirmButtonText: '确认驳回', cancelButtonText: '取消', inputType: 'textarea', inputPlaceholder: '请填写驳回原因'
  }).then(({ value }) => {
    if (!value?.trim()) { ElMessage.warning('请填写原因'); return }
    selectedRows.value.forEach(r => { if (r.status === '待审核') { r.status = '已驳回'; r.rejectReason = value } })
    ElMessage.success('已批量驳回')
  }).catch(() => {})
}
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
