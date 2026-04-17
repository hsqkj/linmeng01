<template>
  <div class="audit-page">
    <h2>资源审核</h2>
    <div class="pending-banner"><el-icon color="#F56C6C" :size="20"><Warning /></el-icon>当前待审核资源 <strong>{{ pendingCount }}条</strong>，请及时处理</div>
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="资源类型" style="width:130px">
        <el-option label="全部" value="" />
        <el-option v-for="(label, key) in resourceTypeNumMap" :key="key" :label="label" :value="Number(key)" />
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
      <el-table-column prop="resource_type" label="类型" width="110"><template #default="{ row }"><el-tag size="small">{{ getResourceTypeName(row.resource_type) }}</el-tag></template></el-table-column>
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
    <el-dialog v-model="showDetail" title="资源详情" width="900px" v-if="currentResource">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资源标题" :span="2">{{ currentResource.title }}</el-descriptions-item>
        <el-descriptions-item label="资源类型"><el-tag size="small">{{ getResourceTypeName(currentResource.resource_type) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="审核状态"><el-tag :type="statusColors[currentResource.status]" size="small">{{ statusLabels[currentResource.status] }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="发布商家">{{ currentResource.company_name }}</el-descriptions-item>
        <el-descriptions-item label="会员等级"><el-tag :type="levelColors[levelLabel(currentResource.member_level)]" size="small">{{ levelLabel(currentResource.member_level) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ fmtTime(currentResource.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="浏览量">{{ currentResource.view_count || 0 }}</el-descriptions-item>

        <!-- 资金赞助字段（类型5或中文"资金赞助"） -->
        <template v-if="getCurrentResourceType() === '资金赞助'">
          <el-descriptions-item v-if="currentResource.min_amount || currentResource.max_amount" label="赞助金额范围" :span="2">
            {{ currentResource.min_amount || 0 }} ~ {{ currentResource.max_amount || 0 }} 元
          </el-descriptions-item>
          <el-descriptions-item v-if="jsonLen(currentResource.fund_scenes) > 0" label="适用场景" :span="2">
            <el-tag v-for="s in mapJsonItems(currentResource.fund_scenes, fundScenesMap)" :key="s" size="small" style="margin-right:4px">{{ s }}</el-tag>
          </el-descriptions-item>
        </template>

        <!-- 物资捐赠字段（类型3或中文"物资捐赠"） -->
        <template v-if="getCurrentResourceType() === '物资捐赠'">
          <el-descriptions-item v-if="currentResource.specs" label="物资清单" :span="2">{{ currentResource.specs }}</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.quantity" label="物资数量">{{ currentResource.quantity }}</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.pickup_way" label="领取方式">
            {{ pickupWayMap[currentResource.pickup_way] || currentResource.pickup_way }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentResource.goods_expiry" label="有效期至">{{ currentResource.goods_expiry }}</el-descriptions-item>
        </template>

        <!-- 人力支持/志愿服务字段（类型4或中文"志愿服务"） -->
        <template v-if="getCurrentResourceType() === '志愿服务'">
          <el-descriptions-item v-if="currentResource.staff_count" label="可派遣人数">{{ currentResource.staff_count }}人</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.work_duration" label="单次服务时长">{{ currentResource.work_duration }}小时</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.skill_requirements" label="人员类型描述" :span="2">{{ currentResource.skill_requirements }}</el-descriptions-item>
        </template>

        <!-- 技术支持字段（类型6或中文"技术支持"） -->
        <template v-if="getCurrentResourceType() === '技术支持'">
          <el-descriptions-item v-if="jsonLen(currentResource.tech_types) > 0" label="技术类型" :span="2">
            <el-tag v-for="t in mapJsonItems(currentResource.tech_types, techTypesMap)" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentResource.tech_service_type" label="服务方式">
            {{ techServiceMap[currentResource.tech_service_type] || currentResource.tech_service_type }}
          </el-descriptions-item>
        </template>

        <!-- 专业服务字段（类型0或中文"专业服务"） -->
        <template v-if="getCurrentResourceType() === '专业服务'">
          <el-descriptions-item v-if="currentResource.professional_type" label="专业服务类型">{{ currentResource.professional_type }}</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.service_scope" label="服务范围">
            {{ serviceScopeMap[currentResource.service_scope] || currentResource.service_scope }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentResource.certification" label="资质证明">{{ currentResource.certification }}</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.price_range" label="收费标准">
            {{ priceRangeMap[currentResource.price_range] || currentResource.price_range }}
          </el-descriptions-item>
        </template>

        <!-- 媒体报道字段（类型9或中文"媒体宣传"） -->
        <template v-if="getCurrentResourceType() === '媒体宣传'">
          <el-descriptions-item v-if="jsonLen(currentResource.media_channels) > 0" label="媒体渠道" :span="2">
            <el-tag v-for="c in safeJsonParse(currentResource.media_channels)" :key="c" size="small" style="margin-right:4px">{{ c }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentResource.media_type" label="媒体类型">{{ currentResource.media_type }}</el-descriptions-item>
          <el-descriptions-item v-if="currentResource.coverage" label="覆盖范围">{{ currentResource.coverage }}</el-descriptions-item>
        </template>
        <!-- 通用字段 -->
        <el-descriptions-item label="资源说明" :span="2">{{ currentResource.content || '—' }}</el-descriptions-item>
        <!-- 标签 -->
        <el-descriptions-item label="资源标签" :span="2">
          <template v-if="jsonLen(currentResource.tags) > 0">
            <el-tag v-for="tag in safeJsonParse(currentResource.tags)" :key="tag" size="small" style="margin-right:4px">{{ tag }}</el-tag>
          </template>
          <span v-else>—</span>
        </el-descriptions-item>
        <!-- 期望回报 -->
        <el-descriptions-item v-if="jsonLen(currentResource.expected_rewards) > 0" label="期望回报类型" :span="2">
          <el-tag v-for="r in safeJsonParse(currentResource.expected_rewards)" :key="r" size="small" type="warning" style="margin-right:4px">{{ r }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentResource.expected_reward_desc" label="期望回报说明" :span="2">{{ currentResource.expected_reward_desc }}</el-descriptions-item>
        <el-descriptions-item v-if="currentResource.valid_until" label="有效期至">{{ currentResource.valid_until }}</el-descriptions-item>
      </el-descriptions>
      <!-- 图片展示 -->
      <div v-if="jsonLen(currentResource.images) > 0" class="detail-images">
        <span class="images-label">资源图片：</span>
        <div class="image-list">
          <el-image 
            v-for="(img, idx) in safeJsonParse(currentResource.images)" 
            :key="idx"
            :src="img" 
            :preview-src-list="safeJsonParse(currentResource.images)"
            fit="cover"
            class="detail-image"
          />
        </div>
      </div>
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

// 安全解析 JSON，返回数组或默认值
function safeJsonParse(str, defaultVal = []) {
  if (!str) return defaultVal
  try {
    const parsed = typeof str === 'string' ? JSON.parse(str) : str
    return Array.isArray(parsed) ? parsed : defaultVal
  } catch {
    return defaultVal
  }
}

// 获取 JSON 数组长度
function jsonLen(str) {
  return safeJsonParse(str).length
}

// 映射 JSON 数组为中文标签
function mapJsonItems(str, map) {
  return safeJsonParse(str).map(item => map[item] || item)
}

const filterType = ref(''), filterStatus = ref('待审核'), searchKey = ref('')
const selected = ref([]), showDetail = ref(false), showRejectDialog = ref(false)
const currentResource = ref(null), rejectReason = ref(''), rejectTarget = ref(null)
const resources = ref([])
const loading = ref(false)
const total = ref(0)
const pendingCount = ref(0)
const page = ref(1)
const pageSize = 10

// 资源类型映射（从API动态加载）
const resourceTypeNumMap = ref({})
const resourceTypeName = ref({})
// 会员等级映射（从API动态加载）
const memberLevelConfig = ref({})
const levelLabel = (lvl) => memberLevelConfig.value[lvl] || 'Lv' + lvl
const levelColors = { 0: 'info', 1: 'info', 2: 'info', 3: 'warning', 4: 'danger', 5: 'danger', '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }
const statusLabels = { 0: '待审核', 1: '已通过', 2: '已驳回' }
const statusColors = { 0: 'warning', 1: 'success', 2: 'danger' }

// 资金场景映射
const fundScenesMap = { festival:'节庆活动', welfare:'公益活动', sports:'体育赛事', education:'教育活动', culture:'文化活动', any:'不限场景' }
// 技术类型映射
const techTypesMap = { equipment:'设备器材', software:'软件系统', network:'网络通信', av:'专业音视频', lighting:'灯光设备', smart:'智能设备' }
// 领取方式映射
const pickupWayMap = { delivery:'可配送', pickup:'自取', both:'均可' }
// 服务方式映射
const techServiceMap = { rent:'设备租借', service:'提供服务团队', both:'均可' }
// 服务范围映射
const serviceScopeMap = { city:'全市', district:'本区', online:'线上' }
// 收费标准映射
const priceRangeMap = { free:'免费', discount:'优惠价', market:'市场价' }

// 获取资源类型名称
function getResourceTypeName(type) {
  if (typeof type === 'string' && resourceTypeName.value[type] !== undefined) {
    return resourceTypeName.value[type]
  }
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeName.value[num] !== undefined) {
    return resourceTypeName.value[num]
  }
  if (typeof type === 'string') {
    return type
  }
  return type || '其他'
}

// 加载资源类型配置和会员等级
async function loadResourceTypes() {
  try {
    const { getPublishTypes, getMemberConfig } = await import('@/api/merchant')
    const [publishRes, memberRes] = await Promise.all([getPublishTypes(), getMemberConfig()])
    // 资源类型
    if (publishRes.data?.resource_types?.length) {
      const map = {}
      publishRes.data.resource_types.forEach((item, idx) => {
        const name = (typeof item === 'object' && item !== null) ? item.name : item
        const id = (typeof item === 'object' && item !== null) ? item.id : idx
        map[id] = name
        map[name] = name
      })
      resourceTypeNumMap.value = map
      resourceTypeName.value = map
    }
    // 会员等级配置
    if (memberRes.data?.member_levels?.length) {
      const map = {}
      memberRes.data.member_levels.forEach(l => {
        map[l.level] = l.name || 'Lv' + l.level
      })
      memberLevelConfig.value = map
    }
  } catch {}
}

// 获取当前资源的资源类型（中文）
function getCurrentResourceType() {
  return getResourceTypeName(currentResource.value?.resource_type)
}

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

onMounted(() => { loadResources(); loadResourceTypes() })

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
.detail-images { margin-top: 16px; }
.images-label { font-size: 14px; color: #606266; display: block; margin-bottom: 8px; }
.image-list { display: flex; flex-wrap: wrap; gap: 8px; }
.detail-image { width: 100px; height: 100px; border-radius: 4px; cursor: pointer; }

@media (max-width: 768px) {
  .audit-page {
    padding: 12px;
    padding-bottom: 70px;
  }
  .audit-page h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  .pending-banner {
    padding: 8px 12px;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .filter-bar {
    gap: 8px;
    margin-bottom: 12px;
  }
  .filter-bar .el-select {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  .filter-bar .el-input {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  .filter-bar .el-button {
    width: calc(50% - 4px);
    font-size: 12px;
    padding: 8px;
  }
  :deep(.el-table) {
    font-size: 11px;
  }
  :deep(.el-table__header th) {
    font-size: 10px;
    padding: 6px 3px;
  }
  :deep(.el-table__body td) {
    padding: 6px 3px;
  }
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 700px;
  }
  :deep(.el-dialog__body) {
    padding: 12px;
  }
  .pagination {
    justify-content: center;
  }
}
</style>
