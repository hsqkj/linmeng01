<template>
  <div class="merchant-home" v-loading="loading">
    <!-- 未登录欢迎横幅 -->
    <div v-if="!isLoggedIn" class="welcome-banner merchant-welcome">
      <div class="welcome-content">
        <h1>欢迎来到邻盟商家端！</h1>
        <p>连接社区，精准匹配资源，让您的服务触达更多家庭</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" size="large" @click="$router.push('/login/merchant')">
          <el-icon><User /></el-icon>
          登录
        </el-button>
        <el-button size="large" @click="$router.push('/register/merchant')" style="margin-left: 10px;">
          <el-icon><Edit /></el-icon>
          注册
        </el-button>
      </div>
    </div>

    <!-- 登录提示 -->
    <div v-if="!isLoggedIn" class="login-tip-banner">
      <el-alert
        title="登录后即可发布资源、联系社区、查看详细信息"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <span>登录后您可以：发布和管理资源 | 查看社区联系方式 | 参与需求对接 | 提升品牌曝光</span>
        </template>
      </el-alert>
    </div>

    <!-- 资料不完善提醒 -->
    <el-alert
      v-if="isLoggedIn && profile.profile_incomplete"
      title="资料待完善"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;"
    >
      <template #default>
        您的{{ isExpert ? '专家' : '企业' }}资料尚未完善，建议尽快补充完整，以便获得更多曝光和合作机会。
        <el-link type="primary" @click="$router.push('/merchant/profile')">去完善资料 →</el-link>
      </template>
    </el-alert>

    <!-- 会员等级卡片 -->
    <div v-if="isLoggedIn" class="membership-card">
      <div class="membership-info">
        <div class="level-badge">
          <el-icon :size="32" color="#FFD700"><Medal /></el-icon>
          <span>{{ memberLevelName[profile.member_level] || '普通会员' }}</span>
        </div>
        <div class="membership-details">
          <h3>{{ profile.company_name || '商家用户' }}</h3>
          <p>会员有效期至：{{ profile.member_expire_at || (profile.validityPeriod ? `${profile.validityPeriod}个月` : '—') }}</p>
        </div>
      </div>
      <div class="membership-actions">
        <el-button type="warning" @click="$router.push('/merchant/member')">立即升级</el-button>
      </div>
    </div>

    <!-- 广告轮播 -->
    <div class="banner-section" v-if="banners.length">
      <el-carousel height="180px" :interval="5000" arrow="always">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-item" :style="{ background: banner.bg }" @click="banner.link && window.open(banner.link, '_blank')" :title="banner.link ? '点击跳转' : ''">
            <div class="banner-content">
              <h3>{{ banner.title }}</h3>
              <p>{{ banner.desc }}</p>
              <el-button type="primary" plain size="small">{{ banner.btn }}</el-button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 数据概览 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #67C23A;">
          <el-icon :size="24"><Goods /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.resources }}</div>
          <div class="stat-label">我的资源</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-icon" style="background: #ecf5ff; color: #409EFF;">
          <el-icon :size="24"><View /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ profile.view_count || 0 }}</div>
          <div class="stat-label">资源曝光</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f0f9ff; color: #36cfc9;">
          <el-icon :size="24"><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.intentions }}</div>
          <div class="stat-label">对接中</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalDemands }}</div>
          <div class="stat-label">平台总需求</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f0f9ff; color: #909399;">
          <el-icon :size="24"><Shop /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalResources }}</div>
          <div class="stat-label">平台总资源</div>
        </div>
      </el-card>
    </div>

    <!-- 推荐社区需求 -->
    <div class="section">
      <div class="section-header">
        <h2>
          <el-icon><StarFilled /></el-icon>
          为您推荐的社区需求
        </h2>
        <el-link type="success" @click="$router.push('/merchant/demands')">查看全部 →</el-link>
      </div>

      <div class="demand-list">
        <el-empty v-if="matchedDemands.length === 0" description="暂无推荐需求" />
        <el-card
          v-for="demand in matchedDemands"
          :key="demand.id"
          class="demand-card"
          shadow="hover"
          @click="viewDemandDetail(demand)"
        >
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
            <span style="cursor:pointer;color:#409EFF;text-decoration:underline" @click.stop="viewCommunityDetail(demand)">{{ demand.community_name }}</span>
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

          <div class="demand-detail-summary" v-if="demand.description || demand.sponsor_content || demand.fund_amount">
            <div v-if="demand.sponsor_content" class="detail-item">
              <span class="detail-label">赞助内容</span>
              <span class="detail-value">{{ demand.sponsor_content }}</span>
            </div>
            <div v-if="demand.fund_amount" class="detail-item">
              <span class="detail-label">资金需求</span>
              <span class="detail-value">¥{{ demand.fund_amount }}</span>
            </div>
            <div v-if="demand.goods_quantity" class="detail-item">
              <span class="detail-label">物资数量</span>
              <span class="detail-value">{{ demand.goods_quantity }}{{ demand.goods_unit || '份' }}</span>
            </div>
            <div v-if="demand.expert_count" class="detail-item">
              <span class="detail-label">所需人数</span>
              <span class="detail-value">{{ demand.expert_count }}人</span>
            </div>
          </div>

          <div class="demand-footer">
            <div class="sponsor-types">
              <span style="font-size:12px;color:#909399">所需：</span>
              <el-tag v-for="s in (demand.required_types_names || [])" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
            </div>
            <div class="footer-right">
              <span class="view-count"><el-icon :size="12"><View /></el-icon> {{ demand.view_count || 0 }}</span>
              <el-button type="primary" size="small" @click.stop="viewDemandDetail(demand)">查看详情</el-button>
            </div>
          </div>
        </el-card>
      </div>
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
import { ref, onMounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth, isLoggedIn as checkLogin } from '@/utils/useAuth'
import { getBanners, getRecommendDemands, getProfile, getMyResources, getMyIntentions, getMemberInfo, getCommunityDetail, getPublishTypes, getDemands, getResources, toggleFavorite, getMyFavorites } from '@/api/merchant'
import { Medal, StarFilled, Star, Goods, View, Connection, CircleCheck, User, Calendar, Loading, Edit, Location } from '@element-plus/icons-vue'

const router = useRouter()

// 判断是否登录
const isLoggedIn = checkLogin('merchant')

// 获取打开客服窗口的方法
const openServiceChat = inject('openServiceChat', null)

const banners = ref([])
const matchedDemands = ref([])
const profile = ref({})
const stats = ref({ resources: 0, intentions: 0, completed: 0, totalDemands: 0, totalResources: 0 })
const loading = ref(false)

// 判断是否为专家
const isExpert = computed(() => profile.value.company_type === 'expert')

// 社区详情弹窗
const showCommunityDialog = ref(false)
const communityDetail = ref(null)

async function viewCommunityDetail(demand) {
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

// 格式化日期时间（2026-04-15 9:00）
function fmtDeadline(t) {
  if (!t) return '长期'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

const bannerColors = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
]

onMounted(async () => {
  loading.value = true
  try {
    // 并行加载需求类型、收藏状态和初始数据
    loadDemandTypes()
    loadFavorites()

    const promises = [
      getBanners(),
      getRecommendDemands(),
      getDemands({ pageSize: 1 }),
      getResources({ pageSize: 1 })
    ]

    // 只有登录后才获取个人信息
    if (isLoggedIn) {
      promises.push(getProfile(), getMemberInfo(), getMyResources({ pageSize: 1 }), getMyIntentions({ pageSize: 50 }))
    }

    const results = await Promise.allSettled(promises)

    // Banner
    if (results[0].status === 'fulfilled') {
      banners.value = (results[0].value.data || []).map((b, i) => ({
        title: b.title || '邻盟商家端',
        desc: b.description || '连接社区，精准匹配',
        btn: '了解更多',
        bg: b.image_url ? `url(${b.image_url}) center/cover no-repeat` : bannerColors[i % bannerColors.length],
        link: b.link_url || ''
      }))
      if (!banners.value.length) {
        banners.value = [
          { title: '发布资源，精准触达', desc: '让社区主动找到您', btn: '立即发布', bg: bannerColors[0], link: '' },
          { title: '撮合成功，品牌曝光', desc: '提升品牌在社区的影响力', btn: '查看案例', bg: bannerColors[1], link: '' }
        ]
      }
    }

    // 推荐需求
    if (results[1].status === 'fulfilled') {
      let list = (results[1].value.data || []).slice(0, 4)
      // 标记收藏状态
      if (favDemandIds.value.size > 0) {
        list = list.map(d => ({ ...d, isFavorited: favDemandIds.value.has(d.id) }))
      }
      matchedDemands.value = list
    }

    // 平台总需求数
    if (results[2].status === 'fulfilled') {
      stats.value.totalDemands = results[2].value.data?.pagination?.total || results[2].value.data?.total || 0
    }

    // 平台总资源数
    if (results[3].status === 'fulfilled') {
      stats.value.totalResources = results[3].value.data?.pagination?.total || results[3].value.data?.total || 0
    }

    // 只有登录后才处理个人信息
    if (isLoggedIn && results.length > 5) {
      if (results[4].status === 'fulfilled') {
        profile.value = results[4].value.data || {}
      }

      // 优先用 getMemberInfo 的数据（更准确）
      if (results[5].status === 'fulfilled') {
        const mdata = results[5].value.data || {}
        if (mdata.member_level !== undefined && mdata.member_level !== null) {
          profile.value.member_level = mdata.member_level
        }
        if (mdata.expire_date || mdata.member_expire_at) {
          profile.value.member_expire_at = mdata.expire_date || mdata.member_expire_at
        }
        if (mdata.levels && Array.isArray(mdata.levels)) {
          const currentLevel = mdata.levels.find(l => l.level === profile.value.member_level)
          if (currentLevel) {
            profile.value.validityPeriod = currentLevel.validity_period || 0
          }
        }
      }

      if (results[6].status === 'fulfilled') {
        stats.value.resources = results[6].value.data?.pagination?.total || results[6].value.data?.total || 0
      }

      if (results[7].status === 'fulfilled') {
        const list = results[7].value.data?.list || results[7].value.data || []
        stats.value.intentions = list.filter(i => i.status === 0).length
        stats.value.completed = list.filter(i => i.status === 1).length
      }
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})

function viewDemandDetail(demand) {
  router.push(`/merchant/demands/${demand.id}`)
}

const contactCommunity = (demand) => {
  if (!localStorage.getItem('merchant_token')) {
    return requireAuth('merchant')
  }
  // 打开客服窗口
  if (openServiceChat) {
    openServiceChat()
  }
}

// 会员等级名称映射（从API动态加载）
const memberLevelNameMapData = ref({})
const memberLevelName = computed(() => memberLevelNameMapData.value)
const memberLevelTagType = { 0: 'info', 1: 'info', 2: '', 3: 'warning', 4: 'danger', 5: 'danger' }

// 需求类型映射（从API动态加载）
const demandTypeMap = ref({})
const typeColorsMap = ref({})
function getDemandTypeName(type) {
  return demandTypeMap.value[type] ?? type ?? '需求'
}
function getTypeColor(typeName) {
  return typeColorsMap.value[typeName] || 'primary'
}

// 收藏状态
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
// 加载需求类型和会员等级配置
async function loadDemandTypes() {
  try {
    const res = await getPublishTypes()
    // 加载需求类型（兼容 {id, name} 对象或字符串）
    if (res.data?.demand_types?.length) {
      const map = {}
      const colors = ['primary', 'success', 'warning', 'danger', 'info', '']
      const nameList = res.data.demand_types.map(item =>
        (typeof item === 'object' && item !== null) ? item.name : item
      )
      nameList.forEach((name, idx) => {
        map[idx] = name
        map[name] = name
        typeColorsMap.value[name] = colors[idx % colors.length]
      })
      demandTypeMap.value = map
    }
    // 加载会员等级配置
    if (res.data?.member_levels?.length) {
      const map = {}
      res.data.member_levels.forEach(item => {
        map[item.level] = item.name
      })
      memberLevelNameMapData.value = map
    }
  } catch {}
}
</script>

<style scoped>
.merchant-home {
  background: #f5f5f5;
  padding: 12px 14px 20px;
}

/* ===== 未登录欢迎横幅（移动端默认）===== */
.merchant-welcome {
  background: linear-gradient(135deg, #e66100, #b84d00);
  border-radius: 12px;
  padding: 16px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}
.merchant-welcome::before {
  content: '';
  position: absolute;
  top: -50px; right: -30px;
  width: 180px; height: 180px;
  background: rgba(255,255,255,.07);
  border-radius: 50%;
}
.merchant-welcome .welcome-content { position: relative; z-index: 1; }
.merchant-welcome .welcome-content h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.merchant-welcome .welcome-content p { opacity: 0.9; font-size: 13px; }
.merchant-welcome .welcome-actions { position: relative; z-index: 1; }
.merchant-welcome :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255,255,255,.15) !important;
  border-color: rgba(255,255,255,.4) !important;
  color: #fff !important;
  border-radius: 16px !important;
  font-weight: 600;
}
.merchant-welcome :deep(.el-button:hover:not(.el-button--primary)) {
  background: rgba(255,255,255,.28) !important;
}

/* ===== 未登录提示 ===== */
.login-tip-banner {
  margin-bottom: 16px;
}
.login-tip-banner :deep(.el-alert) {
  border-radius: 10px;
}

.membership-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.membership-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
}

.level-badge span {
  font-weight: bold;
  color: #FFD700;
}

.membership-details h3 {
  margin-bottom: 4px;
}

.membership-details p {
  opacity: 0.8;
  font-size: 14px;
  margin-bottom: 12px;
}

.membership-actions {
  display: flex;
  gap: 12px;
}

.banner-section {
  margin-bottom: 16px;
}

.banner-item {
  height: 100%;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  color: white;
  cursor: default;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.banner-content h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.banner-content p {
  margin-bottom: 6px;
  opacity: 0.9;
  font-size: 13px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
  font-size: 12px;
}

.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  color: #303133;
}

.demand-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.demand-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.demand-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 2px;
}

.heart {
  color: #ddd;
  font-size: 12px;
}

.heart.filled {
  color: #f56c6c;
}

.score-pct {
  font-size: 11px;
  color: #606266;
  font-weight: 500;
  margin-right: 2px;
}

.fav-btn {
  font-size: 14px;
  cursor: pointer;
  color: #c0c4cc;
  transition: color 0.2s;
}

.fav-btn:hover, .fav-btn.favorited {
  color: #f5a623;
}

.fav-btn.favorited {
  color: #f5a623;
}

.demand-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
}

.demand-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.divider {
  color: #ddd;
}

.distance-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #67C23A;
  font-size: 11px;
  font-weight: 500;
}

.demand-tags {
  margin-bottom: 6px;
}

.demand-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.sponsor-types {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #909399;
}

.footer-right .el-button {
  padding: 6px 12px;
  font-size: 12px;
}

/* 需求详情摘要样式 */
.demand-detail-summary {
  margin-top: 8px;
  padding: 6px 10px;
  background: #f9f9f9;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.detail-label {
  font-size: 11px;
  color: #909399;
}
.detail-value {
  font-size: 11px;
  color: #606266;
  font-weight: 500;
}

@media (max-width: 768px) {
  .membership-card {
    flex-direction: row;
    gap: 12px;
    padding: 14px;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .membership-info {
    flex: 1;
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .level-badge {
    padding: 10px;
    border-radius: 10px;
    min-width: 56px;
    flex-direction: column;
    gap: 4px;
  }

  .level-badge .el-icon {
    width: 28px !important;
    height: 28px !important;
  }

  .level-badge span {
    font-size: 11px !important;
  }

  .membership-details {
    flex: 1;
  }

  .membership-details h3 {
    font-size: 14px;
    margin-bottom: 4px;
    text-align: left;
  }

  .membership-details p {
    font-size: 11px;
    color: rgba(255,255,255,0.8);
  }

  .membership-actions {
    flex-shrink: 0;
  }

  .membership-actions .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }

  .banner-item {
    padding: 0 16px;
  }

  .banner-content h3 {
    font-size: 16px;
  }

  .banner-content p {
    font-size: 12px;
  }

  /* 轮播图手机端优化 */
  .banner-section :deep(.el-carousel) {
    border-radius: 12px;
  }
  .banner-section :deep(.el-carousel__container) {
    height: 140px !important;
  }
  .banner-section :deep(.el-carousel__item) {
    height: 140px !important;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .stat-card :deep(.el-card__body) {
    gap: 10px;
    padding: 12px;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    flex-shrink: 0;
    font-size: 16px !important;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 12px;
  }

  .section {
    margin-bottom: 20px;
  }

  .section-header {
    margin-bottom: 12px;
  }

  .section-header h2 {
    font-size: 15px;
  }

  .demand-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .demand-header {
    gap: 8px;
    padding-right: 0;
  }

  .demand-actions {
    flex-direction: column;
  }

  .demand-actions .el-button {
    width: 100%;
  }

  /* 社区详情弹窗手机端 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 12px auto !important;
  }

  /* 表格容器手机端 */
  :deep(.el-table) {
    font-size: 12px;
  }

  /* 搜索栏手机端 */
  .search-bar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .search-bar :deep(.el-select) {
    width: 100% !important;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .stat-card :deep(.el-card__body) {
    padding: 10px;
    gap: 8px;
  }
  .stat-value {
    font-size: 16px;
  }
}

/* ===== PC 端样式（≥769px）===== */
@media (min-width: 769px) {
  .merchant-home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 20px 40px;
    min-height: 100vh;
    background: #f0f2f5;
  }

  /* 欢迎横幅 PC */
  .merchant-welcome {
    padding: 24px 32px;
    margin-bottom: 16px;
  }
  .merchant-welcome .welcome-content h1 { font-size: 22px; }
  .merchant-welcome .welcome-content p { font-size: 14px; }

  /* 会员卡 PC */
  .membership-card { padding: 20px 24px; margin-bottom: 16px; }
  .membership-info { gap: 24px; }
  .level-badge { padding: 20px; gap: 10px; }
  .level-badge .el-icon { width: 36px !important; height: 36px !important; }
  .level-badge span { font-size: 13px !important; }
  .membership-details h3 { font-size: 18px; }
  .membership-details p { font-size: 14px; }

  /* 统计卡片 PC */
  .stats-row {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .stat-card :deep(.el-card__body) { gap: 14px; padding: 16px; }
  .stat-icon { width: 48px; height: 48px; border-radius: 12px; }
  .stat-value { font-size: 22px; }
  .stat-label { font-size: 13px; }

  /* Banner PC */
  .banner-section { margin-bottom: 20px; }
  .banner-section :deep(.el-carousel) { border-radius: 16px; overflow: hidden; }
  .banner-item { border-radius: 16px; padding: 0 60px; }
  .banner-content h3 { font-size: 26px; margin-bottom: 8px; }
  .banner-content p { font-size: 15px; margin-bottom: 14px; }

  /* 章节 PC */
  .section { margin-bottom: 24px; }
  .section-header { margin-bottom: 16px; }
  .section-header h2 { font-size: 18px; }

  /* 需求列表 PC：2列网格 */
  .demand-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .demand-card {
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .demand-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }

  /* 提示横幅 PC */
  .login-tip-banner { margin-bottom: 16px; }
  .login-tip-banner :deep(.el-alert) { border-radius: 12px; }
}
</style>
