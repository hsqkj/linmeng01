<template>
  <div class="dashboard" v-loading="loading">
    <div class="dashboard-header">
      <h2>数据大屏</h2>
      <div class="period-filter">
        <el-radio-group v-model="period" size="default" @change="loadDashboard">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="day">今日</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="year">本年</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 统计数据卡片 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-number" style="color:#409EFF">{{ stats.total?.communities || 0 }}</div>
        <div class="stat-label">社区用户</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#67C23A">{{ stats.total?.merchants || 0 }}</div>
        <div class="stat-label">商家用户</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#E6A23C">{{ stats.total?.ambassadors || 0 }}</div>
        <div class="stat-label">招商大使</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#f56c6c">{{ stats.total?.demands || 0 }}</div>
        <div class="stat-label">已发布需求</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#36cfc9">{{ stats.total?.resources || 0 }}</div>
        <div class="stat-label">已发布资源</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#b37feb">{{ stats.total?.totalViews || 0 }}</div>
        <div class="stat-label">总浏览量</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#73d13d">{{ stats.total?.completedMatches || 0 }}</div>
        <div class="stat-label">撮合成功</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#9254de">{{ stats.total?.comments || 0 }}</div>
        <div class="stat-label">留言数</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#ff7875">{{ stats.total?.experts || 0 }}</div>
        <div class="stat-label">专家数量</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#909399">{{ pendingTotal }}</div>
        <div class="stat-label">待审核</div>
        <el-button type="warning" size="small" style="margin-top:8px" @click="router.push('/admin/audit/demands')">去审核</el-button>
      </el-card>
    </div>

    <!-- 待审核统计 -->
    <el-card class="mb-20">
      <template #header><span>待审核统计</span></template>
      <div class="pending-items">
        <div class="pending-item">
          <span>待审核社区</span><strong>{{ stats.pending?.communities || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/users/community')">查看</el-button>
        </div>
        <div class="pending-item">
          <span>待审核商家</span><strong>{{ stats.pending?.merchants || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/users/merchant')">查看</el-button>
        </div>
        <div class="pending-item">
          <span>待审核需求</span><strong>{{ stats.pending?.demands || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/audit/demands')">查看</el-button>
        </div>
        <div class="pending-item">
          <span>待审核资源</span><strong>{{ stats.pending?.resources || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/audit/resources')">查看</el-button>
        </div>
      </div>
    </el-card>

    <!-- 活跃度排名 -->
    <el-card class="mb-20">
      <template #header>
        <span>活跃度排名（按{{ periodLabel }}）</span>
      </template>
      <div class="ranking-grid">
        <!-- 社区活跃度 -->
        <div class="ranking-section">
          <h4>社区活跃度 TOP10</h4>
          <div class="ranking-list" v-if="stats.ranking?.communities?.length">
            <div class="ranking-item" v-for="(item, idx) in stats.ranking.communities" :key="'c'+item.id">
              <span class="rank-num" :class="{ top3: idx < 3 }">{{ idx + 1 }}</span>
              <span class="rank-name">{{ item.name || '未知' }}</span>
              <span class="rank-count">{{ item.count }}条需求</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="60" />
        </div>

        <!-- 商家活跃度 -->
        <div class="ranking-section">
          <h4>商家活跃度 TOP10</h4>
          <div class="ranking-list" v-if="stats.ranking?.merchants?.length">
            <div class="ranking-item" v-for="(item, idx) in stats.ranking.merchants" :key="'m'+item.id">
              <span class="rank-num" :class="{ top3: idx < 3 }">{{ idx + 1 }}</span>
              <span class="rank-name">{{ item.name || '未知' }}</span>
              <span class="rank-count">{{ item.count }}条资源</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="60" />
        </div>

        <!-- 大使活跃度 -->
        <div class="ranking-section">
          <h4>大使活跃度 TOP10</h4>
          <div class="ranking-list" v-if="stats.ranking?.ambassadors?.length">
            <div class="ranking-item" v-for="(item, idx) in stats.ranking.ambassadors" :key="'a'+item.id">
              <span class="rank-num" :class="{ top3: idx < 3 }">{{ idx + 1 }}</span>
              <span class="rank-name">{{ item.name || '未知' }}</span>
              <span class="rank-count">{{ item.count }}次撮合</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="60" />
        </div>
      </div>
    </el-card>

    <!-- 需求列表和资源列表 -->
    <div class="lists-grid">
      <!-- 需求列表 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>需求列表</span>
            <el-input v-model="demandKeyword" placeholder="搜索需求" size="small" style="width:150px" clearable @clear="loadDemands" @keyup.enter="loadDemands">
              <template #append><el-button @click="loadDemands"><el-icon><Search /></el-icon></el-button></template>
            </el-input>
          </div>
        </template>
        <el-table :data="demands" size="small" max-height="300" v-loading="demandsLoading">
          <el-table-column prop="title" label="需求标题" min-width="150" show-overflow-tooltip />
          <el-table-column prop="community_name" label="发布社区" width="120" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="view_count" label="浏览" width="60" align="center" />
          <el-table-column prop="created_at" label="发布时间" width="100" align="center">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="demandsPage"
          :page-size="5"
          :total="demandsTotal"
          layout="prev, pager, next"
          small
          style="margin-top:12px;text-align:center"
          @current-change="loadDemands"
        />
      </el-card>

      <!-- 资源列表 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>资源列表</span>
            <el-input v-model="resourceKeyword" placeholder="搜索资源" size="small" style="width:150px" clearable @clear="loadResources" @keyup.enter="loadResources">
              <template #append><el-button @click="loadResources"><el-icon><Search /></el-icon></el-button></template>
            </el-input>
          </div>
        </template>
        <el-table :data="resources" size="small" max-height="300" v-loading="resourcesLoading">
          <el-table-column prop="title" label="资源标题" min-width="150" show-overflow-tooltip />
          <el-table-column prop="company_name" label="发布商家" width="120" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="view_count" label="浏览" width="60" align="center" />
          <el-table-column prop="created_at" label="发布时间" width="100" align="center">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="resourcesPage"
          :page-size="5"
          :total="resourcesTotal"
          layout="prev, pager, next"
          small
          style="margin-top:12px;text-align:center"
          @current-change="loadResources"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getDashboard, getDemandList, getResourceList } from '@/api/admin'

const router = useRouter()
const loading = ref(false)
const stats = ref({})
const pendingTotal = ref(0)
const period = ref('all')

const demands = ref([])
const resources = ref([])
const demandsLoading = ref(false)
const resourcesLoading = ref(false)
const demandsPage = ref(1)
const resourcesPage = ref(1)
const demandsTotal = ref(0)
const resourcesTotal = ref(0)
const demandKeyword = ref('')
const resourceKeyword = ref('')

const periodLabel = computed(() => {
  const map = { all: '全部', day: '今日', month: '本月', year: '本年' }
  return map[period.value] || '全部'
})

async function loadDashboard() {
  loading.value = true
  try {
    const res = await getDashboard({ period: period.value })
    stats.value = res.data || {}
    pendingTotal.value = res.data?.pending?.total || 0
  } catch { /* 静默失败 */ }
  finally { loading.value = false }
}

async function loadDemands() {
  demandsLoading.value = true
  try {
    const res = await getDemandList({
      page: demandsPage.value,
      pageSize: 5,
      keyword: demandKeyword.value,
      period: period.value
    })
    demands.value = res.data?.list || []
    demandsTotal.value = res.data?.total || 0
  } catch { /* 静默失败 */ }
  finally { demandsLoading.value = false }
}

async function loadResources() {
  resourcesLoading.value = true
  try {
    const res = await getResourceList({
      page: resourcesPage.value,
      pageSize: 5,
      keyword: resourceKeyword.value,
      period: period.value
    })
    resources.value = res.data?.list || []
    resourcesTotal.value = res.data?.total || 0
  } catch { /* 静默失败 */ }
  finally { resourcesLoading.value = false }
}

function statusType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function statusText(status) {
  const map = { 0: '待审核', 1: '已发布', 2: '已驳回', 3: '已下线' }
  return map[status] || '未知'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.slice(5, 10)
}

onMounted(() => {
  loadDashboard()
  loadDemands()
  loadResources()
})
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card { text-align: center; }

.stat-number {
  font-size: 26px;
  font-weight: bold;
}

.stat-label {
  color: #909399;
  margin: 6px 0 0;
  font-size: 13px;
}

.pending-items { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.pending-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
.pending-item span { flex: 1; color: #606266; }
.pending-item strong { font-size: 22px; color: #F56C6C; font-weight: 700; min-width: 50px; text-align: right; }

.mb-20 { margin-bottom: 20px; }

/* 活跃度排名 */
.ranking-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.ranking-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.rank-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #dcdfe6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
}

.rank-num.top3 {
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
}

.rank-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.rank-count {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}

/* 列表 */
.lists-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1200px) {
  .ranking-grid {
    grid-template-columns: 1fr;
  }
  .lists-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .dashboard-header h2 { font-size: 18px; }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .stat-card {
    padding: 14px 12px !important;
  }
  .stat-number { font-size: 20px; }
  .stat-label { font-size: 11px; }

  .pending-items {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .pending-item {
    padding: 10px 12px;
    font-size: 13px;
  }

  .ranking-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .ranking-section h4 {
    font-size: 14px;
  }

  .lists-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  /* 表格横向滚动 */
  :deep(.el-table) {
    font-size: 12px;
  }
  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.el-table__header th) {
    padding: 8px 0;
    font-size: 12px;
    white-space: nowrap;
  }
  :deep(.el-table__body td) {
    padding: 8px 4px;
    white-space: nowrap;
  }
}
</style>
