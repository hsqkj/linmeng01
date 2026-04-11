<template>
  <div class="community-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner" :class="{ 'not-logged-in': !isLoggedIn }">
      <div class="welcome-content">
        <template v-if="isLoggedIn">
          <h1>欢迎回来，{{ profile.real_name || profile.community_name || '社区用户' }}！</h1>
          <p>{{ profile.community_name || '阳光花园社区' }} 今日有 <strong>{{ matchedResources.length }}</strong> 个新商家资源与您匹配</p>
        </template>
        <template v-else>
          <h1>欢迎来到邻盟平台！</h1>
          <p>连接社区与商家，精准匹配资源，共创美好生活</p>
        </template>
      </div>
      <el-button v-if="isLoggedIn" type="primary" size="large" @click="$router.push('/community/demands/publish')">
        <el-icon><Plus /></el-icon>
        发布新需求
      </el-button>
      <template v-else>
        <el-button type="primary" size="large" @click="$router.push('/login/community')">
          <el-icon><User /></el-icon>
          登录
        </el-button>
        <el-button size="large" @click="$router.push('/register/community')" style="margin-left: 10px;">
          <el-icon><Edit /></el-icon>
          注册
        </el-button>
      </template>
    </div>

    <!-- 未登录提示 -->
    <div v-if="!isLoggedIn" class="login-tip-banner">
      <el-alert
        title="登录后即可发布需求、联系商家、查看详细信息"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <span>登录后您可以：发布和管理需求 | 查看商家联系方式 | 参与需求撮合 | 获取奖励</span>
        </template>
      </el-alert>
    </div>

    <!-- 广告轮播 -->
    <div class="banner-section" v-if="banners.length">
      <el-carousel height="200px" :interval="5000" arrow="always">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-item" :style="{ background: banner.bg }" @click="banner.link && window.open(banner.link, '_blank')" :title="banner.link ? '点击跳转' : ''">
            <div class="banner-content">
              <h3>{{ banner.title }}</h3>
              <p>{{ banner.desc }}</p>
              <el-button type="primary" plain>{{ banner.btn }}</el-button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 数据概览 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #ecf5ff; color: #409EFF;">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.demands }}</div>
          <div class="stat-label">我的需求</div>
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
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
          <el-icon :size="24"><Present /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.rewards }}</div>
          <div class="stat-label">累计奖励</div>
        </div>
      </el-card>
    </div>

    <!-- 推荐商家资源 -->
    <div class="section">
      <div class="section-header">
        <h2>
          <el-icon><StarFilled /></el-icon>
          为您推荐的商家资源
        </h2>
        <el-link type="primary" @click="$router.push('/community/resources')">查看全部 →</el-link>
      </div>

      <div class="resource-list">
        <el-empty v-if="matchedResources.length === 0" description="暂无推荐资源" />
        <el-card
          v-for="resource in matchedResources"
          :key="resource.id"
          class="resource-card"
          shadow="hover"
        >
          <!-- 左上角资源类型 + 右上角匹配度 -->
          <div class="card-top-row">
            <el-tag size="small" type="success" effect="dark">{{ getResourceTypeName(resource.resource_type) }}</el-tag>
            <div class="match-score">
              <div class="hearts">
                <span class="score-label">匹配度</span>
                <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= (resource.matchHearts || 0) }]">♥</span>
              </div>
            </div>
          </div>

          <div class="resource-header">
            <el-avatar :size="48" :src="resource.merchant_logo" @error="() => true">
              <el-icon :size="24"><Shop /></el-icon>
            </el-avatar>
            <div class="merchant-info">
              <h4 class="merchant-name-link" @click.stop="viewMerchantDetail(resource)">{{ resource.company_name }}</h4>
              <!-- 商家评级+会员等级+浏览量 -->
              <div class="merchant-meta-row">
                <span class="star-rating-text">{{ resource.star_rating || 0 }}星</span>
                <el-divider direction="vertical" />
                <el-tag size="small" type="info">{{ resource.member_level || '普通会员' }}</el-tag>
                <el-divider direction="vertical" />
                <span class="view-count"><el-icon :size="12"><View /></el-icon> {{ resource.view_count || 0 }}</span>
              </div>
            </div>
          </div>

          <p class="resource-desc">{{ resource.content }}</p>

          <div class="resource-tags">
            <el-tag v-for="tag in (resource.tags || [])" :key="tag" size="small" effect="plain">
              {{ tag }}
            </el-tag>
          </div>

          <div class="resource-actions">
            <el-button type="primary" @click="contactMerchant(resource)">立即联系</el-button>
            <el-button text @click="router.push('/community/resources/' + resource.id)">查看详情</el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth, isLoggedIn as checkLogin } from '@/utils/useAuth'
import { Shop, StarFilled, Document, Connection, CircleCheck, Present, Plus, View, User, Edit } from '@element-plus/icons-vue'
import { getBanners, getRecommendResources, getProfile, getMyDemands, getMyIntentions } from '@/api/community'

const router = useRouter()

// 判断是否登录
const isLoggedIn = checkLogin('community')

const banners = ref([])
const matchedResources = ref([])
const activities = ref([])
const profile = ref({})
const stats = ref({ demands: 0, intentions: 0, completed: 0, rewards: 0 })
const loading = ref(false)

// 资源类型数字到中文映射
const resourceTypeNumMap = {
  0: '专业服务', 1: '教育培训', 2: '场地资源', 3: '物资捐赠',
  4: '志愿服务', 5: '资金赞助', 6: '技术支持', 7: '健康医疗',
  8: '活动赞助', 9: '媒体宣传', 10: '技能培训', 11: '养老服务'
}
const getResourceTypeName = (type) => resourceTypeNumMap[type] ?? type ?? '其他'

const bannerColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
]

onMounted(async () => {
  loading.value = true
  try {
    const promises = [
      getBanners(),
      getRecommendResources()
    ]

    // 只有登录后才获取个人信息
    if (isLoggedIn) {
      promises.push(getProfile(), getMyDemands({ pageSize: 1 }), getMyIntentions({ pageSize: 50 }))
    }

    const results = await Promise.allSettled(promises)

    // Banner
    if (results[0].status === 'fulfilled') {
      banners.value = (results[0].value.data || []).map((b, i) => ({
        title: b.title || '邻盟平台',
        desc: b.description || '连接社区与商家，共创美好生活',
        btn: '了解更多',
        bg: b.image_url ? `url(${b.image_url}) center/cover no-repeat` : bannerColors[i % bannerColors.length],
        link: b.link_url || ''
      }))
      if (banners.value.length === 0) {
        banners.value = [
          { title: '邻盟平台上线啦！', desc: '连接社区与商家，共创美好生活', btn: '了解更多', bg: bannerColors[0], link: '' },
          { title: '发布需求，精准匹配', desc: '填写越详细，匹配越精准', btn: '立即发布', bg: bannerColors[1], link: '' }
        ]
      }
    }

    // 推荐资源
    if (results[1].status === 'fulfilled') {
      matchedResources.value = (results[1].value.data || []).slice(0, 4)
    }

    // 只有登录后才处理个人信息
    if (isLoggedIn && results.length > 2) {
      if (results[2].status === 'fulfilled') {
        profile.value = results[2].value.data || {}
      }
      if (results[3].status === 'fulfilled') {
        stats.value.demands = results[3].value.data?.pagination?.total || results[3].value.data?.total || 0
      }
      if (results[4].status === 'fulfilled') {
        const list = results[4].value.data?.list || results[4].value.data || []
        stats.value.intentions = list.filter(i => i.status === 0).length
        stats.value.completed = list.filter(i => i.status === 1).length
      }
    }
  } catch {
    // ignore errors, show empty state
  } finally {
    loading.value = false
  }
})

const contactMerchant = (resource) => {
  if (!localStorage.getItem('community_token')) {
    return requireAuth('community')
  }
  ElMessage.success(`已向${resource.company_name}发送合作意向`)
}

const viewMerchantDetail = (resource) => {
  router.push(`/community/merchants/${resource.merchant_id}`)
}

const viewActivityDetail = (activity) => {
  if (activity.demandId) {
    router.push(`/community/demands/${activity.demandId}`)
  } else {
    ElMessage.info('该动态暂无详细内容')
  }
}
</script>

<style scoped>
.community-home { padding-bottom: 20px; }

/* ===== 欢迎 Banner ===== */
.welcome-banner {
  background: linear-gradient(135deg, #26a269, #1a7a4c);
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
.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50px; right: -30px;
  width: 240px; height: 240px;
  background: rgba(255,255,255,.07);
  border-radius: 50%;
}
.welcome-content { position: relative; z-index: 1; }
.welcome-content h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.welcome-content p { opacity: 0.9; font-size: 14px; }
.welcome-banner :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255,255,255,.15) !important;
  border-color: rgba(255,255,255,.4) !important;
  color: #fff !important;
  border-radius: 20px !important;
  font-weight: 600;
  backdrop-filter: blur(4px);
  position: relative; z-index: 1;
}
.welcome-banner :deep(.el-button:hover:not(.el-button--primary)) {
  background: rgba(255,255,255,.28) !important;
}

/* ===== 未登录提示 ===== */
.login-tip-banner {
  margin-bottom: 16px;
}
.login-tip-banner :deep(.el-alert) {
  border-radius: 10px;
}

/* ===== 未登录状态欢迎横幅 ===== */
.welcome-banner.not-logged-in {
  background: linear-gradient(135deg, #26a269, #1a7a4c);
}

/* ===== 广告轮播 ===== */
.banner-section { margin-bottom: 20px; }
.banner-section :deep(.el-carousel) { border-radius: 16px; overflow: hidden; }
.banner-item {
  height: 100%;
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 0 40px;
  color: white;
  text-shadow: 0 1px 4px rgba(0,0,0,.35);
}
.banner-content h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.banner-content p  { margin-bottom: 14px; opacity: 0.9; font-size: 14px; }

/* ===== 统计卡片 ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  transition: all .2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
.stat-card :deep(.el-card__body) { display: flex; align-items: center; gap: 14px; }
.stat-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-value { font-size: 28px; font-weight: 700; color: #1a1a1a; }
.stat-label  { color: #888; font-size: 13px; margin-top: 3px; }

/* ===== 章节 ===== */
.section { margin-bottom: 28px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h2 {
  display: flex; align-items: center; gap: 8px;
  font-size: 18px; font-weight: 700; color: #1a1a1a;
}

/* ===== 资源卡片 ===== */
.resource-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.resource-card {
  position: relative;
  border-radius: 16px !important;
  overflow: hidden;
  transition: all .2s !important;
}
.resource-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.12) !important; }

.card-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.match-score { text-align: right; }
.hearts { display: flex; gap: 2px; justify-content: flex-end; align-items: center; }
.heart { color: #e0e0e0; font-size: 13px; }
.heart.filled { color: #ff4d4f; }
.score-label { font-size: 11px; color: #888; font-weight: 500; margin-right: 3px; }

.resource-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 12px; padding-right: 88px;
}
.merchant-info { flex: 1; min-width: 0; }
.merchant-info h4 { margin: 0 0 5px; font-size: 15px; font-weight: 700; }
.merchant-meta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.star-rating-text { color: #f5a623; font-size: 12px; font-weight: 600; }
.view-count { display: flex; align-items: center; gap: 3px; color: #999; font-size: 12px; }

.resource-desc {
  color: #666; font-size: 13px; margin-bottom: 12px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.6;
}
.resource-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.resource-actions { display: flex; gap: 8px; }
.merchant-name-link { color: #26a269; cursor: pointer; transition: color .2s; }
.merchant-name-link:hover { color: #1a7a4c; text-decoration: underline; }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .welcome-banner { flex-direction: column; text-align: center; gap: 14px; padding: 20px 16px; }
  .welcome-content h1 { font-size: 18px; }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-icon { width: 40px; height: 40px; border-radius: 10px; }
  .stat-value { font-size: 22px; }
  .banner-item { padding: 0 20px; }
  .banner-content h3 { font-size: 16px; }
}
</style>
