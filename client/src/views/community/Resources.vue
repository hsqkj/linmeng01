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
      <el-select v-model="filters.merchantType" placeholder="行业分类" style="width:140px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in merchantTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filters.level" placeholder="会员等级" style="width:130px" clearable>
        <el-option label="全部等级" value="" />
        <el-option v-for="l in memberLevels" :key="l" :label="l" :value="l" />
      </el-select>
      <el-select v-model="filters.matchOrder" placeholder="排序方式" style="width:130px">
        <el-option label="匹配度优先" value="match" />
        <el-option label="最新发布" value="newest" />
        <el-option label="等级优先" value="level" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 资源列表 -->
    <div class="resource-list" v-loading="loading">
      <el-empty v-if="!loading && resources.length === 0" description="暂无资源" />
      <el-card v-for="resource in resources" :key="resource.id" shadow="hover" class="resource-card" @click="viewDetail(resource)">
        <div class="card-header">
          <div class="rating-stars">
            <span v-for="n in 5" :key="n" class="star" :class="{filled: n <= (resource.star_rating || 0)}">★</span>
          </div>
          <div class="match-score">
            <span v-for="n in 5" :key="n" class="heart" :class="{filled: n <= (resource.matchHearts || 0)}">♥</span>
            <span class="score-pct">{{ resource.matchScore ? resource.matchScore * 20 + '%' : '' }}</span>
          </div>
        </div>
        <h4 class="res-title">{{ resource.title }}</h4>
        <div class="res-meta">
          <el-tag size="small">{{ resource.resource_type }}</el-tag>
          <span class="merchant-name" @click.stop="viewMerchantInfo(resource)">{{ resource.company_name }}</span>
        </div>
        <p class="res-desc">{{ resource.content }}</p>
        <div class="res-footer">
          <el-tag size="small" :type="memberLevelType[resource.member_level] || 'info'">
            {{ memberLevelName[resource.member_level] || '普通会员' }}
          </el-tag>
          <el-button type="primary" size="small" @click.stop="viewDetail(resource)">查看详情</el-button>
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
import { Search } from '@element-plus/icons-vue'
import { getResources } from '@/api/community'

const router = useRouter()
const showMerchantInfo = ref(false)
const currentMerchantInfo = ref(null)
const loading = ref(false)

const filters = reactive({ keyword: '', type: '', merchantType: '', level: '', matchOrder: 'match' })
const resourceTypes = ['资金赞助', '物资提供', '人力支持', '技术支持', '专业服务', '媒体报道']
const merchantTypes = ['教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果', '美业', '保健养生', '体育健身', '银行保险', '电信服务', '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材', '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务', '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰', '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料', '办公用品', '设备租赁', '其他']
const memberLevels = ['普通会员', '银牌会员', '金牌会员', '铂金会员', '钻石会员']
const levelTagType = { '普通会员': 'info', '银牌会员': '', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }
const memberLevelName = { 0: '普通会员', 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }

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
      type: filters.type || undefined,
      sort: filters.matchOrder || 'level'
    }
    if (filters.keyword) params.keyword = filters.keyword
    const res = await getResources(params)
    resources.value = res.data || []
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
  filters.merchantType = ''
  filters.level = ''
  filters.matchOrder = 'match'
  doSearch()
}
function onPageChange(page) {
  currentPage.value = page
  fetchResources()
}

onMounted(() => {
  fetchResources()
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
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rating-stars { display: flex; align-items: center; gap: 1px; }
.star { color: #dcdfe6; font-size: 14px; }
.star.filled { color: #f5a623; }
.match-score { display: flex; align-items: center; gap: 4px; }
.heart { color: #ddd; font-size: 12px; }
.heart.filled { color: #f56c6c; }
.score-pct { font-size: 11px; color: #909399; margin-left: 2px; }
.res-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; line-height: 1.4; }
.res-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.merchant-name { font-size: 13px; color: #409EFF; font-weight: 500; cursor: pointer; text-decoration: underline; }
.merchant-type { font-size: 12px; color: #909399; }
.res-desc { font-size: 13px; color: #606266; margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.res-footer { display: flex; align-items: center; justify-content: space-between; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
