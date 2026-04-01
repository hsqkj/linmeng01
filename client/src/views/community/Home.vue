<template>
  <div class="community-home">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>欢迎回来，张主任！</h1>
        <p>阳光花园社区今日有 <strong>3</strong> 个新商家资源与您匹配</p>
      </div>
      <el-button type="primary" size="large" @click="$router.push('/community/demands/publish')">
        <el-icon><Plus /></el-icon>
        发布新需求
      </el-button>
    </div>

    <!-- 广告轮播 -->
    <div class="banner-section">
      <el-carousel height="200px" :interval="5000" arrow="always">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-item" :style="{ background: banner.bg }">
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
          <div class="stat-value">12</div>
          <div class="stat-label">我的需求</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f0f9ff; color: #36cfc9;">
          <el-icon :size="24"><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">8</div>
          <div class="stat-label">对接中</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">5</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
          <el-icon :size="24"><Present /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥1,000</div>
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
        <el-card 
          v-for="resource in matchedResources" 
          :key="resource.id"
          class="resource-card"
          shadow="hover"
        >
          <div class="match-score">
            <!-- 星级优先显示 -->
            <div class="stars-display">
              <el-icon v-for="n in 5" :key="n" :class="['star-icon', { filled: n <= (resource.merchant?.starRating || 0) }]">
                <StarFilled />
              </el-icon>
            </div>
            <div class="hearts">
              <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= resource.matchScore }]">♥</span>
            </div>
            <span class="score-text">{{ resource.matchScore * 20 }}%匹配</span>
          </div>
          
          <div class="resource-header">
            <el-avatar :size="48" :src="resource.merchant?.logo" @error="() => true">
              <el-icon :size="24"><Shop /></el-icon>
            </el-avatar>
            <div class="merchant-info">
              <h4 class="merchant-name-link" @click.stop="viewMerchantDetail(resource)">{{ resource.merchant?.name }}</h4>
              <el-tag size="small" type="info">{{ resource.type }}</el-tag>
            </div>
          </div>
          
          <p class="resource-desc">{{ resource.content }}</p>
          
          <div class="resource-tags">
            <el-tag v-for="tag in resource.merchant?.tags" :key="tag" size="small" effect="plain">
              {{ tag }}
            </el-tag>
          </div>
          
          <div class="resource-actions">
            <el-button type="primary" @click="contactMerchant(resource)">立即联系</el-button>
            <el-button text @click="viewMerchantDetail(resource)">查看详情</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 最新需求动态 -->
    <div class="section">
      <div class="section-header">
        <h2>
          <el-icon><TrendCharts /></el-icon>
          社区最新动态
        </h2>
      </div>
      
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :type="activity.type"
          :icon="activity.icon"
          :timestamp="activity.time"
          class="timeline-item-clickable"
          @click="viewActivityDetail(activity)"
        >
          {{ activity.content }}
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Shop, StarFilled } from '@element-plus/icons-vue'

const router = useRouter()

const banners = [
  { title: '邻盟平台上线啦！', desc: '连接社区与商家，共创美好生活', btn: '了解更多', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { title: '发布需求，精准匹配', desc: '填写越详细，匹配越精准', btn: '立即发布', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { title: '撮合成功，物资奖励', desc: '每笔成功撮合，平台捐赠200元物资', btn: '查看详情', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { title: '招商大使火热招募', desc: '发展商家会员，获取20%提成', btn: '加入我们', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
]

const matchedResources = ref([])

const mockResources = [
  { id: 1, type: '资金赞助', merchant: { name: '星巴克咖啡', logo: '', tags: ['社区建设', '志愿服务'], starRating: 5 }, content: '为社区文化、亲子类活动提供资金支持，资金1万~5万元', matchScore: 5 },
  { id: 2, type: '专业服务', merchant: { name: '新东方教育', logo: '', tags: ['教育培训', '亲子活动'], starRating: 5 }, content: '专业讲师进社区，开展亲子教育主题讲座', matchScore: 4 },
  { id: 3, type: '物资提供', merchant: { name: '华润万家', logo: '', tags: ['社区建设', '节庆活动'], starRating: 4 }, content: '在春节、端午、中秋等传统节日提供物资捐赠', matchScore: 3 },
  { id: 4, type: '专业服务', merchant: { name: '京东健康', logo: '', tags: ['老年服务', '健康医疗'], starRating: 4 }, content: '执业医师到社区开展义诊，提供免费检测', matchScore: 5 }
]

const activities = ref([
  { id: 1, content: '星巴克咖啡对"六一儿童节亲子嘉年华"表达了合作意向', time: '10分钟前', type: 'primary', icon: 'Star', demand: '六一儿童节亲子嘉年华活动赞助' },
  { id: 2, content: '新东方教育发布了新的教育资源', time: '30分钟前', type: 'success', icon: 'Plus', demand: '' },
  { id: 3, content: '您发布的"社区健康义诊活动"已通过审核', time: '1小时前', type: 'warning', icon: 'Check', demand: '社区健康义诊活动' },
  { id: 4, content: '京东健康与您完成了合作对接', time: '昨天', type: 'success', icon: 'CircleCheck', demand: '' }
])

onMounted(async () => {
  matchedResources.value = mockResources.slice(0, 4)
})

const contactMerchant = (resource) => {
  ElMessage.success(`已向${resource.merchant?.name}发送合作意向`)
}

const viewMerchantDetail = (resource) => {
  router.push(`/community/merchants/${resource.id}`)
}

const viewActivityDetail = (activity) => {
  if (activity.demand) {
    ElMessage.success(`查看详情：${activity.demand}`)
    router.push('/community/demands')
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

.stars-display {
  display: flex;
  gap: 2px;
  color: #dcdfe6;
  margin-bottom: 2px;
  justify-content: flex-end;
}

.stars-display .star-icon {
  font-size: 14px;
}

.stars-display .star-icon.filled {
  color: #f5a623;
}

.hearts {
  display: flex;
  gap: 2px;
  margin-bottom: 2px;
  justify-content: flex-end;
}

.heart {
  color: #dcdfe6;
  font-size: 12px;
}

.heart.filled {
  color: #f56c6c;
}

.score-text {
  font-size: 11px;
  color: #909399;
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-right: 80px;
}

.merchant-info h4 {
  margin-bottom: 4px;
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

.timeline-item-clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-item-clickable:hover {
  background: #f5f7fa;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .resource-list {
    grid-template-columns: 1fr;
  }
}
</style>
