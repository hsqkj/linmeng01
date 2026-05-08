<template>
  <div class="community-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner" :class="{ 'not-logged-in': !isLoggedIn }">
      <!-- 左侧欢迎内容 -->
      <div class="welcome-content">
        <template v-if="isLoggedIn && profile">
          <h1>欢迎回来，{{ profile.real_name || profile.name || '社区用户' }}！</h1>
          <p v-if="profile.community">{{ profile.community }} · </p>
          <p>今日有 <strong>{{ matchedCount || 0 }}</strong> 个新商家资源与您匹配</p>
        </template>
        <template v-else-if="isLoggedIn">
          <h1>欢迎回来！</h1>
          <p>今日有 <strong>{{ matchedCount || 0 }}</strong> 个新商家资源与您匹配</p>
        </template>
        <template v-else>
          <h1>欢迎来到邻盟平台！</h1>
          <p>连接社区与商家，精准匹配资源，共创美好生活</p>
        </template>
      </div>
      <!-- 右侧按钮 -->
      <div class="welcome-actions">
        <template v-if="isLoggedIn">
          <el-button type="primary" size="large" @click="goToPublish">
            <el-icon><Plus /></el-icon>
            发布新需求
          </el-button>
        </template>
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
          <div class="banner-item" :style="{ background: banner.bg }" @click="banner.link && openLink(banner.link)" :title="banner.link ? '点击跳转' : ''">
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
    <el-card class="stats-panel">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-icon" style="background: #ecf5ff; color: #409EFF;">
            <el-icon :size="20"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.demands }}</div>
            <div class="stat-label">我的需求</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: #f0f9ff; color: #36cfc9;">
            <el-icon :size="20"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.intentions }}</div>
            <div class="stat-label">对接中</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon :size="20"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon :size="20"><Present /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.rewards }}</div>
            <div class="stat-label">累计奖励</div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
            <el-icon :size="20"><Goods /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalDemands }}</div>
            <div class="stat-label">平台总需求</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: #f0f9ff; color: #909399;">
            <el-icon :size="20"><Shop /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalResources }}</div>
            <div class="stat-label">平台总资源</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f;">
            <el-icon :size="20"><View /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.demandViews }}</div>
            <div class="stat-label">我的需求浏览</div>
          </div>
        </div>
      </div>
    </el-card>

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
                <el-tag size="small" type="info">{{ memberLevelMap[resource.member_level] || '普通会员' }}</el-tag>
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
            <el-button type="primary" @click="contactMerchant(resource)">留言咨询</el-button>
            <el-button text @click="router.push('/community/resources/' + resource.id)">查看详情</el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>

  <!-- 底部备案号 -->
  <div class="site-footer">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow">鄂ICP备2021018843号-3</a>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth, isLoggedIn as checkLogin } from '@/utils/useAuth'
import { Shop, StarFilled, Document, Connection, CircleCheck, Present, Plus, View, User, Edit } from '@element-plus/icons-vue'
import { getBanners, getRecommendResources, getProfile, getMyDemands, getMyIntentions, getResources, getDemands } from '@/api/community'

const router = useRouter()

// 判断是否登录
const isLoggedIn = checkLogin('community')

// 获取打开客服窗口的方法
const openServiceChat = inject('openServiceChat', null)

const banners = ref([])
const matchedResources = ref([])
const matchedCount = ref(0)
const activities = ref([])
const profile = ref({})
const stats = ref({ demands: 0, intentions: 0, completed: 0, rewards: 0, totalDemands: 0, totalResources: 0, demandViews: 0 })
const loading = ref(false)

// 跳转到发布需求页面
const goToPublish = () => {
  if (!isLoggedIn) {
    router.push('/login/community')
  } else {
    router.push('/community/demands/publish')
  }
}

// 打开外链
const openLink = (url) => { window.open(url, '_blank') }

// 资源类型映射（从API动态加载）
const resourceTypeNumMap = ref({})
const getResourceTypeName = (type) => {
  if (typeof type === 'string' && resourceTypeNumMap.value[type] !== undefined) {
    return resourceTypeNumMap.value[type]
  }
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeNumMap.value[num] !== undefined) {
    return resourceTypeNumMap.value[num]
  }
  if (typeof type === 'string') {
    return type
  }
  return type || '其他'
}

// 会员等级数字到中文映射（从API动态加载）
const memberLevelMapData = ref({})
const memberLevelMap = computed(() => memberLevelMapData.value)

// 加载资源类型配置（同时加载会员等级）
async function loadResourceTypes() {
  try {
    const { getPublishTypes } = await import('@/api/community')
    const res = await getPublishTypes()
    // 资源类型（API返回 {id, name} 对象数组）
    if (res.data?.resource_types?.length) {
      const map = {}
      res.data.resource_types.forEach((item, idx) => {
        const name = (typeof item === 'object' && item !== null) ? item.name : item
        const id = (typeof item === 'object' && item !== null) ? item.id : idx
        map[id] = name
        map[name] = name
      })
      resourceTypeNumMap.value = map
    }
    // 会员等级
    if (res.data?.member_levels?.length) {
      const map = {}
      res.data.member_levels.forEach(item => {
        const levelVal = (typeof item === 'object' && item !== null) ? item.level : item
        const nameVal = (typeof item === 'object' && item !== null) ? item.name : item
        map[levelVal] = nameVal
      })
      memberLevelMapData.value = map
    }
  } catch {}
}

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
      getRecommendResources(),
      getResources({ pageSize: 1 }),
      getDemands({ pageSize: 1 })
    ]

    // 只有登录后才获取个人信息
    if (isLoggedIn) {
      promises.push(getProfile(), getMyDemands({ pageSize: 100 }), getMyIntentions({ pageSize: 50 }))
    }

    // 加载资源类型配置
    promises.push(loadResourceTypes())

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
      const allResources = results[1].value.data || []
      matchedCount.value = allResources.length
      matchedResources.value = allResources.slice(0, 4)
    }

    // 平台总资源数
    if (results[2].status === 'fulfilled') {
      stats.value.totalResources = results[2].value.data?.pagination?.total || results[2].value.data?.total || 0
    }

    // 平台总需求数
    if (results[3].status === 'fulfilled') {
      stats.value.totalDemands = results[3].value.data?.pagination?.total || results[3].value.data?.total || 0
    }

    // 只有登录后才处理个人信息
    if (isLoggedIn && results.length > 7) {
      if (results[5].status === 'fulfilled') {
        const data = results[5].value.data || {}
        profile.value = data
        // 如果没有community_name，尝试从其他字段获取
        if (!data.community_name && data.name) {
          profile.value.community_name = data.name
        }
      }
      if (results[6].status === 'fulfilled') {
        const myDemands = results[6].value.data?.list || results[6].value.data || []
        stats.value.demands = myDemands.length
        // 计算该社区已发布需求的总浏览量
        stats.value.demandViews = myDemands.reduce((sum, d) => sum + (d.view_count || 0), 0)
      }
      if (results[7].status === 'fulfilled') {
        const list = results[7].value.data?.list || results[7].value.data || []
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
  // 打开客服窗口
  if (openServiceChat) {
    openServiceChat()
  } else {
    ElMessage.info('客服功能正在加载中，请稍后再试')
  }
}

const viewMerchantDetail = (resource) => {
  // 跳转到该商家资源的详情页
  router.push(`/community/resources/${resource.id}`)
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

/* ===== 基础样式（移动端默认，PC覆盖）===== */
.community-home {
  background: #f5f5f5;
  padding: 12px 14px 20px;
}
.welcome-content { position: relative; z-index: 1; }
.welcome-content h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: #fff; }
.welcome-content p { opacity: 0.9; font-size: 13px; color: #fff; display: inline; }
.welcome-actions { position: relative; z-index: 10; flex-shrink: 0; }
.banner-section { margin-bottom: 20px; }
.banner-item {
  height: 200px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-radius: 16px;
  cursor: pointer;
}
.banner-content { color: #fff; }
.banner-content h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.banner-content p { margin-bottom: 12px; opacity: 0.9; font-size: 14px; }
.section { margin-bottom: 20px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-header h2 {
  display: flex; align-items: center; gap: 6px;
  font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0;
}
.resource-list { display: block; }
.card-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.match-score { display: flex; align-items: center; gap: 4px; }
.hearts { display: flex; align-items: center; gap: 2px; }
.score-label { font-size: 12px; color: #999; margin-right: 4px; }
.heart { color: #ddd; font-size: 14px; }
.heart.filled { color: #f56c6c; }
.resource-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.merchant-info { flex: 1; min-width: 0; }
.merchant-name-link { font-size: 15px; font-weight: 600; margin: 0 0 4px; cursor: pointer; color: #333; }
.merchant-meta-row { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #909399; flex-wrap: wrap; }
.star-rating-text { color: #f56c6c; }
.view-count { display: flex; align-items: center; gap: 2px; }
.resource-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.resource-tags { margin-bottom: 8px; }
.resource-tags .el-tag { margin: 2px; }
.resource-actions { display: flex; gap: 8px; }
.site-footer { text-align: center; padding: 16px 0; font-size: 12px; color: #999; }
.site-footer a { color: #999; text-decoration: none; }

/* ===== PC 端样式（≥769px）===== */
@media (min-width: 769px) {
  .community-home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 20px 40px;
    min-height: 100vh;
    background: #f0f2f5;
  }

  /* 欢迎横幅 PC 版 */
  .welcome-banner {
    background: linear-gradient(135deg, #26a269, #1a7a4c);
    border-radius: 12px;
    padding: 24px 32px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(38, 162, 105, 0.3);
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
  .welcome-content h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
  .welcome-content p { opacity: 0.9; font-size: 14px; display: inline; }
  .welcome-actions { position: relative; z-index: 10; flex-shrink: 0; }
  .welcome-banner :deep(.el-button) { position: relative; }
  .welcome-banner :deep(.el-button:not(.el-button--primary)) {
    background: rgba(255,255,255,.15) !important;
    border-color: rgba(255,255,255,.4) !important;
    color: #fff !important;
    border-radius: 20px !important;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }
  .welcome-banner :deep(.el-button:hover:not(.el-button--primary)) {
    background: rgba(255,255,255,.28) !important;
  }

  /* 未登录提示 */
  .login-tip-banner { margin-bottom: 16px; }
  .login-tip-banner :deep(.el-alert) { border-radius: 10px; }
  .welcome-banner.not-logged-in { background: linear-gradient(135deg, #26a269, #1a7a4c); }

  /* 广告轮播 */
  .banner-section { margin-bottom: 20px; }
  .banner-section :deep(.el-carousel) { border-radius: 16px; overflow: hidden; }
  .banner-item {
    height: 100%;
    border-radius: 16px;
    display: flex;
    align-items: center;
    padding: 0 60px;
    color: white;
    text-shadow: 0 1px 4px rgba(0,0,0,.35);
  }
  .banner-content h3 { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
  .banner-content p { margin-bottom: 18px; opacity: 0.9; font-size: 16px; }

  /* 统计卡片 */
  .stats-panel { margin-bottom: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .stats-panel :deep(.el-card__body) { padding: 16px 20px; }
  .stats-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 24px;
  }
  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    padding: 12px 8px;
    border-radius: 10px;
    transition: all .2s;
  }
  .stat-item:hover { background: #f5f5f5; }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .stat-info { min-width: 0; }
  .stat-value { font-size: 22px; font-weight: 700; color: #1a1a1a; white-space: nowrap; }
  .stat-label  { color: #888; font-size: 12px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* 章节 */
  .section { margin-bottom: 24px; }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;
  }
  .section-header h2 {
    display: flex; align-items: center; gap: 8px;
    font-size: 18px; font-weight: 700; color: #1a1a1a;
  }

  /* 资源卡片 */
  .resource-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .resource-card {
    position: relative;
    border-radius: 12px !important;
    overflow: hidden;
    transition: all .2s !important;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .resource-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }

  .card-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 16px; padding-top: 12px; }
  .match-score { text-align: right; }
  .hearts { display: flex; gap: 2px; justify-content: flex-end; align-items: center; }
  .heart { color: #e0e0e0; font-size: 14px; }
  .heart.filled { color: #ff4d4f; }
  .score-label { font-size: 12px; color: #888; font-weight: 500; margin-right: 4px; }

  .resource-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 10px; padding: 0 16px;
  }
  .merchant-info { flex: 1; min-width: 0; }
  .merchant-info h4 { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
  .merchant-meta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .star-rating-text { color: #f5a623; font-size: 12px; font-weight: 600; }
  .view-count { display: flex; align-items: center; gap: 3px; color: #999; font-size: 12px; }

  .resource-desc {
    color: #666; font-size: 14px; margin-bottom: 12px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.6;
    padding: 0 16px;
  }
  .resource-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; padding: 0 16px; }
  .resource-actions { display: flex; gap: 10px; justify-content: space-between; padding: 0 16px 14px; }
  .resource-actions .el-button { flex: 1; padding: 10px 14px; font-size: 14px; }
  .resource-actions .el-button:first-child { margin-right: 0; }
  .merchant-name-link { color: #26a269; cursor: pointer; transition: color .2s; }
  .merchant-name-link:hover { color: #1a7a4c; text-decoration: underline; }

  /* 底部备案号 */
  .site-footer {
    text-align: center;
    padding: 24px 0;
    font-size: 12px;
    color: #999;
    border-top: 1px solid #eee;
    margin-top: 20px;
  }
  .site-footer a { color: #999; text-decoration: none; }
}

/* ===== 移动端样式（≤768px）===== */
@media (max-width: 768px) {
  .community-home { padding-bottom: 20px; }

  /* 底部备案号 */
  .site-footer {
    text-align: center;
    padding: 20px 0;
    font-size: 12px;
    color: #999;
    border-top: 1px solid #eee;
    margin-top: 20px;
  }
  .site-footer a { color: #999; text-decoration: none; }

  /* ===== 欢迎 Banner ===== */
  .welcome-banner {
    background: linear-gradient(135deg, #26a269, #1a7a4c);
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
  .welcome-banner::before {
    content: '';
    position: absolute;
    top: -50px; right: -30px;
    width: 240px; height: 240px;
    background: rgba(255,255,255,.07);
    border-radius: 50%;
  }
  .welcome-content { position: relative; z-index: 1; }
  .welcome-content h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .welcome-content p { opacity: 0.9; font-size: 13px; display: inline; }
  .welcome-actions { position: relative; z-index: 10; flex-shrink: 0; }
  .welcome-banner :deep(.el-button) { position: relative; }
  .welcome-banner :deep(.el-button:not(.el-button--primary)) {
    background: rgba(255,255,255,.15) !important;
    border-color: rgba(255,255,255,.4) !important;
    color: #fff !important;
    border-radius: 20px !important;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }
  .welcome-banner :deep(.el-button:hover:not(.el-button--primary)) {
    background: rgba(255,255,255,.28) !important;
  }

  /* ===== 未登录提示 ===== */
  .login-tip-banner { margin-bottom: 16px; }
  .login-tip-banner :deep(.el-alert) { border-radius: 10px; }

  /* ===== 未登录状态欢迎横幅 ===== */
  .welcome-banner.not-logged-in { background: linear-gradient(135deg, #26a269, #1a7a4c); }

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
  .stats-panel { margin-bottom: 16px; }
  .stats-panel :deep(.el-card__body) { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
  .stats-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 8px 6px;
    border-radius: 10px;
    transition: all .2s;
  }
  .stat-item:hover { background: #f5f5f5; }
  .stat-icon {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .stat-info { min-width: 0; }
  .stat-value { font-size: 18px; font-weight: 700; color: #1a1a1a; white-space: nowrap; }
  .stat-label  { color: #888; font-size: 11px; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ===== 章节 ===== */
  .section { margin-bottom: 20px; }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .section-header h2 {
    display: flex; align-items: center; gap: 6px;
    font-size: 16px; font-weight: 700; color: #1a1a1a;
  }

  /* ===== 资源卡片 ===== */
  .resource-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .resource-card {
    position: relative;
    border-radius: 12px !important;
    overflow: hidden;
    transition: all .2s !important;
  }
  .resource-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.1) !important; }

  .card-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .match-score { text-align: right; }
  .hearts { display: flex; gap: 2px; justify-content: flex-end; align-items: center; }
  .heart { color: #e0e0e0; font-size: 12px; }
  .heart.filled { color: #ff4d4f; }
  .score-label { font-size: 11px; color: #888; font-weight: 500; margin-right: 3px; }

  .resource-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 8px; padding-right: 80px;
  }
  .merchant-info { flex: 1; min-width: 0; }
  .merchant-info h4 { margin: 0 0 4px; font-size: 14px; font-weight: 700; }
  .merchant-meta-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .star-rating-text { color: #f5a623; font-size: 11px; font-weight: 600; }
  .view-count { display: flex; align-items: center; gap: 2px; color: #999; font-size: 11px; }

  .resource-desc {
    color: #666; font-size: 13px; margin-bottom: 10px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.5;
  }
  .resource-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
  .resource-actions { display: flex; gap: 8px; justify-content: space-between; }
  .resource-actions .el-button { flex: 1; padding: 8px 12px; font-size: 13px; }
  .resource-actions .el-button:first-child { margin-right: 8px; }
  .merchant-name-link { color: #26a269; cursor: pointer; transition: color .2s; }
  .merchant-name-link:hover { color: #1a7a4c; text-decoration: underline; }

  /* ===== 响应式 ===== */
  .welcome-banner { 
    flex-direction: column !important; 
    text-align: center; 
    gap: 14px; 
    padding: 20px 16px; 
    display: flex !important;
  }
  .welcome-actions { 
    width: 100%; 
    justify-content: center;
  }
  .welcome-content h1 { font-size: 18px; }
  .stats-panel :deep(.el-card__body) { padding: 10px 12px; gap: 6px; }
  .stats-row { gap: 6px; }
  .stat-item { gap: 6px; padding: 6px 4px; min-width: 0; }
  .stat-icon { width: 30px; height: 30px; border-radius: 8px; }
  .stat-value { font-size: 16px; }
  .stat-label { font-size: 11px; white-space: nowrap; }
  .banner-item { padding: 0 16px; }
  .banner-content h3 { font-size: 16px; }
  .banner-content p { font-size: 12px; }

  /* 资源卡片移动端优化 */
  .resource-list { grid-template-columns: 1fr; gap: 12px; }
  .resource-card { margin-bottom: 0; }
  .resource-header { padding-right: 0; }
  .merchant-info h4 { font-size: 14px; }
  .resource-actions { 
    flex-direction: row !important; 
    gap: 8px; 
  }
  .resource-actions .el-button { 
    flex: 1; 
    width: auto;
  }

  /* 章节标题 */
  .section { margin-bottom: 20px; }
  .section-header h2 { font-size: 16px; }

  /* 轮播图 */
  .banner-section :deep(.el-carousel) { border-radius: 12px; }
  .banner-section :deep(.el-carousel__container) { height: 140px !important; }
  .banner-section :deep(.el-carousel__item) { height: 140px !important; }

  /* 表格容器 */
  :deep(.el-table) { font-size: 12px; }
  :deep(.el-table__header th) { padding: 8px 0; font-size: 12px; }
  :deep(.el-table__body td) { padding: 8px 4px; }

  /* 搜索栏 */
  .search-bar { flex-wrap: wrap; gap: 8px; }
  .search-bar :deep(.el-select) { width: 100% !important; }
  .search-bar :deep(.el-date-editor) { width: 100% !important; }

  /* 表单 */
  :deep(.el-form-item) { margin-bottom: 12px; }
  :deep(.el-form-item__label) { font-size: 13px; }

  /* 按钮 */
  :deep(.el-button) { font-size: 14px; min-height: 36px; }
}

@media (max-width: 480px) {
  .stat-item { gap: 4px; padding: 4px 2px; }
  .stat-icon { width: 24px; height: 24px; border-radius: 6px; }
  .stat-value { font-size: 14px; }
  .stat-label { font-size: 10px; }
}
</style>
