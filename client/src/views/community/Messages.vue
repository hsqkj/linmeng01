<template>
  <div class="page">
    <h2>我的消息</h2>

    <el-tabs v-model="activeTab" class="message-tabs">
      <el-tab-pane label="系统通知" name="system">
        <div class="message-list">
          <el-card v-for="msg in systemMessages" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <el-tag :type="msg.tagType" size="small">{{ msg.tag }}</el-tag>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <h4 class="message-title">{{ msg.title }}</h4>
            <p class="message-content">{{ msg.content }}</p>
            <div class="message-actions" v-if="msg.action">
              <el-button type="primary" size="small" @click="handleAction(msg)">{{ msg.action }}</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="合作意向" name="intent">
        <div class="message-list">
          <el-card v-for="msg in intentMessages" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <el-avatar :size="32" :src="msg.avatar" />
              <div class="sender-info">
                <span class="sender-name">{{ msg.sender }}</span>
                <span class="sender-type">{{ msg.type }}</span>
              </div>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <div class="message-body">
              <p class="message-content">{{ msg.content }}</p>
              <div class="demand-ref" v-if="msg.demand">
                <el-icon><Link /></el-icon>
                关联需求：{{ msg.demand }}
              </div>
            </div>
            <div class="message-actions">
              <el-button type="success" size="small" @click="acceptIntent(msg)">接受合作</el-button>
              <el-button size="small" @click="viewDemand(msg)">查看需求</el-button>
              <el-button size="small" text type="danger" @click="rejectIntent(msg)">婉拒</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="留言咨询" name="comment">
        <div class="message-list">
          <el-card v-for="msg in commentMessages" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <el-avatar :size="32" :src="msg.avatar" />
              <div class="sender-info">
                <span class="sender-name">{{ msg.sender }}</span>
                <span class="message-time">{{ msg.time }}</span>
              </div>
            </div>
            <p class="message-content">{{ msg.content }}</p>
            
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
                    <el-avatar :size="24" :src="reply.avatar" />
                    <span class="reply-name">{{ reply.name }}</span>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('system')

const systemMessages = ref([
  {
    id: 1,
    tag: '审核通知',
    tagType: 'success',
    title: '您的需求已通过审核',
    content: '您发布的"六一儿童节亲子嘉年华活动赞助"需求已通过平台审核，现在可以被商家查看了。',
    time: '2026-04-01 10:30',
    action: '查看需求'
  },
  {
    id: 2,
    tag: '匹配提醒',
    tagType: 'warning',
    title: '有新商家资源与您匹配',
    content: '星巴克咖啡发布了"活动赞助资金最高5万元"资源，与您的"六一儿童节亲子嘉年华"需求匹配度达95%。',
    time: '2026-03-30 14:20',
    action: '查看详情'
  },
  {
    id: 3,
    tag: '撮合成功',
    tagType: 'primary',
    title: '合作对接成功',
    content: '您与京东健康就"社区健康义诊活动"达成合作意向，平台将持续跟进撮合进展。',
    time: '2026-03-28 09:15',
    action: '查看详情'
  },
  {
    id: 4,
    tag: '系统公告',
    tagType: 'info',
    title: '邻盟平台上线通知',
    content: '欢迎使用邻盟社区资源智能匹配助手！平台已正式上线，祝您使用愉快。',
    time: '2026-03-01 08:00'
  }
])

const intentMessages = ref([
  {
    id: 1,
    sender: '星巴克咖啡',
    type: '商家',
    avatar: 'https://ui-avatars.com/api/?name=星巴克&background=00704a&color=fff',
    content: '我们对这个活动非常感兴趣！可以提供资金5万元和品牌物料，请问场地大概有多大空间可以摆展台？',
    demand: '六一儿童节亲子嘉年华活动赞助',
    time: '2026-03-28 14:30'
  },
  {
    id: 2,
    sender: '新东方教育',
    type: '商家',
    avatar: 'https://ui-avatars.com/api/?name=新东方&background=FF6B35&color=fff',
    content: '我们可以提供亲子教育互动区，免费体验编程课和绘本阅读，请问场地有电源接口吗？',
    demand: '六一儿童节亲子嘉年华活动赞助',
    time: '2026-03-29 10:15'
  }
])

const commentMessages = ref([
  {
    id: 1,
    sender: '京东健康',
    avatar: 'https://ui-avatars.com/api/?name=京东&background=E1251B&color=fff',
    content: '我们计划在4月中旬进社区开展义诊活动，请问您这边方便安排在哪个时间段？',
    time: '2026-03-27 16:45',
    replies: [
      {
        id: 1,
        name: '光谷社区（您）',
        avatar: 'https://ui-avatars.com/api/?name=光谷&background=1a56db&color=fff',
        text: '您好！我们社区4月中旬有两周的时间比较方便，请问能安排在周末吗？',
        time: '2026-03-27 18:30'
      }
    ]
  },
  {
    id: 2,
    sender: '华润万家',
    avatar: 'https://ui-avatars.com/api/?name=华润&background=FF4444&color=fff',
    content: '端午节物资捐赠方案已准备好，随时可以沟通具体细节。',
    time: '2026-03-25 11:30',
    replies: []
  }
])

function handleAction(msg) {
  ElMessage.success(`正在跳转到：${msg.title}`)
  router.push('/community/demands')
}

function acceptIntent(msg) {
  ElMessageBox.confirm(
    `确定要接受「${msg.sender}」的合作意向吗？`,
    '确认接受合作',
    {
      confirmButtonText: '确定接受',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    // 从列表中移除该消息
    const index = intentMessages.value.findIndex(m => m.id === msg.id)
    if (index > -1) {
      intentMessages.value.splice(index, 1)
    }
    ElMessage.success('已接受合作意向，平台将通知商家进行后续对接')
  }).catch(() => {
    // 用户取消操作
  })
}

function viewDemand(msg) {
  router.push('/community/demands')
}

function rejectIntent(msg) {
  ElMessageBox.confirm(
    `确定要婉拒「${msg.sender}」的合作意向吗？婉拒后对方将收到通知。`,
    '确认婉拒合作',
    {
      confirmButtonText: '确定婉拒',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 从列表中移除该消息
    const index = intentMessages.value.findIndex(m => m.id === msg.id)
    if (index > -1) {
      intentMessages.value.splice(index, 1)
    }
    ElMessage.info('已婉拒该合作意向')
  }).catch(() => {
    // 用户取消操作
  })
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
  ).then(({ value }) => {
    // 添加回复
    if (!msg.replies) {
      msg.replies = []
    }
    msg.replies.push({
      id: Date.now(),
      name: '光谷社区（您）',
      avatar: 'https://ui-avatars.com/api/?name=光谷&background=1a56db&color=fff',
      text: value,
      time: new Date().toLocaleString()
    })
    ElMessage.success('回复已发送')
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
</style>
