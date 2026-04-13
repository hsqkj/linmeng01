<template>
  <div class="page">
    <div class="page-header">
      <h2>需求广场</h2>
      <span style="color:#909399;font-size:13px">为您智能推荐与业务最匹配的社区需求</span>
    </div>

    <!-- 搜索与筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索需求名称/活动描述" style="width:200px" clearable @keyup.enter="doSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.district" placeholder="选择区" style="width:130px" clearable @change="onDistrictChange">
        <el-option label="全部区" value="" />
        <el-option v-for="d in districts" :key="d" :label="d" :value="d" />
      </el-select>
      <el-select v-model="filters.street" placeholder="选择街道" style="width:130px" clearable @change="onStreetChange">
        <el-option label="全部街道" value="" />
        <el-option v-for="s in filteredStreets" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="filters.community" placeholder="选择社区" style="width:140px" clearable>
        <el-option label="全部社区" value="" />
        <el-option v-for="c in filteredCommunities" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filters.type" placeholder="需求类型" style="width:130px" clearable>
        <el-option label="全部类型" value="" />
        <el-option v-for="(typeName, idx) in demandTypesList" :key="idx" :label="typeName" :value="idx" />
      </el-select>
      <el-select v-model="filters.sortBy" placeholder="排序" style="width:130px">
        <el-option label="最新发布" value="newest" />
        <el-option label="匹配度优先" value="match" />
        <el-option label="距离最近" value="distance" />
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
            <span class="score-pct">匹配度</span>
            <span v-for="n in 5" :key="n" class="heart" :class="{filled: n <= (demand.matchScore || 0)}">♥</span>
          </div>
          <div class="card-actions">
            <el-tag size="small" :type="getTypeColor(demand.demand_type_name || getDemandTypeName(demand.demand_type))">{{ demand.demand_type_name || getDemandTypeName(demand.demand_type) }}</el-tag>
            <el-icon class="fav-btn" :class="{favorited: demand.isFavorited}" @click.stop="toggleFav(demand)" :title="demand.isFavorited ? '取消收藏' : '收藏'"><Star /></el-icon>
          </div>
        </div>
        <h4 class="demand-title">{{ demand.title }}</h4>
        <div class="demand-meta">
          <el-icon :size="13" style="color:#909399"><Location /></el-icon>
          <span style="cursor:pointer;color:#409EFF;text-decoration:underline" @click.stop="viewCommunity(demand)">{{ demand.community_name }}</span>
          <span class="divider">|</span>
          <span>{{ demand.district }}{{ demand.street ? ' · ' + demand.street : '' }}</span>
          <span v-if="demand.distance_km !== undefined" class="divider">|</span>
          <span v-if="demand.distance_km !== undefined" class="distance-tag">
            <el-icon :size="11"><Location /></el-icon>
            {{ demand.distance_km < 1 ? (demand.distance_km * 1000).toFixed(0) + 'm' : demand.distance_km.toFixed(1) + 'km' }}
          </span>
          <span class="divider">|</span>
          <el-icon :size="13" style="color:#909399"><Calendar /></el-icon>
          <span>{{ demand.start_time ? demand.start_time.split('T')[0] : '-' }}</span>
        </div>
        <div class="demand-tags">
          <el-tag v-for="g in (demand.target_audience_names || [])" :key="g" size="small" type="info" style="margin:2px">{{ g }}</el-tag>
        </div>
        <div class="demand-footer">
          <div class="sponsor-types">
            <span style="font-size:12px;color:#909399">所需：</span>
            <el-tag v-for="s in (demand.required_types_names || [])" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
          </div>
          <div class="footer-right">
            <span class="view-count"><el-icon :size="12"><View /></el-icon> {{ demand.view_count || 0 }}</span>
            <el-button type="primary" size="small" @click.stop="viewDetail(demand)">查看详情</el-button>
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
          <el-descriptions-item label="公共空间">{{ communityDetail.public_space_area ? communityDetail.public_space_area + '㎡' : '-' }}</el-descriptions-item>
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
        <div style="margin-top:16px">
          <div style="font-weight:600;margin-bottom:8px">社区特点</div>
          <el-tag v-if="communityDetail.has_outdoor_plaza" size="small" type="info" effect="light" style="margin:3px">有户外广场</el-tag>
          <el-tag v-if="communityDetail.has_school" size="small" type="info" effect="light" style="margin:3px">有幼儿园/小学</el-tag>
          <el-tag v-if="communityDetail.has_commercial" size="small" type="info" effect="light" style="margin:3px">有商业体</el-tag>
          <el-tag v-if="communityDetail.has_park" size="small" type="info" effect="light" style="margin:3px">有公园</el-tag>
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
import { requireAuth } from '@/utils/useAuth'
import { Search, Location, Calendar, Loading, Star, View } from '@element-plus/icons-vue'
import { getDemands, getCommunityDetail, toggleFavorite, getMyFavorites, getPublishTypes } from '@/api/merchant'

const router = useRouter()

const filters = reactive({ keyword: '', type: '', sortBy: 'newest', district: '', street: '', community: '' })

// 用户当前位置（用于距离排序）
const userLocation = ref(null)
const locationLoading = ref(false)
const locationError = ref('')

// 获取用户当前位置
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.value = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        resolve(userLocation.value)
      },
      (err) => {
        reject(err)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}
// 需求类型映射（从API动态加载）
const typeColorsMap = ref({})
// 数字到中文映射（用于 fallback）
const demandTypeNumMap = ref({})
const demandTypesList = ref([]) // 需求类型列表（用于筛选下拉框）
const getTypeColor = (typeName) => typeColorsMap.value[typeName] || 'primary'
function getDemandTypeName(type) { return demandTypeNumMap.value[type] ?? type ?? '需求' }
// 加载需求类型配置
async function loadDemandTypes() {
  try {
    const res = await getPublishTypes()
    if (res.data?.demand_types?.length) {
      const map = {}
      const colors = ['primary', 'success', 'warning', 'danger', 'info', '']
      demandTypesList.value = res.data.demand_types // 保存类型列表用于筛选
      res.data.demand_types.forEach((name, idx) => {
        map[idx] = name
        map[name] = name
        typeColorsMap.value[name] = colors[idx % colors.length]
      })
      demandTypeNumMap.value = map
    }
  } catch {}
}

// 武汉市区/街道/社区数据
const districts = ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '汉南区', '蔡甸区', '江夏区', '黄陂区', '新洲区']
const streetData = {
  '江岸区': ['百步亭社区', '劳动社区', '球场社区', '西马社区', '花桥社区', '二七社区', '永清社区', '四唯社区'],
  '江汉区': ['满春社区', '民意社区', '新华社区', '万松社区', '北湖社区', '唐家墩社区', '汉兴社区'],
  '硚口区': ['宗关社区', '汉水桥社区', '宝丰社区', '荣华社区', '六角亭社区', '汉中社区'],
  '汉阳区': ['建桥社区', '鹦鹉社区', '洲头社区', '五里墩社区', '江堤社区', '龙阳社区'],
  '武昌区': ['徐家棚社区', '积玉桥社区', '中华路社区', '粮道社区', '黄鹤楼社区', '首义路社区', '水果湖社区', '中南路社区'],
  '青山区': ['红钢城社区', '工人村社区', '青山镇社区', '武东社区', '冶金社区', '新沟桥社区'],
  '洪山区': ['珞南社区', '关山社区', '卓刀泉社区', '梨园社区', '和平社区', '张家湾社区', '洪山社区'],
  '东西湖区': ['吴家山社区', '长青社区', '慈惠社区', '走马岭社区', '径河社区', '金银湖社区'],
  '汉南区': ['纱帽社区', '东荆社区', '湘口社区', '邓南社区'],
  '蔡甸区': ['蔡甸社区', '大集社区', '奓山社区', '永安社区', '侏儒社区', '张湾社区'],
  '江夏区': ['纸坊社区', '金口社区', '乌龙社区', '郑店社区', '五里界社区', '山坡社区'],
  '黄陂区': ['前川社区', '横店社区', '滠口社区', '罗汉社区', '祁湾社区', '武湖社区', '天河社区'],
  '新洲区': ['邾城社区', '阳逻社区', '仓埠社区', '汪集社区', '李集社区', '凤凰社区', '徐集社区']
}
const communityData = {
  '江岸区': ['百步亭花园', '海虹景花园', '同鑫花园', '常阳永清城', '锦湖花园', '华清园', '天润花园', '新地东方华府'],
  '江汉区': ['CBD楚世家', '葛洲坝国际', '福星华府', '盛世江城', '仁恒公园世纪', '越秀国际金融汇'],
  '硚口区': ['融侨锦城', '同济医院小区', '营房社区', '古田四路小区', '广电江湾新城'],
  '汉阳区': ['卧龙墨水湖', '水墨丹青', '世茂锦绣长江', '复地海上海', '龙阳1号', '恒大御景湾'],
  '武昌区': ['金都汉宫', '锦江国际', '华润凤凰城', '百瑞景中央生活区', '水岸国际', '沙湖公馆', '东湖一号'],
  '青山区': ['绿地香树花城', '大华锦绣时代', '中建开元公馆', '招商一江璟城'],
  '洪山区': ['金地格林东郡', '万科金色城市', '东原湖光里', '当代国际花园', '清江锦城', '金地自在城', '爱家名校华城'],
  '东西湖区': ['愿景时代', '常青花园', '航天彩虹苑', '银湖水榭', '美联奥园', '远洋世界'],
  '汉南区': ['碧桂园凰城', '庭瑞君悦', '星悦湾'],
  '蔡甸区': ['中法文产知音湾', '金地格林', '朗诗西海岸', '世茂龙湾', '海天幸福小城'],
  '江夏区': ['金融街金悦府', '美的君兰半岛', '路劲时代城', '武汉雅居乐花园', '中建汤逊湖壹号'],
  '黄陂区': ['天纵城', '汉北大全景', 'F水天城', '大华公园华府', '恒达盘龙湾'],
  '新洲区': ['阳逻万达广场', '当代满庭春', '绿城桃李春风', '欣隆湖滨半岛', '孔雀城航天府']
}
const filteredStreets = ref([])
const filteredCommunities = ref([])

function onDistrictChange() {
  filters.street = ''
  filters.community = ''
  filteredStreets.value = streetData[filters.district] || []
  filteredCommunities.value = []
}
function onStreetChange() {
  filters.community = ''
  filteredCommunities.value = communityData[filters.street] || []
}

const demands = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 9
const loading = ref(false)
const showCommunityDialog = ref(false)
const communityDetail = ref(null)

async function fetchDemands() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize,
      type: filters.type || undefined,
      sort: filters.sortBy || 'newest',
      district: filters.district || undefined,
      street: filters.street || undefined,
      community: filters.community || undefined
    }
    if (filters.keyword) params.keyword = filters.keyword

    // 如果选择距离排序，先获取用户位置
    if (filters.sortBy === 'distance') {
      if (!userLocation.value) {
        locationLoading.value = true
        try {
          await getUserLocation()
        } catch (err) {
          locationError.value = '无法获取您的位置，请开启定位权限'
          ElMessage.warning('无法获取您的位置，无法按距离排序')
          filters.sortBy = 'newest'
          params.sort = 'newest'
        } finally {
          locationLoading.value = false
        }
      }
      if (userLocation.value) {
        params.lat = userLocation.value.lat
        params.lng = userLocation.value.lng
      }
    }

    const res = await getDemands(params)
    let list = res.data?.list || res.data || []

    // 标记收藏状态
    if (favDemandIds.value.size > 0) {
      list = list.map(d => ({ ...d, isFavorited: favDemandIds.value.has(d.id) }))
    }
    demands.value = list
    total.value = res.data?.pagination?.total || res.data?.total || demands.value.length
  } catch {
    demands.value = []
  } finally {
    loading.value = false
  }
}

const favDemandIds = ref(new Set())

async function loadFavorites() {
  try {
    const res = await getMyFavorites({ page: 1, pageSize: 200 })
    const list = res.data?.list || res.data || []
    favDemandIds.value = new Set(list.map(d => d.demand_id))
  } catch {}
}

async function toggleFav(demand) {
  if (!localStorage.getItem('merchant_token')) {
    return requireAuth('merchant')
  }
  demand.isFavorited = !demand.isFavorited
  try {
    await toggleFavorite({ demand_id: demand.id })
  } catch {
    demand.isFavorited = !demand.isFavorited
    ElMessage.error('操作失败')
  }
}

async function viewCommunity(demand) {
  if (!demand.community_id) return
  showCommunityDialog.value = true
  communityDetail.value = null
  try {
    const res = await getCommunityDetail(demand.community_id)
    communityDetail.value = res.data
  } catch {
    ElMessage.error('加载社区资料失败')
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
  filters.keyword = ''
  filters.type = ''
  filters.sortBy = 'newest'
  filters.district = ''
  filters.street = ''
  filters.community = ''
  filteredStreets.value = []
  filteredCommunities.value = []
  doSearch()
}
function onPageChange(page) {
  currentPage.value = page
  fetchDemands()
}

onMounted(() => {
  loadDemandTypes()
  loadFavorites().then(fetchDemands)
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
.card-actions { display: flex; align-items: center; gap: 8px; }
.match-score { display: flex; align-items: center; gap: 2px; }
.heart { color: #ddd; font-size: 14px; }
.heart.filled { color: #f56c6c; }
.score-pct { font-size: 12px; color: #606266; font-weight: 500; margin-right: 2px; }
.fav-btn { font-size: 16px; cursor: pointer; color: #c0c4cc; transition: color 0.2s; }
.fav-btn:hover, .fav-btn.favorited { color: #f5a623; }
.fav-btn.favorited { color: #f5a623; }
.demand-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
.demand-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; margin-bottom: 8px; flex-wrap: wrap; }
.divider { color: #ddd; }

.distance-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #67C23A;
  font-size: 12px;
  font-weight: 500;
}
.demand-tags { margin-bottom: 8px; }
.demand-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.sponsor-types { display: flex; align-items: center; flex-wrap: wrap; }
.footer-right { display: flex; align-items: center; gap: 8px; }
.view-count { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #909399; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page-header { flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .page-header h2 { font-size: 18px; }
  .filter-bar { gap: 8px; margin-bottom: 14px; }
  .filter-bar .el-input,
  .filter-bar .el-select {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  .filter-bar .el-button {
    width: calc(50% - 4px);
    font-size: 13px;
  }
  .demand-list { grid-template-columns: 1fr; gap: 12px; }
  .demand-footer { flex-direction: column; gap: 10px; align-items: flex-start; }
  .footer-right { width: 100%; justify-content: space-between; }
  .demand-footer .el-button { width: calc(50% - 4px); }
  .pagination { justify-content: center; }
}
</style>
