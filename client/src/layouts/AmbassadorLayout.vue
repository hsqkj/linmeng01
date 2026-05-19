<template>
  <div class="ambassador-layout">
    <!-- 侧边栏（PC端） -->
    <div class="sidebar pc-only" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-mark">邻</div>
        <div class="brand-text" v-if="!sidebarCollapsed">
          <div class="brand-name">邻盟</div>
          <div class="brand-sub">招商大使中心</div>
        </div>
        <el-button class="collapse-btn" text @click="sidebarCollapsed = !sidebarCollapsed">
          <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
        </el-button>
      </div>

      <div class="ambassador-info" v-if="!sidebarCollapsed">
        <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.real_name || '大')}&background=F59E0B&color=fff`" class="amb-avatar" />
        <div class="amb-name">{{ userInfo?.real_name || '招商大使' }}</div>
        <div class="amb-code">渠道码：{{ userInfo?.qr_code || '—' }}</div>
      </div>

      <el-menu :default-active="activeMenu" class="side-menu" :collapse="sidebarCollapsed" router>
        <el-menu-item index="/ambassador">
          <el-icon><House /></el-icon><template #title>首页概览</template>
        </el-menu-item>
        <el-menu-item index="/ambassador/qrcode">
          <el-icon><Grid /></el-icon><template #title>我的渠道码</template>
        </el-menu-item>
        <el-menu-item index="/ambassador/records">
          <el-icon><List /></el-icon><template #title>发展记录</template>
        </el-menu-item>
        <el-menu-item index="/ambassador/commission">
          <el-icon><Money /></el-icon><template #title>提成明细</template>
        </el-menu-item>
        <el-menu-item index="/ambassador/withdraw">
          <el-icon><Wallet /></el-icon><template #title>提现管理</template>
        </el-menu-item>
        <el-menu-item index="/ambassador/notifications">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <span style="display:flex;align-items:center"><el-icon><Message /></el-icon>我的消息</span>
          </el-badge>
        </el-menu-item>
        <el-menu-item index="/ambassador/profile">
          <el-icon><User /></el-icon><template #title>个人中心</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <el-button text @click="handleLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 手机端顶部栏 -->
    <div class="mobile-header mobile-only">
      <template v-if="isLoggedIn">
        <el-button text @click="mobileDrawerVisible = true">
          <el-icon :size="22"><Menu /></el-icon>
        </el-button>
        <div class="mobile-title">招商大使中心</div>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" type="warning" size="small" :max="99">
          <el-button text @click="goToNotifications">
            <el-icon :size="20"><Bell /></el-icon>
          </el-button>
        </el-badge>
      </template>
      <template v-else>
        <div style="width:32px"></div>
        <div class="mobile-title">招商大使中心</div>
        <button class="btn-amb-login-mobile" @click="showLogin = true">登录</button>
      </template>
    </div>

    <!-- 手机端抽屉菜单 -->
    <el-drawer v-model="mobileDrawerVisible" direction="ltr" size="70%" :with-header="false">
      <div class="drawer-header">
        <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.real_name || '大')}&background=F59E0B&color=fff`" class="drawer-avatar" />
        <div>
          <div class="drawer-name">{{ userInfo?.real_name || '招商大使' }}</div>
          <div class="drawer-sub">渠道码：{{ userInfo?.qr_code || '—' }}</div>
        </div>
      </div>
      <el-menu :default-active="activeMenu" class="drawer-menu" router @select="mobileDrawerVisible = false">
        <el-menu-item index="/ambassador">
          <el-icon><House /></el-icon><span>首页概览</span>
        </el-menu-item>
        <el-menu-item index="/ambassador/qrcode">
          <el-icon><Grid /></el-icon><span>我的渠道码</span>
        </el-menu-item>
        <el-menu-item index="/ambassador/records">
          <el-icon><List /></el-icon><span>发展记录</span>
        </el-menu-item>
        <el-menu-item index="/ambassador/commission">
          <el-icon><Money /></el-icon><span>提成明细</span>
        </el-menu-item>
        <el-menu-item index="/ambassador/withdraw">
          <el-icon><Wallet /></el-icon><span>提现管理</span>
        </el-menu-item>
        <el-menu-item index="/ambassador/notifications">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <span style="display:flex;align-items:center;gap:8px"><el-icon><Message /></el-icon>我的消息</span>
          </el-badge>
        </el-menu-item>
        <el-menu-item index="/ambassador/profile">
          <el-icon><User /></el-icon><span>个人中心</span>
        </el-menu-item>
      </el-menu>
      <div class="drawer-footer">
        <el-button type="warning" plain style="width:100%" @click="handleLogout(); mobileDrawerVisible = false">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </el-drawer>

    <!-- 主内容区 -->
    <div class="main-area">
      <div class="topbar pc-only">
        <div class="topbar-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="topbar-right">
          <!-- 已登录 -->
          <template v-if="isLoggedIn">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="badge-item">
              <el-button text @click="goToNotifications"><el-icon><Bell /></el-icon></el-button>
            </el-badge>
            <el-avatar size="small" :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.real_name || '大')}&background=F59E0B&color=fff`" />
            <span style="font-size:14px">{{ userInfo?.real_name || '招商大使' }}</span>
            <el-button type="warning" plain size="small" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </template>
          <!-- 未登录 -->
          <button v-else class="btn-amb-login" @click="showLogin = true">登录</button>
        </div>
      </div>
      <div class="content-area">
        <router-view />
      </div>
    </div>

    <!-- 登录弹窗 -->
    <LoginDialog
      :visible="showLogin"
      type="ambassador"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Grid, List, Money, Wallet, Bell, Fold, Expand, SwitchButton, Menu, Message, User } from '@element-plus/icons-vue'
import { getAmbassadorNotifications, markNotificationRead } from '@/api/ambassador'
import LoginDialog from '@/components/LoginDialog.vue'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const mobileDrawerVisible = ref(false)
const showLogin = ref(false)
const activeMenu = computed(() => route.path)
const pageTitles = {
  '/ambassador': '首页概览',
  '/ambassador/qrcode': '我的渠道码',
  '/ambassador/records': '发展记录',
  '/ambassador/commission': '提成明细',
  '/ambassador/withdraw': '提现管理',
  '/ambassador/notifications': '我的消息',
  '/ambassador/profile': '个人中心'
}
const pageTitle = computed(() => pageTitles[route.path] || '招商大使中心')

const userInfo = ref(null)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// 是否已登录
const isLoggedIn = computed(() => !!localStorage.getItem('ambassador_token'))

function loadUserInfo() {
  try {
    const info = localStorage.getItem('ambassador_info')
    if (info) userInfo.value = JSON.parse(info)
  } catch {}
}

function onLoginSuccess(data) {
  userInfo.value = data
  loadUserInfo()
  loadNotifications()
}

const loadNotifications = async () => {
  if (!isLoggedIn.value) return
  try {
    const res = await getAmbassadorNotifications({ page: 1, pageSize: 10 })
    notifications.value = res.data?.list || []
    unreadCount.value = res.data?.extra?.unreadCount || 0
  } catch (e) {
    notifications.value = []
  }
}

const handleLogout = () => {
  localStorage.removeItem('ambassador_token')
  localStorage.removeItem('ambassador_info')
  userInfo.value = null
  window.location.href = '/ambassador'
}

// 初始化
loadUserInfo()
loadNotifications()

// 跳转到消息页面
const goToNotifications = () => {
  router.push('/ambassador/notifications')
}
</script>

<style scoped>
.ambassador-layout { display: flex; min-height: 100vh; background: #f0f2f5; }

/* PC端侧边栏 */
.sidebar { width: 220px; background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); transition: width 0.3s; flex-shrink: 0; display: flex; flex-direction: column; }
.sidebar.collapsed { width: 64px; }
.sidebar-header { display: flex; align-items: center; padding: 16px 12px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #fff; flex-shrink: 0; }
.brand-name { font-weight: 700; color: #F59E0B; font-size: 15px; }
.brand-sub { font-size: 11px; color: rgba(255,255,255,0.5); }
.collapse-btn { margin-left: auto; color: rgba(255,255,255,0.6) !important; }
.ambassador-info { padding: 16px 12px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
.amb-avatar { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #F59E0B; }
.amb-name { color: #fff; font-weight: 600; margin-top: 8px; }
.amb-code { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px; }
.side-menu { background: transparent; border: none; }
:deep(.el-menu-item) { color: rgba(255,255,255,0.7) !important; }
:deep(.el-menu-item.is-active) { background: rgba(245,158,11,0.2) !important; color: #F59E0B !important; }
:deep(.el-menu-item:hover) { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
.sidebar-footer { padding: 16px; margin-top: auto; }
.sidebar-footer :deep(.el-button) { color: rgba(255,255,255,0.5) !important; width: 100%; }

/* 主区域 */
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { height: 56px; background: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-title { font-weight: 600; font-size: 15px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.badge-item :deep(.el-badge__content) { top: 4px; right: 4px; }
.btn-amb-login {
  height: 32px; padding: 0 18px;
  background: linear-gradient(135deg, #0055cc, #003999);
  color: #fff; border: none; border-radius: 16px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all .2s; font-family: inherit;
}
.btn-amb-login:hover { filter: brightness(1.1); }
.btn-amb-login-mobile {
  height: 28px; padding: 0 14px;
  background: #F59E0B; color: #fff; border: none; border-radius: 14px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all .2s;
}
.btn-amb-login-mobile:hover { filter: brightness(1.1); }
.content-area { flex: 1; overflow-y: auto; padding: 20px; }

/* 手机端顶部栏 */
.mobile-header {
  position: sticky; top: 0; z-index: 200;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff; display: flex; align-items: center; gap: 12px;
  padding: 0 16px; height: 56px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.mobile-header :deep(.el-icon) { color: #fff; }
.mobile-title { flex: 1; font-weight: 600; font-size: 15px; color: #F59E0B; }

/* 手机端抽屉 */
.drawer-header {
  display: flex; align-items: center; gap: 12px;
  padding: 24px 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
.drawer-avatar { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #F59E0B; }
.drawer-name { color: #fff; font-weight: 600; font-size: 16px; }
.drawer-sub { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px; }
.drawer-menu {
  border: none !important;
  background: transparent !important;
  min-height: calc(100vh - 200px);
  overflow-y: auto;
}
.drawer-menu :deep(.el-menu-item) {
  height: 50px !important;
  line-height: 50px !important;
  font-size: 15px !important;
  color: rgba(255,255,255,0.65) !important;
  background: transparent !important;
}
.drawer-menu :deep(.el-menu-item:hover) {
  background: rgba(255,255,255,0.08) !important;
  color: #fff !important;
}
.drawer-menu :deep(.el-menu-item.is-active) {
  background: #F59E0B !important;
  color: #fff !important;
}
.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

/* 响应式 */
@media (max-width: 768px) {
  /* 强制隐藏 PC 端侧边栏和 PC 端元素 */
  .sidebar,
  .pc-only {
    display: none !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    flex: 0 0 0 !important;
  }

  /* 手机端布局：垂直排列 */
  .ambassador-layout {
    display: flex !important;
    flex-direction: column !important;
    min-height: 100vh !important;
  }

  /* 主区域占满屏幕 */
  .main-area {
    flex: 1 !important;
    width: 100% !important;
    min-width: 100% !important;
    margin-left: 0 !important;
    display: flex;
    flex-direction: column;
  }

  .mobile-only { display: flex !important; }
  .content-area { padding: 12px; padding-bottom: 70px; flex: 1; width: 100%; }

  /* 手机端顶部栏优化 */
  .mobile-header {
    padding: 0 12px;
    height: 50px;
  }
  .mobile-title { font-size: 14px; }

  /* 抽屉深色背景 */
  :deep(.el-drawer__body) {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
    display: flex;
    flex-direction: column;
    padding: 0 !important;
    overflow: hidden;
  }
  .drawer-header { padding: 16px; }
  .drawer-avatar { width: 44px; height: 44px; }
  .drawer-menu { padding: 8px 0; }
  .drawer-menu::-webkit-scrollbar { width: 4px; }
  .drawer-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
  .drawer-footer {
    flex-shrink: 0;
    position: static;
    padding: 12px 16px;
  }

  /* 浮动客服按钮位置调整 */
  :deep(.service-float-btn) {
    right: 12px;
    bottom: 70px;
  }
}

/* 默认隐藏手机端元素，PC端显示 */
@media (min-width: 769px) {
  .mobile-only { display: none !important; }
  .pc-only { display: flex !important; }
}

/* 通知列表样式 */
.notification-list { max-height: 400px; overflow-y: auto; }
.empty-notification { text-align: center; color: #909399; padding: 40px 0; }
.notification-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.notification-item:hover { background: #f8f9fa; }
.notification-item:last-child { border-bottom: none; }
.notification-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #303133; }
.notification-content { font-size: 13px; color: #606266; margin-bottom: 4px; line-height: 1.4; }
.notification-time { font-size: 12px; color: #909399; }
</style>
