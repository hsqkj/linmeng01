<template>
  <div class="role-select">
    <div class="header">
      <div class="logo">
        <el-icon :size="48" color="#409EFF"><OfficeBuilding /></el-icon>
        <h1>邻盟</h1>
      </div>
      <p class="subtitle">社区资源智能匹配助手</p>
    </div>

    <div class="role-cards">
      <div class="role-card" @click="goToLogin('community')">
        <div class="icon-wrapper community">
          <el-icon :size="40"><House /></el-icon>
        </div>
        <h3>我是社区工作者</h3>
        <p>发布社区需求，寻找商家资源</p>
        <el-button type="primary" size="large">进入社区端</el-button>
      </div>

      <div class="role-card" @click="goToLogin('merchant')">
        <div class="icon-wrapper merchant">
          <el-icon :size="40"><Shop /></el-icon>
        </div>
        <h3>我是商家</h3>
        <p>发布可赞助资源，对接社区需求</p>
        <el-button type="success" size="large">进入商家端</el-button>
      </div>

      <div class="role-card" @click="goToLogin('ambassador')">
        <div class="icon-wrapper ambassador">
          <el-icon :size="40"><UserFilled /></el-icon>
        </div>
        <h3>我是招商大使</h3>
        <p>发展商家会员，获取佣金收益</p>
        <el-button type="warning" size="large">进入大使端</el-button>
      </div>

      <div class="role-card" @click="goToLogin('admin')">
        <div class="icon-wrapper admin">
          <el-icon :size="40"><Setting /></el-icon>
        </div>
        <h3>平台管理员</h3>
        <p>系统管理、数据监控、审核</p>
        <el-button type="info" size="large">进入管理后台</el-button>
      </div>
    </div>

    <div class="features">
      <div class="feature-item">
        <el-icon :size="24" color="#67C23A"><CircleCheck /></el-icon>
        <span>智能匹配</span>
      </div>
      <div class="feature-item">
        <el-icon :size="24" color="#E6A23C"><Star /></el-icon>
        <span>五心评级</span>
      </div>
      <div class="feature-item">
        <el-icon :size="24" color="#409EFF"><Connection /></el-icon>
        <span>高效对接</span>
      </div>
      <div class="feature-item">
        <el-icon :size="24" color="#F56C6C"><Present /></el-icon>
        <span>撮合奖励</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = (role) => {
  if (role === 'admin') {
    router.push('/admin/login')
  } else if (role === 'community') {
    router.push('/login/community')
  } else if (role === 'merchant') {
    router.push('/login/merchant')
  } else {
    router.push('/login/ambassador')
  }
}
</script>

<style scoped>
.role-select {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
}

.logo h1 {
  font-size: 48px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.subtitle {
  font-size: 20px;
  opacity: 0.9;
}

.role-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 30px;
  max-width: 1200px;
  width: 100%;
  margin-bottom: 50px;
}

.role-card {
  background: white;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.role-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
}

.icon-wrapper.community {
  background: linear-gradient(135deg, #409EFF, #36cfc9);
}

.icon-wrapper.merchant {
  background: linear-gradient(135deg, #67C23A, #95d475);
}

.icon-wrapper.ambassador {
  background: linear-gradient(135deg, #E6A23C, #f0c78a);
}

.icon-wrapper.admin {
  background: linear-gradient(135deg, #909399, #c0c4cc);
}

.role-card h3 {
  font-size: 22px;
  margin-bottom: 10px;
  color: #303133;
}

.role-card p {
  color: #606266;
  margin-bottom: 25px;
  font-size: 14px;
}

.features {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 16px;
  background: rgba(255,255,255,0.2);
  padding: 10px 20px;
  border-radius: 20px;
}

@media (max-width: 768px) {
  .role-cards {
    grid-template-columns: 1fr;
  }
  
  .logo h1 {
    font-size: 36px;
  }
  
  .subtitle {
    font-size: 16px;
  }
}
</style>
