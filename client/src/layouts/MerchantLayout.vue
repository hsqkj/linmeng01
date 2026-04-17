<template>
  <div class="merchant-layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon"><i class="logo-emoji">🏪</i></div>
          <div class="logo-text-wrap">
            <span class="logo-text">邻盟</span>
            <span class="logo-sub">商家端</span>
          </div>
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
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge" @click="$router.push('/merchant/messages')">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import ServiceChat from '@/components/ServiceChat.vue'
import { getUnreadCount } from '@/api/merchant'

const router = useRouter()
const userInfo = ref(null)
const unreadCount = ref(0)
let refreshTimer = null

async function loadUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res?.data?.count || 0
  } catch (e) {
    // 忽略错误
  }
}

function logout() {
  localStorage.removeItem('merchant_token')
  localStorage.removeItem('merchant_info')
  window.location.href = '/merchant'
}

// 监听通知已读事件
function onNotificationRead() {
  unreadCount.value = Math.max(0, unreadCount.value - 1)
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
    // 登录后才加载未读通知数
    loadUnreadCount()
    // 每30秒刷新一次
    refreshTimer = setInterval(loadUnreadCount, 30000)
  }
  // 监听通知已读事件
  window.addEventListener('notification-read', onNotificationRead)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('notification-read', onNotificationRead)
})

// 监听路由变化时刷新未读数
router.afterEach((to) => {
  loadUnreadCount()
})
</script>

<style scoped>
.merchant-layout { min-height: 100vh; display: flex; flex-direction: column; }

.header {
  background: white;
  border-bottom: 1px solid #eee;
  padding: 0 32px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
}

/* Logo */
.header-left { display: flex; align-items: center; }
.logo { display: flex; align-items: center; gap: 10px; cursor: default; }
.logo-icon {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #e66100, #b84d00);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.logo-emoji { font-size: 20px; font-style: normal; }
.logo-text-wrap { display: flex; flex-direction: column; line-height: 1.2; }
.logo-text { font-size: 18px; font-weight: 700; color: #e66100; }
.logo-sub  { font-size: 11px; color: #999; }

/* 导航 */
.header-nav { display: flex; gap: 4px; }
.nav-item {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 20px;
  color: #666; text-decoration: none;
  font-size: 14px; font-weight: 500; transition: all .2s;
}
.nav-item:hover { background: #f0f0f0; color: #333; }
.nav-item.active { background: #e66100; color: #fff; }

/* 右侧 */
.header-right { display: flex; align-items: center; gap: 16px; }
.message-badge { cursor: pointer; }
.user-info {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 5px 10px; border-radius: 20px; transition: background .2s;
}
.user-info:hover { background: #f5f5f5; }

/* 内容区 */
.main-content { flex: 1; padding: 24px 32px; max-width: 1280px; width: 100%; margin: 0 auto; }

/* 底部手机导航 */
.mobile-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: white; border-top: 1px solid #eee;
  display: flex; justify-content: space-around; padding: 8px 0; z-index: 100;
}
.mobile-nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  color: #999; text-decoration: none; font-size: 11px;
  padding: 4px 16px; border-radius: 12px; transition: all .2s;
}
.mobile-nav-item.active { color: #e66100; }

@media (max-width: 768px) {
  .header { padding: 0 12px; height: 50px; }
  .logo-icon { width: 34px; height: 34px; }
  .logo-emoji { font-size: 18px; }
  .logo-text { font-size: 15px; }
  .logo-sub { font-size: 10px; }
  .header-right { gap: 8px; }
  .user-info { padding: 4px 8px; }
  .main-content { padding: 12px; padding-bottom: 70px; }

  /* 底部导航优化 */
  .mobile-nav {
    padding: 6px 0;
    height: 60px;
  }
  .mobile-nav-item {
    padding: 4px 12px;
    font-size: 10px;
  }
  .mobile-nav-item .el-icon {
    font-size: 22px;
  }

  /* 浮动客服按钮位置调整 */
  :deep(.service-float-btn) {
    right: 12px;
    bottom: 70px;
  }
  :deep(.float-icon) {
    width: 44px;
    height: 44px;
  }
}
</style>
