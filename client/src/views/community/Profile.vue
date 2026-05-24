<template>
  <div class="profile-page" v-loading="loading">
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-avatar" @click="editAvatar">
        <el-avatar :size="64" :src="userInfo.avatar || ''" @error="() => true">
          <el-icon :size="32"><UserFilled /></el-icon>
        </el-avatar>
        <div class="edit-avatar-mask">
          <el-icon><Camera /></el-icon>
        </div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ userInfo.real_name || userInfo.name || '社区用户' }}</div>
        <div class="user-phone">
          <el-icon><Phone /></el-icon>
          {{ maskPhone(userInfo.phone) }}
        </div>
        <div class="user-community" v-if="userInfo.community_name">
          <el-icon><Location /></el-icon>
          {{ userInfo.community_name }}
        </div>
      </div>
      <div class="user-badge" v-if="userInfo.role_name">
        <el-tag size="small" type="success" effect="plain">{{ userInfo.role_name }}</el-tag>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-grid">
      <div class="stat-cell" @click="goTo('/community/demands')">
        <div class="stat-num">{{ stats.demands }}</div>
        <div class="stat-label">我的需求</div>
      </div>
      <div class="stat-cell" @click="goTo('/community/favorites')">
        <div class="stat-num">{{ stats.favorites }}</div>
        <div class="stat-label">我的收藏</div>
      </div>
      <div class="stat-cell" @click="goTo('/community/rewards')">
        <div class="stat-num">{{ stats.rewards }}</div>
        <div class="stat-label">我的奖励</div>
      </div>
      <div class="stat-cell" @click="goTo('/community/messages')">
        <div class="stat-num">{{ stats.messages }}</div>
        <div class="stat-label">消息通知</div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-title">我的服务</div>
      <div class="menu-grid">
        <div class="menu-item" @click="goTo('/community/demands')">
          <div class="menu-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Document /></el-icon>
          </div>
          <span>我的需求</span>
        </div>
        <div class="menu-item" @click="goTo('/community/favorites')">
          <div class="menu-icon" style="background: #fff0f6; color: #eb2f96;">
            <el-icon><Star /></el-icon>
          </div>
          <span>我的收藏</span>
        </div>
        <div class="menu-item" @click="goTo('/community/rewards')">
          <div class="menu-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><Present /></el-icon>
          </div>
          <span>我的奖励</span>
        </div>
        <div class="menu-item" @click="goTo('/community/messages')">
          <div class="menu-icon" style="background: #fff2e8; color: #fa8c16;">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <span>消息中心</span>
        </div>
      </div>
    </div>

    <!-- 列表菜单 -->
    <div class="list-menu">
      <div class="list-item" @click="goTo('/community/demands/publish')">
        <div class="list-icon" style="color: #07c160;">
          <el-icon><Plus /></el-icon>
        </div>
        <span>发布新需求</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #409EFF;">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <span>管理小区</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #fa8c16;">
          <el-icon><MapLocation /></el-icon>
        </div>
        <span>管理场地空间</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #909399;">
          <el-icon><Lock /></el-icon>
        </div>
        <span>修改密码</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #909399;">
          <el-icon><Setting /></el-icon>
        </div>
        <span>设置</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <el-button type="danger" plain class="logout-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </div>

    <!-- 底部安全区 -->
    <div class="safe-area-bottom"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  UserFilled, Camera, Phone, Location,
  Document, Star, Present, ChatDotRound,
  Plus, OfficeBuilding, MapLocation, Lock, Setting,
  ArrowRight, SwitchButton
} from '@element-plus/icons-vue'
import { getUserInfo } from '@/utils/useAuth'
import { getProfile, getMyDemands, getMyFavorites, getRewards, getUnreadCount } from '@/api/community'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const userInfo = ref({})
const stats = ref({ demands: 0, favorites: 0, rewards: 0, messages: 0 })

const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const goTo = (path) => {
  router.push(path)
}

const loadProfile = async () => {
  loading.value = true
  try {
    // 先从本地缓存取
    const cached = getUserInfo('community')
    if (cached) {
      userInfo.value = cached
    }
    // 再从服务器拉取最新
    const res = await getProfile()
    if (res.code === 200 || res.code === 0) {
      userInfo.value = res.data || res
      // 更新本地缓存
      localStorage.setItem('community_info', JSON.stringify(userInfo.value))
    }
  } catch (err) {
    console.error('获取个人资料失败:', err)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const [demandsRes, favsRes, rewardsRes, msgRes] = await Promise.allSettled([
      getMyDemands({ pageSize: 1 }),
      getMyFavorites({ pageSize: 1 }),
      getRewards({ pageSize: 1 }),
      getUnreadCount()
    ])
    stats.value.demands = demandsRes.value?.data?.pagination?.total || 0
    stats.value.favorites = favsRes.value?.data?.pagination?.total || 0
    stats.value.rewards = rewardsRes.value?.data?.pagination?.total || 0
    stats.value.messages = msgRes.value?.data?.count || msgRes.value?.data || 0
  } catch (err) {
    console.error('获取统计数据失败:', err)
  }
}

const editAvatar = () => {
  ElMessage.info('头像修改功能开发中')
}

const comingSoon = () => {
  ElMessage.info('功能开发中，敬请期待')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('community_token')
    localStorage.removeItem('community_info')
    ElMessage.success('已退出登录')
    router.push('/community')
  }).catch(() => {})
}

onMounted(() => {
  loadProfile()
  loadStats()
})
</script>

<style scoped>
.profile-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  padding: 32px 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.user-avatar {
  position: relative;
  cursor: pointer;
}

.user-avatar :deep(.el-avatar) {
  border: 3px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.9);
  color: #07c160;
}

.edit-avatar-mask {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.user-info {
  flex: 1;
  color: #fff;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 13px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.user-community {
  font-size: 12px;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}

.user-badge :deep(.el-tag) {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: #fff;
}

/* 数据统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #e8e8e8;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.stat-cell {
  background: #fff;
  padding: 16px 4px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
}

.stat-cell:active {
  background: #f5f5f5;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 菜单区域 */
.menu-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.menu-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
  border-radius: 8px;
  transition: background 0.2s;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.menu-item span {
  font-size: 12px;
  color: #666;
}

/* 列表菜单 */
.list-menu {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:active {
  background: #f5f5f5;
}

.list-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.list-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.list-arrow {
  color: #ccc;
  font-size: 16px;
}

/* 退出登录 */
.logout-section {
  margin: 24px 12px;
}

.logout-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-size: 15px;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom, 0px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .stats-grid {
    margin: 8px;
  }
  .menu-section,
  .list-menu {
    margin: 8px;
  }
  .logout-section {
    margin: 16px 8px;
  }
}
</style>
