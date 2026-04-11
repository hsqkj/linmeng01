<template>
  <div class="page">
    <div class="page-header">
      <h2>资源广场</h2>
      <span style="color:#909399;font-size:13px">为您智能推荐最匹配的商家资源</span>
    </div>

    <!-- 搜索与筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索资源名称/商家名称" style="width:240px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.type" placeholder="资源类型" style="width:140px" clearable>
        <el-option label="全部类型" value="" />
        <el-option v-for="t in resourceTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filters.rating" placeholder="评价等级" style="width:120px" clearable>
        <el-option label="全部等级" value="" />
        <el-option label="五星商家" value="5" />
        <el-option label="四星及以上" value="4" />
        <el-option label="三星及以上" value="3" />
      </el-select>
      <el-select v-model="filters.distance" placeholder="距离范围" style="width:130px" clearable>
        <el-option label="不限距离" value="" />
        <el-option label="3公里内" value="3" />
        <el-option label="5公里内" value="5" />
        <el-option label="10公里内" value="10" />
        <el-option label="20公里内" value="20" />
      </el-select>
      <el-select v-model="filters.matchOrder" placeholder="排序方式" style="width:130px">
        <el-option label="匹配度优先" value="match" />
        <el-option label="最新发布" value="newest" />
        <el-option label="评价最高" value="rating" />
        <el-option label="等级优先" value="level" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 资源列表 -->
    <div class="resource-list" v-loading="loading">
      <el-empty v-if="!loading && resources.length === 0" description="暂无资源" />
      <el-card v-for="resource in resources" :key="resource.id" shadow="hover" class="resource-card" @click="viewDetail(resource)">
        <!-- 第一行：类型标签(左上) + 匹配度(右上) -->
        <div class="card-row-top">
          <el-tag size="small" type="danger" effect="dark" class="type-tag">{{ getResourceTypeName(resource.resource_type) }}</el-tag>
          <div class="match-score">
            <span class="score-pct">匹配度</span>
            <span v-for="n in 5" :key="n" class="heart" :class="{filled: n <= (resource.matchHearts || 0)}">♥</span>
          </div>
        </div>

        <!-- 第二行：Logo + 商家信息（评级+会员等级+商家名） -->
        <div class="resource-header">
          <el-avatar :size="44" :src="resource.merchant_logo" class="merchant-logo" @error="() => true">
            <el-icon :size="20"><Shop /></el-icon>
          </el-avatar>
          <div class="merchant-info">
            <h4 class="res-title">{{ resource.title }}</h4>
            <div class="res-meta">
              <span class="star-rating">{{ resource.star_rating || 0 }}星</span>
              <el-tag size="small" :type="memberLevelType[resource.member_level] || 'info'" style="margin:0 4px">
                {{ memberLevelName[resource.member_level] || '普通会员' }}
              </el-tag>
              <span class="merchant-name" @click.stop="router.push(`/community/merchants/${resource.merchant_id}`)">{{ resource.company_name }}</span>
            </div>
          </div>
        </div>

        <!-- 第三行：内容摘要 -->
        <p class="res-desc">{{ resource.content }}</p>

        <!-- 第四行：标签（5个） -->
        <div class="resource-tags" v-if="resource.tags && resource.tags.length">
          <el-tag v-for="tag in (Array.isArray(resource.tags) ? resource.tags : resource.tags.split(',')).slice(0, 5)" :key="tag" size="small" effect="plain" style="margin:2px">{{ tag }}</el-tag>
        </div>

        <!-- 第五行：收藏 + 关注 + 分享 均分三等分 -->
        <div class="card-footer">
          <div class="footer-item" @click.stop="handleFavorite(resource)">
            <el-icon class="footer-icon" :class="{active: favoritedIds.has(resource.id)}"><Star /></el-icon>
            <span class="footer-label">{{ favoritedIds.has(resource.id) ? '已收藏' : '收藏' }}</span>
          </div>
          <div class="footer-item">
            <el-icon class="footer-icon"><View /></el-icon>
            <span class="footer-label">{{ resource.view_count || 0 }}</span>
          </div>
          <div class="footer-item" @click.stop="handleShare(resource)">
            <el-icon class="footer-icon"><Share /></el-icon>
            <span class="footer-label">分享</span>
          </div>
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

    <!-- 商家基本信息弹窗（从资源列表点商家名快速查看） -->
    <el-dialog v-model="showMerchantInfo" :title="currentMerchantInfo?.company_name + ' - 商家基本信息'" width="560px">
      <el-descriptions :column="2" border v-if="currentMerchantInfo">
        <el-descriptions-item label="商家名称">{{ currentMerchantInfo.company_name }}</el-descriptions-item>
        <el-descriptions-item label="行业分类">{{ currentMerchantInfo.industry }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="memberLevelType[currentMerchantInfo.member_level]" size="small">
            {{ memberLevelName[currentMerchantInfo.member_level] || '普通会员' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平台评级">
          <el-rate v-model="currentMerchantInfo.star_rating" disabled show-score text-color="#f5a623" disabled-hallow-color="#f5a623" />
        </el-descriptions-item>
        <el-descriptions-item label="擅长领域" :span="2">
          <el-tag v-for="tag in (currentMerchantInfo.tags||[])" :key="tag" size="small" style="margin:2px">{{ tag }}</el-tag>
          <span v-if="!currentMerchantInfo.tags?.length">-</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showMerchantInfo = false">关闭</el-button>
        <el-button type="primary" @click="showMerchantInfo=false; router.push('/community/resources/' + currentMerchantInfo.resource_id)">查看该商家资源</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth } from '@/utils/useAuth'
import { Search, View, Star, Shop, Share } from '@element-plus/icons-vue'
import { getResources, toggleFavorite, getMyFavorites, getConfig } from '@/api/community'

const router = useRouter()
const showMerchantInfo = ref(false)
const currentMerchantInfo = ref(null)
const loading = ref(false)
const favoritedIds = ref(new Set())

const filters = reactive({ keyword: '', type: '', rating: '', distance: '', matchOrder: 'match' })
const resourceTypes = ref([])
const resourceTypeMap = ref({})

// 会员等级名称映射（从API动态加载）
const memberLevelName = ref({})
const memberLevelNameData = ref({})
const memberLevelType = { 0: 'info', 1: 'info', 2: '', 3: 'warning', 4: 'danger', 5: 'danger' }

// 资源类型数字到中文映射（从API动态加载）
const getResourceTypeName = (type) => {
  // 如果是字符串且在映射中存在
  if (typeof type === 'string' && resourceTypeMap.value[type] !== undefined) {
    return resourceTypeMap.value[type]
  }
  // 如果是数字
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeMap.value[num] !== undefined) {
    return resourceTypeMap.value[num]
  }
  // 如果是字符串类型名称，直接返回
  if (typeof type === 'string') {
    return type
  }
  return type || '其他'
}

async function loadConfig() {
  try {
    const res = await getConfig()
    // 加载资源类型
    if (res.data?.resourceTypes?.length) {
      resourceTypes.value = res.data.resourceTypes
      // 构建数字到中文的映射
      const map = {}
      res.data.resourceTypes.forEach((t, idx) => {
        map[idx] = t
        map[t] = t
      })
      resourceTypeMap.value = map
    }
    // 加载会员等级配置
    if (res.data?.member_levels?.length) {
      const map = {}
      res.data.member_levels.forEach(item => {
        map[item.level] = item.name
      })
      memberLevelNameData.value = map
      memberLevelName.value = map
    }
  } catch {}
}

const resources = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 9

async function fetchResources() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize,
      sort: filters.matchOrder || 'level'
    }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.type) params.type = filters.type
    if (filters.rating) params.level = filters.rating  // 星级筛选
    // distance 暂时不支持
    const res = await getResources(params)
    resources.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || resources.value.length
  } catch {
    resources.value = []
  } finally {
    loading.value = false
  }
}

function viewDetail(res) {
  router.push(`/community/resources/${res.id}`)
}
function viewMerchantInfo(res) {
  currentMerchantInfo.value = res
  showMerchantInfo.value = true
}
function doSearch() {
  currentPage.value = 1
  fetchResources()
}
function resetFilters() {
  filters.keyword = ''
  filters.type = ''
  filters.rating = ''
  filters.distance = ''
  filters.matchOrder = 'match'
  doSearch()
}
function onPageChange(page) {
  currentPage.value = page
  fetchResources()
}

// 加载收藏状态
async function loadFavorites() {
  try {
    const res = await getMyFavorites()
    const list = res.data?.list || res.data || []
    favoritedIds.value = new Set(list.map(i => i.resource_id || i.id))
  } catch {}
}

// 切换收藏
async function handleFavorite(res) {
  if (!localStorage.getItem('community_token')) {
    return requireAuth('community')
  }
  try {
    await toggleFavorite({ resource_id: res.id })
    if (favoritedIds.value.has(res.id)) {
      favoritedIds.value.delete(res.id)
    } else {
      favoritedIds.value.add(res.id)
    }
    favoritedIds.value = new Set(favoritedIds.value)
    ElMessage.success(favoritedIds.value.has(res.id) ? '已收藏' : '已取消收藏')
  } catch {
    ElMessage.error('操作失败')
  }
}

function handleShare(res) {
  const url = `${window.location.origin}/community/resources/${res.id}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  } else {
    ElMessage.info(`分享链接：${url}`)
  }
}

onMounted(() => {
  loadConfig()
  fetchResources()
  loadFavorites()
})

</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
.resource-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.resource-card { cursor: pointer; transition: transform 0.2s; }
.resource-card:hover { transform: translateY(-2px); }

/* 顶部行 */
.card-row-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.type-tag { font-weight: 700; letter-spacing: 1px; }
.match-score { display: flex; align-items: center; gap: 2px; }
.score-pct { font-size: 11px; color: #606266; font-weight: 600; margin-right: 2px; }
.heart { color: #ddd; font-size: 13px; }
.heart.filled { color: #f56c6c; }

/* Logo + 商家信息 */
.resource-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.merchant-logo { flex-shrink: 0; }
.merchant-info { flex: 1; min-width: 0; }
.res-title { margin: 0 0 4px; font-size: 15px; font-weight: 600; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.res-meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.star-rating { font-size: 12px; color: #f5a623; font-weight: 700; }
.merchant-name { font-size: 13px; color: #409EFF; font-weight: 500; cursor: pointer; }
.merchant-name:hover { text-decoration: underline; }

/* 内容摘要 */
.res-desc { font-size: 13px; color: #606266; margin: 0 0 8px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* 标签 */
.resource-tags { margin-bottom: 8px; }

/* 底部三列 - 均分布局 */
.card-footer { display: flex; align-items: center; justify-content: space-around; }
.footer-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; padding: 4px 0; }
.footer-icon { font-size: 18px; color: #909399; transition: color 0.2s; }
.footer-icon.active { color: #f56c6c; }
.footer-icon:hover { color: #f56c6c; }
.footer-label { font-size: 11px; color: #909399; }
.footer-item:hover .footer-label { color: #606266; }

.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page-header { flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .page-header h2 { font-size: 18px; }
  .filter-bar { gap: 8px; margin-bottom: 14px; }
  .filter-bar .el-input,
  .filter-bar .el-select { width: calc(50% - 4px) !important; font-size: 13px; }
  .filter-bar .el-button { width: calc(50% - 4px); font-size: 13px; }
  .resource-list { grid-template-columns: 1fr; gap: 12px; }
  .pagination { justify-content: center; }
}
</style>
