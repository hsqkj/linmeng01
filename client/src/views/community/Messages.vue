<template>
  <div class="page">
    <h2>我的消息</h2>

    <el-tabs v-model="activeTab" class="message-tabs" @tab-change="onTabChange">
      <el-tab-pane label="系统通知" name="system">
        <div class="message-list" v-loading="systemLoading">
          <el-empty v-if="!systemLoading && systemMessages.length === 0" description="暂无系统通知" :image-size="80" />
          <el-card v-for="msg in systemMessages" :key="msg.id" class="message-card" :class="{ unread: !msg.is_read }" shadow="hover" @click="clickNotification(msg)">
            <div class="message-header">
              <el-tag :type="msg.tagType" size="small">{{ msg.tag }}</el-tag>
              <span class="message-time">{{ msg.time }}</span>
              <span v-if="!msg.is_read" class="unread-dot"></span>
            </div>
            <h4 class="message-title">{{ msg.title }}</h4>
            <p class="message-content">{{ msg.content }}</p>
            <div class="message-actions" v-if="msg.action">
              <el-button type="primary" size="small" @click.stop="handleAction(msg)">{{ msg.action }}</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="合作意向" name="intent">
        <div class="message-list" v-loading="intentLoading">
          <el-empty v-if="!intentLoading && intentMessages.length === 0" description="暂无合作意向记录" :image-size="80" />
          <el-card v-for="msg in intentMessages" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <div style="display:flex;align-items:center;gap:8px">
                <img :src="msg.merchant_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.company_name || '商家')}&background=67C23A&color=fff&size=32`" class="msg-avatar" />
                <div class="sender-info">
                  <span class="sender-name">{{ msg.company_name || '商家用户' }}</span>
                  <span class="sender-type">商家</span>
                </div>
              </div>
              <el-tag size="small" :type="msg.star_rating >= 4 ? 'warning' : 'info'">
                ⭐{{ msg.star_rating || 0 }}
              </el-tag>
              <el-tag size="small" :type="intentStatusType[msg.status]">{{ intentStatusName[msg.status] }}</el-tag>
              <span class="message-time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-body">
              <p class="message-content">{{ msg.intro || '暂无说明' }}</p>
              <div class="demand-ref" v-if="msg.demand_title">
                <el-icon><Link /></el-icon>
                关联需求：{{ msg.demand_title }}
              </div>
            </div>
            <div class="message-actions" v-if="msg.status === 0">
              <el-button type="success" size="small" @click="acceptIntent(msg)">接受合作</el-button>
              <el-button size="small" @click="viewDemand(msg)">查看需求</el-button>
              <el-button size="small" text type="danger" @click="rejectIntent(msg)">婉拒</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="留言咨询" name="comment">
        <div class="message-list" v-loading="commentLoading">
          <el-empty v-if="!commentLoading && commentMessages.length === 0" description="暂无留言记录" />
          <el-card v-for="msg in commentMessages" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <el-avatar :size="32" :src="msg.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="sender-info">
                <span class="sender-name">{{ msg.sender }}</span>
                <span class="message-time">{{ msg.time }}</span>
              </div>
              <el-tag size="small" :type="msg.comment_type === 'resource' ? 'warning' : 'success'">
                {{ msg.comment_type === 'resource' ? '资源留言' : '需求留言' }}
              </el-tag>
            </div>
            <p class="message-content">{{ msg.content }}</p>
            <!-- 关联的资源/需求标题 -->
            <div class="demand-ref" v-if="msg.resource_title || msg.demand_title">
              <el-icon><Link /></el-icon>
              {{ msg.comment_type === 'resource' ? '资源' : '需求' }}：{{ msg.resource_title || msg.demand_title }}
            </div>
            
            <!-- 层级回复显示 -->
            <div class="comment-replies" v-if="msg.replies && msg.replies.length">
              <div class="reply-divider">
                <el-divider content-position="left">
                  <span class="reply-count">{{ msg.replies.length }}条回复</span>
                </el-divider>
              </div>
              <div class="reply-list">
                <div class="reply-item" v-for="reply in msg.replies" :key="reply.id">
                  <div class="reply-header">
                    <el-avatar :size="24" :src="reply.avatar">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <span class="reply-name">{{ reply.isMine ? '我' : reply.name }}</span>
                    <span class="reply-time">{{ reply.time }}</span>
                  </div>
                  <div class="reply-text">{{ reply.text }}</div>
                </div>
              </div>
            </div>
            
            <div class="message-actions">
              <el-button type="primary" size="small" @click="replyComment(msg)">回复</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link, User } from '@element-plus/icons-vue'
import { getMyComments } from '@/api/community'

const intentStatusName = { 0: '待回复', 1: '已接受', 2: '已拒绝', 3: '已完成' }
const intentStatusType = { 0: 'warning', 1: 'success', 2: 'info', 3: 'primary' }

const router = useRouter()
const activeTab = ref('system')

// 系统通知 - 从真实API加载
const systemMessages = ref([])
const systemLoading = ref(false)

async function loadSystemNotifications() {
  systemLoading.value = true
  try {
    const { getMyNotifications } = await import('@/api/community')
    const res = await getMyNotifications({ page: 1, pageSize: 50 })
    systemMessages.value = res?.data?.list || res?.data || []
  } catch {
    systemMessages.value = []
  } finally {
    systemLoading.value = false
  }
}

// 合作意向 - 从真实API加载
const intentMessages = ref([])
const intentLoading = ref(false)

async function loadIntentions() {
  intentLoading.value = true
  try {
    const res = await import('@/api/community').then(m => m.getMyIntentions({ page: 1, pageSize: 50 }))
    intentMessages.value = res.data?.list || []
  } catch {
    intentMessages.value = []
  } finally {
    intentLoading.value = false
  }
}

// 留言咨询 - 从真实API加载（只看自己发的和收到的回复）
const commentMessages = ref([])
const commentLoading = ref(false)

async function loadMyComments() {
  commentLoading.value = true
  try {
    const res = await getMyComments()
    commentMessages.value = res.data || []
  } catch {
    // 无留言时显示空
    commentMessages.value = []
  } finally {
    commentLoading.value = false
  }
}

onMounted(() => {
  // 系统通知默认加载
  loadSystemNotifications()
})

// 监听 tab 切换，切换到留言时加载数据
function onTabChange(tab) {
  if (tab === 'system') {
    loadSystemNotifications()
  } else if (tab === 'comment') {
    loadMyComments()
  } else if (tab === 'intent') {
    loadIntentions()
  }
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 点击通知标记已读
async function clickNotification(msg) {
  if (msg.is_read) return
  try {
    const { markOneNotificationRead } = await import('@/api/community')
    await markOneNotificationRead(msg.id)
    msg.is_read = true
    // 通知父组件更新角标
    window.dispatchEvent(new CustomEvent('notification-read'))
  } catch (e) {
    // 忽略错误
  }
  // 处理消息动作
  handleAction(msg)
}

function handleAction(msg) {
  // 根据消息类型跳转到不同页面
  if (msg.tag === '匹配提醒') {
    // 匹配提醒 -> 跳转到资源详情页（如果有resource_id）或资源广场
    if (msg.resource_id) {
      router.push(`/community/resources/${msg.resource_id}`)
    } else {
      router.push('/community/resources')
    }
  } else if (msg.tag === '审核通知') {
    // 审核通知 -> 跳转到需求详情页
    if (msg.demand_id) {
      router.push(`/community/demands/${msg.demand_id}`)
    } else {
      router.push('/community/demands')
    }
  } else if (msg.tag === '撮合成功') {
    // 撮合成功 -> 跳转到意向页面（合作意向tab）
    router.push('/community/messages?tab=intent')
  } else {
    // 其他消息类型 -> 消息列表
    ElMessage.info('该消息暂无详细内容')
  }
}

async function acceptIntent(msg) {
  try {
    await ElMessageBox.confirm(
      `确定要接受「${msg.company_name}」的合作意向吗？`,
      '确认接受合作',
      { confirmButtonText: '确定接受', cancelButtonText: '取消', type: 'success' }
    )
    const { acceptIntention } = await import('@/api/community')
    await acceptIntention(msg.id)
    msg.status = 1
    ElMessage.success('已接受合作意向')
  } catch {
    // 用户取消
  }
}

function viewDemand(msg) {
  if (msg.demand_id) {
    router.push(`/community/demands/${msg.demand_id}`)
  }
}

async function rejectIntent(msg) {
  try {
    await ElMessageBox.confirm(
      `确定要婉拒「${msg.company_name}」的合作意向吗？`,
      '确认婉拒合作',
      { confirmButtonText: '确定婉拒', cancelButtonText: '取消', type: 'warning' }
    )
    const { rejectIntention } = await import('@/api/community')
    await rejectIntention(msg.id, {})
    msg.status = 2
    ElMessage.info('已婉拒该合作意向')
  } catch {
    // 用户取消
  }
}

function replyComment(msg) {
  ElMessageBox.prompt(
    `回复「${msg.sender}」：`,
    '填写回复内容',
    {
      confirmButtonText: '发送回复',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '回复内容不能为空'
    }
  ).then(async ({ value }) => {
    try {
      await import('@/api/community').then(m => m.replyComment(msg.id, { content: value }))
      ElMessage.success('回复已发送')
      loadMyComments() // 重新加载留言
    } catch {
      ElMessage.error('回复失败，请重试')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
}

.page h2 {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 700;
}

.message-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-card {
  transition: transform 0.2s;
}

.message-card:hover {
  transform: translateY(-2px);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sender-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
}

.sender-type {
  font-size: 12px;
  color: #909399;
}

.message-time {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.message-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.message-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.message-body {
  margin-bottom: 12px;
}

.demand-ref {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 13px;
  color: #409EFF;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.comment-replies {
  margin-top: 16px;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
}

.reply-divider {
  margin-bottom: 12px;
}

.reply-count {
  font-size: 12px;
  color: #909399;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-item {
  background: white;
  border-radius: 6px;
  padding: 10px 12px;
  border-left: 3px solid #409EFF;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.reply-name {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.reply-time {
  font-size: 11px;
  color: #909399;
  margin-left: auto;
}

.reply-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  padding-left: 32px;
}

@media (max-width: 768px) {
  .message-header {
    flex-wrap: wrap;
  }

  .message-time {
    width: 100%;
    margin-left: 44px;
    margin-top: 4px;
  }
}

/* 未读状态 */
.message-card.unread {
  border-left: 3px solid #409EFF;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #F56C6C;
  border-radius: 50%;
  margin-left: auto;
}
</style>
