<template>
  <div class="merchant-home">
    <!-- 会员等级卡片 -->
    <div class="membership-card">
      <div class="membership-info">
        <div class="level-badge">
          <el-icon :size="32" color="#FFD700"><Medal /></el-icon>
          <span>金牌会员</span>
        </div>
        <div class="membership-details">
          <h3>星巴克咖啡</h3>
          <p>会员有效期至：2027-03-31</p>
        </div>
      </div>
      <div class="membership-actions">
        <el-button type="warning" plain @click="$router.push('/merchant/member')">查看权益</el-button>
        <el-button type="warning" @click="$router.push('/merchant/member')">立即升级</el-button>
      </div>
    </div>

    <!-- 广告轮播 -->
    <div class="banner-section">
      <el-carousel height="180px" :interval="5000" arrow="always">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-item" :style="{ background: banner.bg }">
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
          <div class="stat-value">8</div>
          <div class="stat-label">我的资源</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #ecf5ff; color: #409EFF;">
          <el-icon :size="24"><View /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">1,234</div>
          <div class="stat-label">资源曝光</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f0f9ff; color: #36cfc9;">
          <el-icon :size="24"><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">12</div>
          <div class="stat-label">对接中</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">6</div>
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
        <el-card 
          v-for="demand in matchedDemands" 
          :key="demand.id"
          class="demand-card"
          shadow="hover"
        >
          <div class="match-score">
            <div class="hearts">
              <el-icon v-for="n in 5" :key="n" :class="{ filled: n <= Math.ceil(demand.matchScore / 20) }">
                <StarFilled />
              </el-icon>
            </div>
            <span class="score-text">{{ demand.matchScore }}%匹配</span>
          </div>
          
          <div class="demand-header">
            <el-avatar :size="48" :src="demand.community?.logo" />
            <div class="community-info">
              <h4>{{ demand.community?.name }}</h4>
              <el-tag size="small" type="info">{{ demand.type }}</el-tag>
            </div>
          </div>
          
          <h4 class="demand-title">{{ demand.title }}</h4>
          
          <div class="demand-tags">
            <el-tag v-for="tag in demand.community?.tags" :key="tag" size="small" effect="plain">
              {{ tag }}
            </el-tag>
          </div>
          
          <div class="demand-meta">
            <span><el-icon><User /></el-icon> {{ demand.community?.households }}户</span>
            <span><el-icon><Calendar /></el-icon> {{ demand.deadline }}截止</span>
          </div>
          
          <div class="demand-actions">
            <el-button type="success" @click="contactCommunity(demand)">立即联系</el-button>
            <el-button text @click="viewDemandDetail(demand)">查看详情</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 会员权益 -->
    <div class="section">
      <div class="section-header">
        <h2>
          <el-icon><Trophy /></el-icon>
          我的会员权益
        </h2>
      </div>
      
      <div class="benefits-grid">
        <div class="benefit-item">
          <el-icon :size="24" color="#67C23A"><View /></el-icon>
          <span>查看社区联系方式</span>
          <el-tag size="small" type="success">已解锁</el-tag>
        </div>
        <div class="benefit-item">
          <el-icon :size="24" color="#67C23A"><Top /></el-icon>
          <span>列表优先展示</span>
          <el-tag size="small" type="success">已解锁</el-tag>
        </div>
        <div class="benefit-item">
          <el-icon :size="24" color="#67C23A"><Service /></el-icon>
          <span>专属客服</span>
          <el-tag size="small" type="success">已解锁</el-tag>
        </div>
        <div class="benefit-item">
          <el-icon :size="24" color="#C0C4CC"><Promotion /></el-icon>
          <span>首页推荐位</span>
          <el-tag size="small">铂金解锁</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const banners = [
  { title: '金牌会员限时优惠', desc: '升级铂金会员享8折优惠', btn: '立即升级', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { title: '发布资源，精准触达', desc: '让社区主动找到您', btn: '立即发布', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { title: '撮合成功，品牌曝光', desc: '提升品牌在社区的影响力', btn: '查看案例', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
]

const matchedDemands = ref([])

const mockDemands = [
  { id: 1, title: '六一儿童节亲子嘉年华赞助', type: '活动赞助', community: { name: '阳光花园社区', logo: '', households: 1500, tags: ['亲子友好', '文化活动'] }, matchScore: 5, deadline: '2026-05-20' },
  { id: 2, title: '老年人心理健康公益讲座', type: '专家服务', community: { name: '幸福里社区', logo: '', households: 800, tags: ['老年服务', '健康社区'] }, matchScore: 4, deadline: '2026-05-10' },
  { id: 3, title: '社区广场社会化运营合作', type: '空间运营', community: { name: '翠竹苑社区', logo: '', households: 1200, tags: ['社区建设', '商业活跃'] }, matchScore: 4, deadline: '2026-06-01' },
  { id: 4, title: '端午节包粽子传统文化活动', type: '活动赞助', community: { name: '幸福里社区', logo: '', households: 800, tags: ['文化活动', '节庆氛围'] }, matchScore: 3, deadline: '2026-05-15' }
]

onMounted(async () => {
  matchedDemands.value = mockDemands
})

function viewDemandDetail(demand) {
  window.location.href = `/merchant/demands/${demand.id}`
}

const contactCommunity = (demand) => {
  ElMessage.success(`已向${demand.community?.name}发送合作意向`)
}
</script>

<style scoped>
.merchant-home {
  padding-bottom: 20px;
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

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.benefit-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

@media (max-width: 768px) {
  .membership-card {
    flex-direction: column;
    gap: 20px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .demand-list {
    grid-template-columns: 1fr;
  }
}
</style>
