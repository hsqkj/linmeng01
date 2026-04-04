<template>
  <div class="community-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>欢迎回来，{{ profile.real_name || profile.community_name || '社区用户' }}！</h1>
        <p>{{ profile.community_name || '阳光花园社区' }} 今日有 <strong>{{ matchedResources.length }}</strong> 个新商家资源与您匹配</p>
      </div>
      <el-button type="primary" size="large" @click="$router.push('/community/demands/publish')">
        <el-icon><Plus /></el-icon>
        发布新需求
      </el-button>
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
          <!-- 右上角匹配度 -->
          <div class="match-score">
            <div class="hearts">
              <span class="score-label">匹配度</span>
              <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= (resource.matchHearts || 0) }]">♥</span>
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
import { requireAuth } from '@/utils/useAuth'
import { Shop, StarFilled, Document, Connection, CircleCheck, Present, Plus, View } from '@element-plus/icons-vue'
import { getBanners, getRecommendResources, getProfile, getMyDemands, getMyIntentions } from '@/api/community'

const router = useRouter()

const banners = ref([])
const matchedResources = ref([])
const activities = ref([])
const profile = ref({})
const stats = ref({ demands: 0, intentions: 0, completed: 0, rewards: 0 })
const loading = ref(false)

const bannerColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
]

onMounted(async () => {
  loading.value = true
  try {
    const [bannerRes, resourceRes, profileRes, demandsRes, intentionsRes] = await Promise.allSettled([
      getBanners(),
      getRecommendResources(),
      getProfile(),
      getMyDemands({ pageSize: 1 }),
      getMyIntentions({ pageSize: 50 })
    ])

    if (bannerRes.status === 'fulfilled') {
      banners.value = (bannerRes.value.data || []).map((b, i) => ({
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

    if (resourceRes.status === 'fulfilled') {
      matchedResources.value = (resourceRes.value.data || []).slice(0, 4)
    }

    if (profileRes.status === 'fulfilled') {
      profile.value = profileRes.value.data || {}
    }

    if (demandsRes.status === 'fulfilled') {
      stats.value.demands = demandsRes.value.data?.pagination?.total || demandsRes.value.data?.total || 0
    }

    if (intentionsRes.status === 'fulfilled') {
      const list = intentionsRes.value.data?.list || intentionsRes.value.data || []
      stats.value.intentions = list.filter(i => i.status === 0).length
      stats.value.completed = list.filter(i => i.status === 1).length
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
.community-home {
  padding-bottom: 20px;
}

.welcome-banner {
  background: linear-gradient(135deg, #409EFF 0%, #36cfc9 100%);
  border-radius: 12px;
  padding: 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.welcome-content h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.welcome-content p {
  opacity: 0.9;
}

.banner-section {
  margin-bottom: 24px;
}

.banner-item {
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 40px;
  color: white;
  cursor: default;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.banner-content h3 {
  font-size: 24px;
  margin-bottom: 8px;
}

.banner-content p {
  margin-bottom: 16px;
  opacity: 0.9;
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

.resource-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.resource-card {
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
  justify-content: flex-end;
  align-items: center;
}

.heart {
  color: #dcdfe6;
  font-size: 12px;
}

.heart.filled {
  color: #f56c6c;
}

.score-label {
  font-size: 11px;
  color: #606266;
  font-weight: 500;
  margin-right: 4px;
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-right: 80px;
}

.merchant-info {
  flex: 1;
  min-width: 0;
}

.merchant-info h4 {
  margin: 0 0 6px;
  font-size: 16px;
}

.merchant-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.star-rating-text {
  color: #f5a623;
  font-size: 13px;
  font-weight: 500;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #909399;
  font-size: 12px;
}

.resource-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.resource-actions {
  display: flex;
  gap: 8px;
}

.merchant-name-link {
  color: #409EFF;
  cursor: pointer;
  transition: color 0.2s;
}

.merchant-name-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    text-align: center;
    gap: 14px;
    padding: 20px 16px;
    border-radius: 8px;
  }

  .welcome-content h1 {
    font-size: 18px;
  }

  .welcome-content p {
    font-size: 13px;
  }

  .banner-item {
    padding: 0 20px;
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

  .resource-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .resource-header {
    gap: 8px;
    padding-right: 60px;
  }

  .merchant-info h4 {
    font-size: 14px;
  }

  .merchant-meta-row {
    gap: 4px;
  }

  .star-rating-text {
    font-size: 12px;
  }

  .view-count {
    font-size: 11px;
  }

  .resource-desc {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }

  .resource-actions {
    flex-direction: column;
  }

  .resource-actions .el-button {
    width: 100%;
  }
}
</style>
