<template>
  <div class="audit-page">
    <h2>资源审核</h2>
    <div class="pending-banner"><el-icon color="#F56C6C" :size="20"><Warning /></el-icon>当前待审核资源 <strong>8条</strong>，请及时处理</div>
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
    <el-table :data="resources" stripe border @selection-change="selected = $event">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="title" label="资源标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="110"><template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template></el-table-column>
      <el-table-column prop="merchant" label="发布商家" width="140" />
      <el-table-column prop="merchantLevel" label="会员等级" width="100"><template #default="{ row }"><el-tag :type="levelColors[row.merchantLevel]" size="small">{{ row.merchantLevel }}</el-tag></template></el-table-column>
      <el-table-column prop="submitTime" label="提交时间" width="150" />
      <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status==='待审核'?'warning':row.status==='已通过'?'success':'danger'" size="small">{{ row.status }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewResource(row)">查看</el-button>
          <el-button v-if="row.status==='待审核'" text type="success" size="small" @click="approveResource(row)">通过</el-button>
          <el-button v-if="row.status==='待审核'" text type="danger" size="small" @click="openRejectDialog(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="25" :page-size="10" /></div>

    <!-- 资源详情对话框 -->
    <el-dialog v-model="showDetail" title="资源详情" width="700px" v-if="currentResource">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资源标题" :span="2">{{ currentResource.title }}</el-descriptions-item>
        <el-descriptions-item label="资源类型">
          <el-tag size="small">{{ currentResource.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="currentResource.status==='待审核'?'warning':currentResource.status==='已通过'?'success':'danger'" size="small">{{ currentResource.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布商家">{{ currentResource.merchant }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="levelColors[currentResource.merchantLevel]" size="small">{{ currentResource.merchantLevel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentResource.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="可适用社区类型">{{ currentResource.detail?.suitableCommunity || '亲子型、老年型社区均可' }}</el-descriptions-item>
        <el-descriptions-item label="资源说明" :span="2">{{ currentResource.detail?.desc || '可提供资金赞助，用于社区公益活动，金额可面议，最低5000元。' }}</el-descriptions-item>
        <el-descriptions-item label="期望回报" :span="2">{{ currentResource.detail?.reward || '冠名权、展台位置、社区公众号推文1篇' }}</el-descriptions-item>
        <el-descriptions-item label="有效期">{{ currentResource.detail?.validUntil || '2026-12-31' }}</el-descriptions-item>
        <el-descriptions-item label="标签">
          <el-tag v-for="tag in (currentResource.detail?.tags || ['公益赞助','亲子活动'])" :key="tag" size="small" style="margin-right:4px">{{ tag }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="currentResource.status === '已驳回' && currentResource.rejectReason" style="margin-top:12px;padding:12px;background:#fff5f5;border-radius:6px;color:#F56C6C">
        <strong>驳回原因：</strong>{{ currentResource.rejectReason }}
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentResource.status==='待审核'" type="success" @click="approveResource(currentResource); showDetail=false">通过</el-button>
        <el-button v-if="currentResource.status==='待审核'" type="danger" @click="openRejectDialog(currentResource); showDetail=false">驳回</el-button>
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const filterType = ref(''), filterStatus = ref('待审核'), searchKey = ref('')
const selected = ref([]), showDetail = ref(false), showRejectDialog = ref(false)
const currentResource = ref(null), rejectReason = ref(''), rejectTarget = ref(null)

const levelColors = { '普通会员': 'info', '银牌会员': '', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }

const resources = reactive([
  {
    title: '星巴克赞助活动资金5万元', type: '资金赞助', merchant: '星巴克咖啡', merchantLevel: '金牌会员', submitTime: '2026-04-01 11:00', status: '待审核', rejectReason: '',
    detail: { suitableCommunity: '亲子型、年轻家庭社区', desc: '提供活动赞助资金，最多5万元，用于社区公益亲子类活动。', reward: '冠名权、展台2个、公众号推文2篇', validUntil: '2026-12-31', tags: ['资金赞助', '亲子活动', '公益'] }
  },
  {
    title: '新东方提供亲子教育讲座', type: '专业服务', merchant: '新东方教育', merchantLevel: '铂金会员', submitTime: '2026-04-01 10:00', status: '待审核', rejectReason: '',
    detail: { suitableCommunity: '有幼儿园或小学的社区', desc: '提供专业讲师进社区开展亲子教育公益讲座，可按需定制内容。', reward: '教育机构宣传展台1个、课程资料展架1个', validUntil: '2026-09-30', tags: ['教育服务', '亲子家庭', '公益讲座'] }
  },
  {
    title: '京东健康义诊服务', type: '专业服务', merchant: '京东健康', merchantLevel: '铂金会员', submitTime: '2026-03-31 15:00', status: '已通过', rejectReason: '',
    detail: { suitableCommunity: '老年群体占比较高社区', desc: '派驻执业医师开展义诊，提供血压、血糖等免费检测服务。', reward: '健康服务品牌展示、社区公告栏宣传', validUntil: '2026-12-31', tags: ['医疗健康', '老年服务', '义诊'] }
  },
  {
    title: '华润万家节日物资捐赠', type: '物资提供', merchant: '华润万家', merchantLevel: '金牌会员', submitTime: '2026-03-30 09:00', status: '已通过', rejectReason: '',
    detail: { suitableCommunity: '各类社区均可', desc: '在传统节日期间提供食品、生活物资等捐赠，最多2万元物资。', reward: '超市优惠展位展示、社区广播宣传', validUntil: '2026-12-31', tags: ['物资赞助', '节庆活动'] }
  }
])

function viewResource(row) { currentResource.value = row; showDetail.value = true }

function approveResource(row) {
  ElMessageBox.confirm(`确认通过"${row.title}"的审核？`, '审核确认', { type: 'success' })
    .then(() => { row.status = '已通过'; ElMessage.success('已通过审核') }).catch(() => {})
}

function openRejectDialog(row) { rejectTarget.value = row; rejectReason.value = ''; showRejectDialog.value = true }

function confirmReject() {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  rejectTarget.value.status = '已驳回'
  rejectTarget.value.rejectReason = rejectReason.value
  showRejectDialog.value = false
  ElMessage.success('已驳回，原因已通知商家')
}

function batchApprove() {
  ElMessageBox.confirm(`确认批量通过选中的 ${selected.value.length} 条资源？`, '批量审核确认', { type: 'success' })
    .then(() => {
      selected.value.forEach(r => { if (r.status === '待审核') r.status = '已通过' })
      ElMessage.success('批量通过成功')
    }).catch(() => {})
}
</script>
<style scoped>
.audit-page { max-width: 1200px; margin: 0 auto; }
.audit-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.pending-banner { background: #fff5f5; border: 1px solid #ffd0d0; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #F56C6C; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
