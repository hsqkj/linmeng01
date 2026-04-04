<template>
  <div class="merchant-layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="32" color="#67C23A"><Shop /></el-icon>
          <span class="logo-text">邻盟商家端</span>
        </div>
      </div>
      
      <nav class="header-nav pc-only">
        <router-link to="/merchant" class="nav-item" :class="{ active: $route.path === '/merchant' }">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/merchant/resources" class="nav-item" :class="{ active: $route.path.includes('/resources') }">
          <el-icon><Goods /></el-icon>
          <span>我的资源</span>
        </router-link>
        <router-link to="/merchant/demands" class="nav-item" :class="{ active: $route.path.includes('/demands') }">
          <el-icon><Document /></el-icon>
          <span>社区需求</span>
        </router-link>
        <router-link to="/merchant/profile" class="nav-item" :class="{ active: $route.path.includes('/profile') }">
          <el-icon><User /></el-icon>
          <span>商家中心</span>
        </router-link>
      </nav>

      <div class="header-right">
        <el-badge :value="5" class="message-badge" @click="$router.push('/merchant/messages')">
          <el-icon :size="20"><Bell /></el-icon>
        </el-badge>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="pc-only">{{ userInfo?.contact_name || userInfo?.manager || '商家用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/merchant/profile')">商家资料</el-dropdown-item>
              <el-dropdown-item @click="$router.push('/merchant/member')">会员中心</el-dropdown-item>
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
      <router-link to="/merchant" class="mobile-nav-item" :class="{ active: $route.path === '/merchant' }">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </router-link>
      <router-link to="/merchant/resources" class="mobile-nav-item" :class="{ active: $route.path.includes('/resources') }">
        <el-icon><Goods /></el-icon>
        <span>资源</span>
      </router-link>
      <router-link to="/merchant/demands" class="mobile-nav-item" :class="{ active: $route.path.includes('/demands') }">
        <el-icon><Document /></el-icon>
        <span>需求</span>
      </router-link>
      <router-link to="/merchant/profile" class="mobile-nav-item" :class="{ active: $route.path.includes('/profile') }">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </router-link>
    </nav>

    <!-- 悬浮客服 -->
    <ServiceChat />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import ServiceChat from '@/components/ServiceChat.vue'

const router = useRouter()
const userInfo = ref(null)

function logout() {
  localStorage.removeItem('merchant_token')
  localStorage.removeItem('merchant_info')
  router.push('/login/merchant')
}

// 检查资料完整性
onMounted(() => {
  const info = localStorage.getItem('merchant_info')
  if (info) {
    userInfo.value = JSON.parse(info)
    // 检查资料是否完整（未填关键字段）
    const profile = userInfo.value
    const isIncomplete = !profile.company_name || !profile.contact_name || !profile.phone
    if (isIncomplete) {
      ElMessageBox.confirm(
        '您的商家资料尚未完善！完善资料有助于精准匹配社区需求，获得更多合作机会。',
        '📋 完善资料提示',
        {
          confirmButtonText: '立即完善',
          cancelButtonText: '稍后再说',
          type: 'warning'
        }
      ).then(() => {
        router.push('/merchant/profile')
      }).catch(() => {})
    }
  }
})
</script>

<style scoped>
.merchant-layout {
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
  background: #f6ffed;
  color: #67C23A;
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
  color: #67C23A;
}

@media (max-width: 768px) {
  .header {
    padding: 0 12px;
    height: 52px;
  }
  .logo-text { font-size: 16px; }
  .header-right { gap: 12px; }

  .main-content {
    padding: 12px;
    padding-bottom: 70px;
  }

  .mobile-nav {
    padding: 6px 0;
  }
  .mobile-nav-item {
    font-size: 11px;
    gap: 2px;
  }
  .mobile-nav-item :deep(.el-icon) {
    font-size: 20px;
  }
}
</style>
