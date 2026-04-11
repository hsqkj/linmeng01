<template>
  <div class="admin-layout" :class="{ 'mobile-fullscreen': mobileFullscreen }">
    <!-- 侧边栏（PC端） -->
    <div class="sidebar pc-only" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-mark">邻</div>
        <div class="brand-text" v-if="!sidebarCollapsed">
          <div class="brand-name">邻盟</div>
          <div class="brand-sub">管理后台</div>
        </div>
        <el-button class="collapse-btn" text @click="sidebarCollapsed = !sidebarCollapsed">
          <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
        </el-button>
      </div>

      <el-menu :default-active="activeMenu" class="side-menu" :collapse="sidebarCollapsed" router>
        <el-menu-item index="/admin">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据大屏</template>
        </el-menu-item>

        <el-sub-menu index="users">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/admin/users/community">社区工作者</el-menu-item>
          <el-menu-item index="/admin/users/merchant">商家用户</el-menu-item>
          <el-menu-item index="/admin/users/ambassador">招商大使</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="audit">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容审核</span>
          </template>
          <el-menu-item index="/admin/audit/demands">
            需求审核
            <el-badge :value="pendingDemands" type="danger" style="margin-left:auto" />
          </el-menu-item>
          <el-menu-item index="/admin/audit/resources">
            资源审核
            <el-badge :value="pendingResources" type="danger" style="margin-left:auto" />
          </el-menu-item>
          <el-divider style="margin: 4px 12px" />
          <el-menu-item index="/admin/demands">
            需求列表
          </el-menu-item>
          <el-menu-item index="/admin/resources">
            资源列表
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/matching">
          <el-icon><Share /></el-icon>
          <template #title>撮合管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/comments">
          <el-icon><ChatLineRound /></el-icon>
          <template #title>留言管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/notifications">
          <el-icon><Bell /></el-icon>
          <template #title>系统通知</template>
        </el-menu-item>

        <el-menu-item index="/admin/finance">
          <el-icon><Money /></el-icon>
          <template #title>财务管理</template>
        </el-menu-item>

        <el-sub-menu index="config">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </template>
          <el-menu-item index="/admin/config/basic">基础数据配置</el-menu-item>
          <el-menu-item index="/admin/config/member">会员配置</el-menu-item>
          <el-menu-item index="/admin/config/reward">撮合奖励配置</el-menu-item>
          <el-menu-item index="/admin/config/rating">商家评级配置</el-menu-item>
          <el-menu-item index="/admin/config/tags">标签管理</el-menu-item>
          <el-menu-item index="/admin/config/banner">轮播图配置</el-menu-item>
          <el-menu-item index="/admin/config/algorithm">匹配算法配置</el-menu-item>
          <el-menu-item index="/admin/config/ambassador">大使提成配置</el-menu-item>
          <el-menu-item index="/admin/config/anti-flying">防飞单配置</el-menu-item>
          <el-menu-item index="/admin/config/audit">内容审核设置</el-menu-item>
          <el-menu-item index="/admin/config/admin">管理员配置</el-menu-item>
          <el-menu-item index="/admin/config/service">智能客服配置</el-menu-item>
        </el-sub-menu>
      </el-menu>

      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="admin-info">
          <el-avatar :size="32" src="https://ui-avatars.com/api/?name=超级管理员&background=409EFF&color=fff" />
          <div class="admin-text">
            <div class="admin-name">超级管理员</div>
          </div>
        </div>
        <el-button text size="small" @click="$router.push('/')">退出</el-button>
      </div>
    </div>

    <!-- 手机端顶部栏 -->
    <div class="mobile-header mobile-only">
      <el-button text @click="mobileDrawerVisible = true">
        <el-icon :size="22"><Menu /></el-icon>
      </el-button>
      <div class="mobile-title">邻盟管理后台</div>
      <div style="display:flex;align-items:center;gap:4px">
        <el-button text @click="mobileFullscreen = !mobileFullscreen" :title="mobileFullscreen ? '退出全屏' : '全屏'">
          <el-icon :size="20"><FullScreen v-if="!mobileFullscreen" /><Close v-else /></el-icon>
        </el-button>
        <el-badge :value="pendingTotal" type="danger" size="small">
          <el-button text @click="$router.push('/admin/notifications')" title="系统通知">
            <el-icon :size="20"><Bell /></el-icon>
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- 手机端抽屉菜单 -->
    <el-drawer v-model="mobileDrawerVisible" direction="ltr" size="75%" title="导航菜单" :with-header="false">
      <div class="drawer-header">
        <div class="logo-mark">邻</div>
        <div class="brand-name">邻盟</div>
        <div class="brand-sub">管理后台</div>
      </div>
      <el-menu :default-active="activeMenu" class="drawer-menu" router @select="mobileDrawerVisible = false">
        <el-menu-item index="/admin">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据大屏</span>
        </el-menu-item>

        <el-sub-menu index="users">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/admin/users/community">社区工作者</el-menu-item>
          <el-menu-item index="/admin/users/merchant">商家用户</el-menu-item>
          <el-menu-item index="/admin/users/ambassador">招商大使</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="audit">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容审核</span>
          </template>
          <el-menu-item index="/admin/audit/demands">需求审核</el-menu-item>
          <el-menu-item index="/admin/audit/resources">资源审核</el-menu-item>
          <el-divider style="margin: 4px 12px" />
          <el-menu-item index="/admin/demands">需求列表</el-menu-item>
          <el-menu-item index="/admin/resources">资源列表</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/matching">
          <el-icon><Share /></el-icon>
          <span>撮合管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/comments">
          <el-icon><ChatLineRound /></el-icon>
          <span>留言管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/notifications">
          <el-icon><Bell /></el-icon>
          <span>系统通知</span>
        </el-menu-item>

        <el-menu-item index="/admin/finance">
          <el-icon><Money /></el-icon>
          <span>财务管理</span>
        </el-menu-item>

        <el-sub-menu index="config">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </template>
          <el-menu-item index="/admin/config/basic">基础数据配置</el-menu-item>
          <el-menu-item index="/admin/config/member">会员配置</el-menu-item>
          <el-menu-item index="/admin/config/reward">撮合奖励配置</el-menu-item>
          <el-menu-item index="/admin/config/rating">商家评级配置</el-menu-item>
          <el-menu-item index="/admin/config/tags">标签管理</el-menu-item>
          <el-menu-item index="/admin/config/banner">轮播图配置</el-menu-item>
          <el-menu-item index="/admin/config/algorithm">匹配算法配置</el-menu-item>
          <el-menu-item index="/admin/config/ambassador">大使提成配置</el-menu-item>
          <el-menu-item index="/admin/config/admin">管理员配置</el-menu-item>
          <el-menu-item index="/admin/config/service">智能客服配置</el-menu-item>
        </el-sub-menu>
      </el-menu>

      <div class="drawer-footer">
        <el-avatar :size="36" src="https://ui-avatars.com/api/?name=超管&background=409EFF&color=fff" />
        <div class="drawer-admin-info">
          <div class="admin-name">超级管理员</div>
          <el-button text size="small" @click="$router.push('/'); mobileDrawerVisible = false">退出登录</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 主内容区 -->
    <div class="main-area">
      <div class="topbar">
        <div class="breadcrumb">
          <el-breadcrumb>
            <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-right pc-only">
          <el-badge :value="pendingTotal" type="danger">
            <el-button text size="small" @click="$router.push('/admin/audit/demands')">待审核 {{ pendingTotal }}</el-button>
          </el-badge>
          <el-avatar :size="32" src="https://ui-avatars.com/api/?name=超管&background=409EFF&color=fff" />
        </div>
      </div>
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis, User, Document, Share, ChatLineRound, Money, Setting,
  Fold, Expand, Bell, Menu, FullScreen, Close
} from '@element-plus/icons-vue'
import { getDashboard } from '@/api/admin'

const route = useRoute()
const sidebarCollapsed = ref(false)
const mobileDrawerVisible = ref(false)
const mobileFullscreen = ref(false)
const pendingTotal = ref(0)
const pendingDemands = ref(0)
const pendingResources = ref(0)
const activeMenu = computed(() => route.path)

// 动态加载待审核数量
async function loadPendingCount() {
  try {
    const res = await getDashboard()
    const pending = res.data?.pending || {}
    pendingTotal.value = pending.total || 0
    pendingDemands.value = pending.demands || 0
    pendingResources.value = pending.resources || 0
  } catch {}
}
onMounted(() => { loadPendingCount() })
const pageTitles = {
  '/admin': '数据大屏',
  '/admin/users/community': '社区工作者',
  '/admin/users/merchant': '商家用户',
  '/admin/users/ambassador': '招商大使',
  '/admin/audit/demands': '需求审核',
  '/admin/audit/resources': '资源审核',
  '/admin/matching': '撮合管理',
  '/admin/comments': '留言管理',
  '/admin/finance': '财务管理',
  '/admin/config/basic': '基础数据配置',
  '/admin/config/member': '会员配置',
  '/admin/config/rating': '商家评级配置',
  '/admin/config/tags': '标签管理',
  '/admin/config/banner': '轮播图配置',
  '/admin/config/algorithm': '匹配算法配置',
  '/admin/config/ambassador': '大使提成配置',
  '/admin/config/admin': '管理员配置',
  '/admin/config/service': '智能客服配置'
}
const pageTitle = computed(() => pageTitles[route.path] || '管理后台')
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f0f2f5; }

/* PC端侧边栏 */
.sidebar { width: 240px; background: #0d1b2a; transition: width 0.3s; flex-shrink: 0; display: flex; flex-direction: column; }
.sidebar.collapsed { width: 64px; }
.sidebar-header { display: flex; align-items: center; padding: 18px 14px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); min-height: 64px; }
.logo-mark { width: 38px; height: 38px; background: linear-gradient(135deg, #1a5fb4, #14407a); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #fff; flex-shrink: 0; }
.brand-name { font-weight: 700; color: #fff; font-size: 15px; }
.brand-sub { font-size: 11px; color: rgba(255,255,255,0.4); }
.collapse-btn { margin-left: auto; color: rgba(255,255,255,0.4) !important; }
.side-menu { background: transparent !important; border: none !important; }
:deep(.el-menu-item), :deep(.el-sub-menu__title) { color: rgba(255,255,255,.6) !important; }
:deep(.el-menu-item.is-active) { background: #1a5fb4 !important; color: #fff !important; border-radius: 8px; }
:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) { background: rgba(255,255,255,.07) !important; color: #fff !important; }
:deep(.el-sub-menu .el-menu) { background: rgba(0,0,0,.25) !important; }
:deep(.el-sub-menu .el-menu-item) { padding-left: 48px !important; font-size: 13px; }
.sidebar-footer { padding: 12px; margin-top: auto; border-top: 1px solid rgba(255,255,255,.07); display: flex; align-items: center; justify-content: space-between; }
.admin-info { display: flex; align-items: center; gap: 8px; }
.admin-name { font-size: 13px; color: rgba(255,255,255,.55); }
.sidebar-footer :deep(.el-button) { color: rgba(255,255,255,.35) !important; }

/* 主区域 */
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { height: 56px; background: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.content-area { flex: 1; overflow-y: auto; padding: 24px; background: #f5f6f8; }

/* 手机端顶部栏 */
.mobile-header {
  position: sticky; top: 0; z-index: 200;
  background: #0d1b2a; color: #fff;
  display: flex; align-items: center; gap: 12px;
  padding: 0 16px; height: 56px;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
}
.mobile-header :deep(.el-icon) { color: #fff; }
.mobile-title { flex: 1; font-weight: 600; font-size: 15px; color: #fff; }

/* 手机端抽屉 */
.drawer-header {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 16px; background: #0d1b2a; margin-bottom: 8px;
}
.drawer-brand { display: flex; flex-direction: column; }
.drawer-admin-info { flex: 1; }
.drawer-admin-info .admin-name { font-size: 13px; color: rgba(255,255,255,.6); }
.drawer-menu {
  border: none !important;
  background: transparent !important;
  min-height: calc(100vh - 180px);
  overflow-y: auto;
}
.drawer-menu :deep(.el-menu-item) {
  height: 48px !important;
  line-height: 48px !important;
  font-size: 15px !important;
  color: rgba(255,255,255,.65) !important;
  background: transparent !important;
}
.drawer-menu :deep(.el-menu-item:hover) {
  background: rgba(255,255,255,.08) !important;
  color: #fff !important;
}
.drawer-menu :deep(.el-menu-item.is-active) {
  background: #1a5fb4 !important;
  color: #fff !important;
}
.drawer-menu :deep(.el-sub-menu__title) {
  height: 48px !important;
  line-height: 48px !important;
  font-size: 15px !important;
  color: rgba(255,255,255,.65) !important;
  background: transparent !important;
}
.drawer-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(255,255,255,.08) !important;
  color: #fff !important;
}
.drawer-menu :deep(.el-sub-menu .el-menu) {
  background: rgba(0,0,0,.3) !important;
}
.drawer-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 48px !important;
  font-size: 14px !important;
  color: rgba(255,255,255,0.65) !important;
}
.drawer-menu :deep(.el-sub-menu .el-menu-item:hover) {
  color: #fff !important;
}
.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; gap: 12px;
}

/* 响应式 - 手机端 */
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
  .admin-layout {
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

  /* 顶部栏 */
  .mobile-header {
    display: flex !important;
    position: sticky;
    top: 0;
    z-index: 200;
  }

  /* 内容区域 */
  .content-area {
    flex: 1 !important;
    width: 100% !important;
    padding: 12px !important;
    overflow-y: auto !important;
  }

  /* 抽屉深色背景 */
  :deep(.el-drawer__body) {
    background: #001529 !important;
    padding: 0 !important;
  }

  .drawer-header {
    flex-shrink: 0;
    padding: 16px !important;
  }
  .drawer-menu {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
  /* 滚动条样式 */
  .drawer-menu::-webkit-scrollbar { width: 4px; }
  .drawer-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
  .drawer-footer {
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.1);
    background: #001529;
  }
  .drawer-footer .admin-name { color: rgba(255,255,255,0.65) !important; }
  .drawer-footer :deep(.el-button) { color: rgba(255,255,255,0.45) !important; }
}

/* 默认隐藏手机端元素，PC端显示 */
@media (min-width: 769px) {
  .mobile-only { display: none !important; }
  .pc-only { display: flex !important; }
}
</style>
