<template>
  <div class="ambassador-layout">
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
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
        <img src="https://ui-avatars.com/api/?name=李大使&background=F59E0B&color=fff" class="amb-avatar" />
        <div class="amb-name">李招商</div>
        <div class="amb-code">我的渠道码：AMB2024001</div>
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
      </el-menu>

      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <el-button text @click="$router.push('/')">退出登录</el-button>
      </div>
    </div>

    <div class="main-area">
      <div class="topbar">
        <div class="topbar-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="topbar-right">
          <el-badge :value="3" class="badge-item">
            <el-button text><el-icon><Bell /></el-icon></el-button>
          </el-badge>
          <el-avatar size="small" src="https://ui-avatars.com/api/?name=李大使&background=F59E0B&color=fff" />
          <span style="font-size:14px">李招商</span>
          <el-button type="warning" plain size="small" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Grid, List, Money, Wallet, Bell, Fold, Expand, SwitchButton } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const activeMenu = computed(() => route.path)
const pageTitles = {
  '/ambassador': '首页概览',
  '/ambassador/qrcode': '我的渠道码',
  '/ambassador/records': '发展记录',
  '/ambassador/commission': '提成明细',
  '/ambassador/withdraw': '提现管理'
}
const pageTitle = computed(() => pageTitles[route.path] || '招商大使中心')

const handleLogout = () => {
  router.push('/')
}
</script>

<style scoped>
.ambassador-layout { display: flex; min-height: 100vh; background: #f0f2f5; }
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
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { height: 56px; background: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-title { font-weight: 600; font-size: 15px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.badge-item :deep(.el-badge__content) { top: 4px; right: 4px; }
.content-area { flex: 1; overflow-y: auto; padding: 20px; }
</style>
