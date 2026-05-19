<template>
  <div class="notifications-page">
    <div class="page-header">
      <h2>我的消息</h2>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <el-button text @click="markAllRead" :disabled="unreadCount === 0">全部已读</el-button>
      </el-badge>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterRead" size="default" @change="loadNotifications">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">未读</el-radio-button>
        <el-radio-button label="1">已读</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 消息列表 -->
    <div class="notification-list" v-loading="loading">
      <div v-if="!loading && notifications.length === 0" class="empty-state">
        <el-empty description="暂无消息" :image-size="80" />
      </div>

      <div
        v-for="item in notifications"
        :key="item.id"
        class="notification-item"
        :class="{ unread: !item.read_status }"
        @click="handleItemClick(item)"
      >
        <div class="item-icon">
          <el-icon v-if="!item.read_status"><BellFilled /></el-icon>
          <el-icon v-else><Bell /></el-icon>
        </div>
        <div class="item-content">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-desc">{{ item.content }}</div>
          <div class="item-time">{{ formatTime(item.created_at) }}</div>
        </div>
        <div class="item-action" v-if="!item.read_status">
          <el-button text size="small" type="primary" @click.stop="markRead(item)">标为已读</el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, BellFilled } from '@element-plus/icons-vue'
import { getAmbassadorNotifications, markNotificationRead } from '@/api/ambassador'

const notifications = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filterRead = ref('')
const unreadCount = ref(0)

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadNotifications() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterRead.value !== '') {
      params.is_read = filterRead.value
    }
    const res = await getAmbassadorNotifications(params)
    notifications.value = res.data?.list || []
    total.value = res.data?.total || 0
    unreadCount.value = res.data?.extra?.unreadCount || 0
  } catch (e) {
    console.error('加载通知失败', e)
    notifications.value = []
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount() {
  try {
    const res = await getAmbassadorNotifications({ page: 1, pageSize: 1, is_read: 0 })
    unreadCount.value = res.data?.extra?.unreadCount || 0
  } catch (e) {
    console.error('获取未读数失败', e)
  }
}

function handleItemClick(item) {
  if (!item.read_status) {
    markRead(item)
  }
}

async function markRead(item) {
  try {
    await markNotificationRead(item.id)
    item.read_status = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    console.error('标记已读失败', e)
  }
}

async function markAllRead() {
  try {
    await markNotificationRead('all')
    ElMessage.success('已全部标记为已读')
    notifications.value.forEach(item => { item.read_status = 1 })
    unreadCount.value = 0
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function onPageChange(p) {
  page.value = p
  loadNotifications()
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-page {
  background: #f5f5f5;
  max-width: 800px;
  margin: 0 auto;
  padding: 12px 14px 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.filter-bar {
  margin-bottom: 16px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.notification-item.unread {
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
  border-left: 3px solid #F59E0B;
}

.item-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #909399;
}

.notification-item.unread .item-icon {
  background: #F59E0B;
  color: #fff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-time {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.item-action {
  flex-shrink: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 40px 0;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 12px;
    padding-bottom: 70px;
  }

  .page-header h2 {
    font-size: 18px;
  }

  .notification-item {
    padding: 12px;
  }

  .item-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .item-title {
    font-size: 14px;
  }

  .item-desc {
    font-size: 12px;
  }
}
</style>
