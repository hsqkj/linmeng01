<template>
  <div class="page"><h2>撮合管理</h2>
    <div class="stats-row">
      <div class="sc" v-for="s in stats" :key="s.label"><div class="sv" :style="{color:s.color}">{{ s.value }}</div><div class="sl">{{ s.label }}</div></div>
    </div>
    <div class="filter-bar">
      <el-input v-model="searchKey" placeholder="搜索需求名称/商家/社区" style="width:220px" clearable />
      <el-select v-model="filterStatus" placeholder="状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="进行中" value="进行中" /><el-option label="已完成" value="已完成" />
      </el-select>
      <el-select v-model="filterReward" placeholder="奖励状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="待发放" value="待发放" /><el-option label="已发放" value="已发放" />
      </el-select>
    </div>
    <el-table :data="matchings" stripe border v-loading="loading">
      <el-table-column type="index" width="50" />
      <el-table-column prop="demand_title" label="需求名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="community_name" label="社区" width="130" />
      <el-table-column prop="company_name" label="商家" width="130" />
      <el-table-column prop="resource_title" label="提供资源" width="130" />
      <el-table-column prop="created_at" label="撮合时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusTag[row.status]" size="small">{{ statusLabels[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          <el-button text type="success" size="small" v-if="row.status !== 3" @click="grantReward(row)">发放奖励</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <!-- 撮合详情对话框 -->
    <el-dialog v-model="showDetail" title="撮合详情" width="700px" v-if="currentMatching">
      <el-descriptions :column="2" border title="撮合信息">
        <el-descriptions-item label="需求名称" :span="2">{{ currentMatching.demand_title || '—' }}</el-descriptions-item>
        <el-descriptions-item label="社区方">{{ currentMatching.community_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="商家方">{{ currentMatching.company_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="撮合时间">{{ fmtTime(currentMatching.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="撮合状态">
          <el-tag :type="statusTag[currentMatching.status]" size="small">{{ statusLabels[currentMatching.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentMatching.completed_at ? fmtTime(currentMatching.completed_at) : '进行中' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentMatching.status !== 3" type="success" @click="grantReward(currentMatching); showDetail=false">发放奖励</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMatchingList, grantReward as grantRewardApi } from '@/api/admin'

const filterStatus = ref(''), filterReward = ref(''), searchKey = ref('')
const showDetail = ref(false), currentMatching = ref(null)
const matchings = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10

const statusLabels = { 0: '待回复', 1: '已接受', 2: '已拒绝', 3: '已完成' }
const statusTag = { 0: 'warning', 1: 'success', 2: 'info', 3: 'primary' }

async function loadMatchings() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (searchKey.value) params.keyword = searchKey.value
    // 状态筛选：进行中(status!=3)，已完成(status=3)
    const statusMap = { '进行中': '0,1,2', '已完成': '3' }
    if (filterStatus.value) params.status_in = statusMap[filterStatus.value]
    const res = await getMatchingList(params)
    matchings.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || matchings.value.length
  } catch { matchings.value = [] }
  finally { loading.value = false }
}

onMounted(() => { loadMatchings() })

watch([searchKey, filterStatus, filterReward], () => {
  page.value = 1
  loadMatchings()
})

function viewDetail(row) { currentMatching.value = row; showDetail.value = true }

async function grantReward(row) {
  try {
    await ElMessageBox.confirm(
      `确认发放撮合奖励？\n\n撮合项目：${row.demand_title || row.title}\n商家：${row.company_name}\n社区：${row.community_name}`,
      '发放奖励确认',
      { type: 'success', confirmButtonText: '确认发放', cancelButtonText: '取消' }
    )
    await grantRewardApi(row.id, { content: '撮合成功奖励物资（价值约200元）' })
    row.status = 3
    ElMessage.success('奖励已发放！')
    loadMatchings()
  } catch {}
}

function onPageChange(p) { page.value = p; loadMatchings() }
function fmtTime(t) { return t ? String(t).slice(0, 16).replace('T', ' ') : '' }
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.sc { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.sv { font-size: 28px; font-weight: 700; }
.sl { font-size: 13px; color: #909399; margin-top: 4px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
