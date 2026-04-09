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
        <el-button type="warning" plain @click="$router.push('/merchant/member')">查看权益</el-button>
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
        >
          <div class="match-score">
            <div class="hearts">
              <el-icon v-for="n in 5" :key="n" :class="{ filled: n <= (demand.matchScore || 0) }">
                <StarFilled />
              </el-icon>
            </div>
            <span class="score-text">{{ demand.matchScore ? demand.matchScore * 20 + '%' : '' }}匹配</span>
          </div>

          <div class="demand-header">
            <el-avatar :size="48" :src="demand.community?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(demand.community_name || '社')}&background=4A90D9&color=fff`" />
            <div class="community-info">
              <h4 style="cursor:pointer;color:#409EFF" @click.stop="viewCommunityDetail(demand)">{{ demand.community_name }}</h4>
              <el-tag size="small" type="info">{{ demand.demand_type }}</el-tag>
            </div>
          </div>

          <h4 class="demand-title">{{ demand.title }}</h4>

          <div class="demand-tags">
            <el-tag v-for="tag in (demand.tags || [])" :key="tag" size="small" effect="plain">
              {{ tag }}
            </el-tag>
          </div>

          <div class="demand-meta">
            <span><el-icon><User /></el-icon> {{ demand.households || 0 }}户</span>
            <span><el-icon><Calendar /></el-icon> {{ fmtDeadline(demand.deadline) }}截止</span>
          </div>

          <div class="demand-actions">
            <el-button type="success" @click="contactCommunity(demand)">立即联系</el-button>
            <el-button text @click="viewDemandDetail(demand)">查看详情</el-button>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth, isLoggedIn as checkLogin } from '@/utils/useAuth'
import { getBanners, getRecommendDemands, getProfile, getMyResources, getMyIntentions, getMemberInfo, getCommunityDetail } from '@/api/merchant'
import { Medal, StarFilled, Goods, View, Connection, CircleCheck, User, Calendar, Loading, Edit } from '@element-plus/icons-vue'

const router = useRouter()

// 判断是否登录
const isLoggedIn = checkLogin('merchant')

const banners = ref([])
const matchedDemands = ref([])
const profile = ref({})
const stats = ref({ resources: 0, intentions: 0, completed: 0 })
const loading = ref(false)
const memberLevelName = { 0: '免费试用', 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }

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
    const promises = [
      getBanners(),
      getRecommendDemands()
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
      matchedDemands.value = (results[1].value.data || []).slice(0, 4)
    }

    // 只有登录后才处理个人信息
    if (isLoggedIn && results.length > 2) {
      if (results[2].status === 'fulfilled') {
        profile.value = results[2].value.data || {}
      }

      // 优先用 getMemberInfo 的数据（更准确）
      if (results[3].status === 'fulfilled') {
        const mdata = results[3].value.data || {}
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

      if (results[4].status === 'fulfilled') {
        stats.value.resources = results[4].value.data?.pagination?.total || results[4].value.data?.total || 0
      }

      if (results[5].status === 'fulfilled') {
        const list = results[5].value.data?.list || results[5].value.data || []
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
  ElMessage.success(`已向${demand.community_name}发送合作意向`)
}

// 会员等级名称映射（用于详情弹窗）
const memberLevelNameMap = { 0: '免费试用', 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }
const memberLevelTagType = { 0: 'info', 1: 'info', 2: '', 3: 'warning', 4: 'danger', 5: 'danger' }
</script>

<style scoped>
.merchant-home {
  padding-bottom: 20px;
}

/* ===== 未登录欢迎横幅 ===== */
.merchant-welcome {
  background: linear-gradient(135deg, #e66100, #b84d00);
  border-radius: 16px;
  padding: 32px 36px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}
.merchant-welcome::before {
  content: '';
  position: absolute;
  top: -50px; right: -30px;
  width: 240px; height: 240px;
  background: rgba(255,255,255,.07);
  border-radius: 50%;
}
.merchant-welcome .welcome-content { position: relative; z-index: 1; }
.merchant-welcome .welcome-content h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.merchant-welcome .welcome-content p { opacity: 0.9; font-size: 14px; }
.merchant-welcome .welcome-actions { position: relative; z-index: 1; }
.merchant-welcome :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255,255,255,.15) !important;
  border-color: rgba(255,255,255,.4) !important;
  color: #fff !important;
  border-radius: 20px !important;
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
  padding: 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  margin-bottom: 24px;
}

.banner-item {
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 30px;
  color: white;
  cursor: default;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.banner-content h3 {
  font-size: 20px;
  margin-bottom: 4px;
}

.banner-content p {
  margin-bottom: 8px;
  opacity: 0.9;
  font-size: 14px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #303133;
}

.demand-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.demand-card {
  position: relative;
}

.match-score {
  position: absolute;
  top: 12px;
  right: 12px;
  text-align: right;
}

.hearts {
  display: flex;
  gap: 2px;
  color: #dcdfe6;
  margin-bottom: 4px;
}

.hearts .el-icon {
  font-size: 14px;
}

.hearts .el-icon.filled {
  color: #f56c6c;
}

.score-text {
  font-size: 12px;
  color: #f56c6c;
  font-weight: bold;
}

.demand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-right: 80px;
}

.community-info h4 {
  margin-bottom: 4px;
}

.demand-title {
  font-size: 16px;
  margin-bottom: 12px;
  color: #303133;
}

.demand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.demand-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}

.demand-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.demand-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .membership-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
  }

  .membership-info {
    flex-direction: column;
    gap: 12px;
  }

  .level-badge {
    padding: 12px;
  }

  .membership-details h3 {
    font-size: 15px;
    text-align: center;
  }

  .membership-actions {
    width: 100%;
    flex-direction: column;
  }

  .membership-actions .el-button {
    width: 100%;
  }

  .banner-item {
    padding: 0 16px;
  }

  .banner-content h3 {
    font-size: 16px;
  }

  .banner-content p {
    font-size: 13px;
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
    padding-right: 70px;
  }

  .demand-actions {
    flex-direction: column;
  }

  .demand-actions .el-button {
    width: 100%;
  }
}
</style>
