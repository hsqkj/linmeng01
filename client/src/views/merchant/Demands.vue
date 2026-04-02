<template>
  <div class="page">
    <div class="page-header">
      <h2>需求广场</h2>
      <span style="color:#909399;font-size:13px">为您智能推荐与业务最匹配的社区需求</span>
    </div>

    <!-- 搜索与筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索需求名称/活动描述" style="width:240px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.type" placeholder="需求类型" style="width:130px" clearable>
        <el-option label="全部类型" value="" />
        <el-option label="活动赞助" value="活动赞助" />
        <el-option label="专家服务" value="专家服务" />
        <el-option label="空间运营" value="空间运营" />
      </el-select>
      <el-select v-model="filters.sortBy" placeholder="排序" style="width:130px">
        <el-option label="匹配度优先" value="match" />
        <el-option label="最新发布" value="newest" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 需求列表 -->
    <div class="demand-list" v-loading="loading">
      <el-empty v-if="!loading && demands.length === 0" description="暂无需求" />
      <el-card v-for="demand in demands" :key="demand.id" shadow="hover" class="demand-card" @click="viewDetail(demand)">
        <div class="card-header">
          <div class="match-score">
            <span v-for="n in 5" :key="n" class="heart" :class="{filled: n <= (demand.matchScore || 0)}">♥</span>
            <span class="score-pct">{{ demand.matchScore ? demand.matchScore * 20 + '%' : '' }}匹配</span>
          </div>
          <el-tag size="small" :type="typeColors[demand.demand_type]">{{ demand.demand_type }}</el-tag>
        </div>
        <h4 class="demand-title">{{ demand.title }}</h4>
        <div class="demand-meta">
          <el-icon :size="13" style="color:#909399"><Location /></el-icon>
          <span>{{ demand.community_name }}</span>
          <span class="divider">|</span>
          <el-icon :size="13" style="color:#909399"><Calendar /></el-icon>
          <span>{{ demand.start_time ? demand.start_time.split('T')[0] : '-' }}</span>
        </div>
        <div class="demand-tags">
          <el-tag v-for="g in (demand.target_audience || [])" :key="g" size="small" type="info" style="margin:2px">{{ g }}</el-tag>
        </div>
        <div class="demand-footer">
          <div class="sponsor-types">
            <span style="font-size:12px;color:#909399">所需：</span>
            <el-tag v-for="s in (demand.required_types || [])" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
          </div>
          <el-button type="primary" size="small" @click.stop="viewDetail(demand)">查看详情</el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination">
      <el-pagination
        layout="prev,pager,next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Location, Calendar } from '@element-plus/icons-vue'
import { getDemands } from '@/api/merchant'

const router = useRouter()

const filters = reactive({ keyword: '', type: '', sortBy: 'newest' })
const typeColors = { '活动赞助': 'primary', '专家服务': 'success', '空间运营': 'warning' }

const demands = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 9
const loading = ref(false)

async function fetchDemands() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize,
      type: filters.type || undefined,
      sort: filters.sortBy || 'newest'
    }
    if (filters.keyword) params.keyword = filters.keyword
    const res = await getDemands(params)
    demands.value = res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || demands.value.length
  } catch {
    demands.value = []
  } finally {
    loading.value = false
  }
}

function viewDetail(demand) {
  router.push(`/merchant/demands/${demand.id}`)
}

function doSearch() {
  currentPage.value = 1
  fetchDemands()
}
function resetFilters() {
  Object.assign(filters, { keyword: '', type: '', sortBy: 'newest' })
  doSearch()
}
function onPageChange(page) {
  currentPage.value = page
  fetchDemands()
}

onMounted(() => {
  fetchDemands()
})
</script>
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
.demand-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.demand-card { cursor: pointer; transition: transform 0.2s; }
.demand-card:hover { transform: translateY(-2px); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.match-score { display: flex; align-items: center; gap: 2px; }
.heart { color: #ddd; font-size: 14px; }
.heart.filled { color: #f56c6c; }
.score-pct { font-size: 12px; color: #f56c6c; font-weight: 600; margin-left: 4px; }
.demand-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
.demand-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; margin-bottom: 8px; flex-wrap: wrap; }
.divider { color: #ddd; }
.demand-tags { margin-bottom: 8px; }
.demand-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.sponsor-types { display: flex; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
