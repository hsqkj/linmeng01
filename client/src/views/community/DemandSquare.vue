<template>
  <div class="page">
    <div class="page-header">
      <h2>需求广场</h2>
      <span style="color:#909399;font-size:13px">浏览所有社区发布的资源需求，寻找合作机会</span>
    </div>

    <!-- 搜索与筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索需求名称/活动描述" style="width:200px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.type" placeholder="需求类型" style="width:130px" clearable>
        <el-option label="全部类型" value="" />
        <el-option label="活动赞助" :value="0" />
        <el-option label="专家服务" :value="1" />
        <el-option label="空间运营" :value="2" />
        <el-option label="物资赞助" :value="3" />
        <el-option label="健康服务" :value="4" />
        <el-option label="教育培训" :value="5" />
      </el-select>
      <el-select v-model="filters.district" placeholder="区" style="width:100px" clearable>
        <el-option label="全部区" value="" />
        <el-option v-for="d in districts" :key="d" :label="d" :value="d" />
      </el-select>
      <el-select v-model="filters.sortBy" placeholder="排序" style="width:130px">
        <el-option label="最新发布" value="newest" />
        <el-option label="热门需求" value="hot" />
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
          <el-tag size="small" :type="typeColors[demand.demand_type]">{{ demandTypeMap[demand.demand_type] || demand.demand_type }}</el-tag>
        </div>
        <h4 class="demand-title">{{ demand.title }}</h4>
        <div class="demand-meta">
          <el-icon :size="13" style="color:#909399"><OfficeBuilding /></el-icon>
          <span class="community-name" @click.stop="viewCommunity(demand)">{{ demand.community_name }}</span>
          <span class="divider">|</span>
          <span>{{ demand.district }}{{ demand.street ? ' · ' + demand.street : '' }}</span>
          <span class="divider">|</span>
          <el-icon :size="13" style="color:#909399"><Calendar /></el-icon>
          <span>{{ demand.start_time ? demand.start_time.split('T')[0] : '-' }}</span>
        </div>
        <div class="demand-tags">
          <el-tag v-for="g in (parseAudience(demand.target_audience))" :key="g" size="small" type="info" style="margin:2px">{{ g }}</el-tag>
        </div>
        <div class="demand-footer">
          <div class="sponsor-types">
            <span style="font-size:12px;color:#909399">所需：</span>
            <el-tag v-for="s in (parseAudience(demand.required_types))" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
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

    <!-- 社区详情弹窗 -->
    <el-dialog v-model="showCommunityDialog" title="社区基本信息" width="560px">
      <div v-if="communityDetail">
        <div class="detail-header" style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
          <img :src="communityDetail.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(communityDetail.community_name || '社')}&background=4A90D9&color=fff`" style="width:64px;height:64px;border-radius:12px;object-fit:cover" />
          <div>
            <div style="font-size:20px;font-weight:700">{{ communityDetail.community_name }}</div>
            <div style="color:#909399;font-size:13px;margin-top:4px">{{ communityDetail.district }}{{ communityDetail.street ? ' · ' + communityDetail.street : '' }}</div>
          </div>
        </div>
        <el-divider />
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="户数规模">{{ communityDetail.households ? communityDetail.households + ' 户' : '未知' }}</el-descriptions-item>
          <el-descriptions-item label="亲子家庭">{{ communityDetail.family_ratio || '-' }}</el-descriptions-item>
          <el-descriptions-item label="老年群体">{{ communityDetail.elderly_ratio || '-' }}</el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">{{ communityDetail.address || '暂无' }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px" v-if="communityDetail.description">
          <div style="font-weight:600;margin-bottom:8px">社区简介</div>
          <p style="color:#606266;line-height:1.8;font-size:14px;margin:0">{{ communityDetail.description }}</p>
        </div>
        <div style="margin-top:16px" v-if="communityDetail.tags">
          <div style="font-weight:600;margin-bottom:8px">社区标签</div>
          <el-tag v-for="tag in communityDetail.tags.split(',')" :key="tag" size="small" type="primary" effect="light" style="margin:3px">{{ tag }}</el-tag>
        </div>
      </div>
      <div v-else style="text-align:center;padding:40px;color:#909399">
        <el-icon :size="40"><Loading /></el-icon>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, OfficeBuilding, Calendar, Loading } from '@element-plus/icons-vue'
import { getDemands } from '@/api/community'

const router = useRouter()

const filters = reactive({ keyword: '', type: '', district: '', sortBy: 'newest' })

// 需求类型数字→中文映射
const demandTypeMap = {
  0: '活动赞助', 1: '专家服务', 2: '空间运营',
  3: '物资赞助', 4: '健康服务', 5: '教育培训'
}
const typeColors = {
  0: 'primary', 1: 'success', 2: 'warning',
  3: 'danger', 4: 'info', 5: 'warning'
}
// 目标对象数字→中文映射
const audienceMap = {
  0: '老年人', 1: '儿童', 2: '青少年', 3: '家庭', 4: '退役军人',
  5: '残障人士', 6: '新业态从业者', 7: '社区居民', 8: '其他'
}

const demands = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 9
const loading = ref(false)

const districts = ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '汉南区', '蔡甸区', '江夏区', '黄陂区', '新洲区']
const showCommunityDialog = ref(false)
const communityDetail = ref(null)

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
    demands.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || demands.value.length
  } catch {
    demands.value = []
  } finally {
    loading.value = false
  }
}

function parseAudience(val) {
  if (!val) return []
  let arr = []
  if (typeof val === 'string') {
    try { arr = JSON.parse(val) } catch { arr = val.split(',') }
  } else {
    arr = val
  }
  // 数字→中文映射
  return arr.map(v => {
    const n = parseInt(v)
    if (!isNaN(n) && audienceMap[n] !== undefined) return audienceMap[n]
    return v
  })
}

function viewDetail(demand) {
  router.push(`/community/demands/${demand.id}`)
}

async function viewCommunity(demand) {
  if (!demand.community_id) return
  showCommunityDialog.value = true
  communityDetail.value = null
  try {
    // 用 getMerchantDetail? No, that's for merchants. Community has no "getMyCommunityDetail" in community API.
    // But we can show basic info from the demand object itself
    communityDetail.value = {
      community_name: demand.community_name,
      district: demand.district,
      street: demand.street,
      households: demand.households,
      family_ratio: demand.family_ratio,
      elderly_ratio: demand.elderly_ratio
    }
  } catch {
    ElMessage.error('加载社区资料失败')
  }
}

function doSearch() {
  currentPage.value = 1
  fetchDemands()
}
function resetFilters() {
  Object.assign(filters, { keyword: '', type: '', district: '', sortBy: 'newest' })
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
.community-name { font-size: 13px; color: #409EFF; font-weight: 500; cursor: pointer; text-decoration: underline; }
.demand-tags { margin-bottom: 8px; }
.demand-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.sponsor-types { display: flex; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page-header { flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .page-header h2 { font-size: 18px; }
  .filter-bar { gap: 8px; margin-bottom: 14px; }
  .filter-bar .el-input,
  .filter-bar .el-select { width: calc(50% - 4px) !important; font-size: 13px; }
  .filter-bar .el-button { width: calc(50% - 4px); font-size: 13px; }
  .demand-list { grid-template-columns: 1fr; gap: 12px; }
  .demand-footer { flex-direction: column; gap: 10px; align-items: flex-start; }
  .demand-footer .el-button { width: 100%; }
  .pagination { justify-content: center; }
}
</style>
