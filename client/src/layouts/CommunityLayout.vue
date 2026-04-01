<template>
  <div class="community-layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="32" color="#409EFF"><House /></el-icon>
          <span class="logo-text">邻盟社区端</span>
        </div>
      </div>
      
      <nav class="header-nav pc-only">
        <router-link to="/community" class="nav-item" :class="{ active: $route.path === '/community' }">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/community/demands" class="nav-item" :class="{ active: $route.path.includes('/demands') }">
          <el-icon><Document /></el-icon>
          <span>我的需求</span>
        </router-link>
        <router-link to="/community/resources" class="nav-item" :class="{ active: $route.path.includes('/resources') }">
          <el-icon><Goods /></el-icon>
          <span>商家资源</span>
        </router-link>
        <router-link to="/community/profile" class="nav-item" :class="{ active: $route.path.includes('/profile') }">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </router-link>
      </nav>

      <div class="header-right">
        <el-badge :value="3" class="message-badge" @click="$router.push('/community/messages')">
          <el-icon :size="20"><Bell /></el-icon>
        </el-badge>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="pc-only">张主任</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/community/profile')">个人资料</el-dropdown-item>
              <el-dropdown-item @click="$router.push('/community/messages')">我的消息</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部导航（手机端） -->
    <nav class="mobile-nav mobile-only">
      <router-link to="/community" class="mobile-nav-item" :class="{ active: $route.path === '/community' }">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </router-link>
      <router-link to="/community/demands" class="mobile-nav-item" :class="{ active: $route.path.includes('/demands') }">
        <el-icon><Document /></el-icon>
        <span>需求</span>
      </router-link>
      <router-link to="/community/resources" class="mobile-nav-item" :class="{ active: $route.path.includes('/resources') }">
        <el-icon><Goods /></el-icon>
        <span>资源</span>
      </router-link>
      <router-link to="/community/profile" class="mobile-nav-item" :class="{ active: $route.path.includes('/profile') }">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  router.push('/')
}
</script>

<style scoped>
.community-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 0 30px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.header-nav {
  display: flex;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-item:hover,
.nav-item.active {
  background: #ecf5ff;
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.message-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  z-index: 100;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #909399;
  text-decoration: none;
  font-size: 12px;
}

.mobile-nav-item.active {
  color: #409EFF;
}

@media (max-width: 768px) {
  .header {
    padding: 0 15px;
  }
  
  .main-content {
    padding: 15px;
    padding-bottom: 70px;
  }
}
</style>
