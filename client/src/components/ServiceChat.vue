<template>
  <div>
    <!-- 悬浮客服图标 -->
    <div v-if="!visible" class="service-float-btn" @click="visible = true" title="联系客服">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="9">
        <div class="float-icon">
          <el-icon :size="28"><ChatDotRound /></el-icon>
        </div>
      </el-badge>
    </div>

    <!-- 客服聊天窗口 -->
    <div v-else class="service-chat-panel" v-loading="loading">
      <div class="chat-header">
        <div class="chat-title">
          <el-icon><Service /></el-icon>
          <span>平台客服</span>
        </div>
        <div class="chat-actions">
          <el-button text @click="visible = false" circle size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- AI客服提示 -->
      <div class="ai-tip" v-if="isAiMode">
        <el-icon><MagicStick /></el-icon>
        <span>AI智能客服在线中...</span>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!messages.length" class="chat-empty">
          <p>👋 你好！我是邻盟平台客服</p>
          <p>有什么可以帮助您的吗？</p>
          <div class="quick-questions">
            <el-tag v-for="q in quickQuestions" :key="q" @click="sendQuickQuestion(q)" class="quick-tag">{{ q }}</el-tag>
          </div>
        </div>
        <div v-for="(msg, idx) in messages" :key="idx" :class="['message-item', msg.role]">
          <el-avatar v-if="msg.role === 'user'" :size="32" class="msg-avatar user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div v-else class="msg-avatar bot-avatar">
            <el-icon :size="20"><Service /></el-icon>
          </div>
          <div class="message-bubble">
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>
        <!-- AI回复中 -->
        <div v-if="aiTyping" class="message-item assistant">
          <div class="msg-avatar bot-avatar">
            <el-icon :size="20"><Service /></el-icon>
          </div>
          <div class="message-bubble">
            <div class="ai-thinking">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷问题 -->
      <div class="quick-reply" v-if="messages.length > 0">
        <span class="quick-label">快捷问题：</span>
        <el-tag v-for="q in quickQuestions" :key="q" size="small" @click="sendQuickQuestion(q)" class="quick-tag">{{ q }}</el-tag>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <el-input
          v-model="inputText"
          placeholder="输入您的问题..."
          @keyup.enter="sendMessage"
          :disabled="aiTyping"
        >
          <template #append>
            <el-button @click="sendMessage" :disabled="!inputText.trim() || aiTyping">
              <el-icon><Promotion /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ChatDotRound, Service, Close, User, Promotion, MagicStick } from '@element-plus/icons-vue'

const visible = ref(false)
const loading = ref(false)
const messages = ref([])
const inputText = ref('')
const aiTyping = ref(false)
const unreadCount = ref(0)
const isAiMode = ref(true)
const messagesContainer = ref(null)

const quickQuestions = [
  '平台是什么？',
  '如何发布需求？',
  '如何发布资源？',
  '会员权益有哪些？',
  '撮合奖励是什么？',
  '如何联系商家/社区？',
  '招商大使是什么？',
  '如何成为金牌会员？',
  '撮合成功的标准？'
]

// 模拟AI回复
const aiReplies = {
  '平台是什么？': '邻盟是一个社区资源智能匹配平台，致力于连接社区与商家，帮助社区获取更多资源支持，助商家精准触达目标社区。我们提供智能匹配、在线对接、撮合奖励等一站式服务。',
  '如何发布需求？': '登录社区端后，点击首页「发布新需求」按钮，填写：需求标题、需求类型、详细描述、目标人群、期望回报等信息。填写越详细，匹配越精准！',
  '如何发布资源？': '登录商家端后，点击「发布赞助资源」按钮，填写：资源类型、内容描述、赞助方式、目标人群、合作要求等信息。优质资源将获得更多曝光机会。',
  '会员权益有哪些？': '邻盟会员分为五个等级：\n• 普通会员：免费，基本功能\n• 银牌会员：¥999/年，基础权益\n• 金牌会员：¥2999/年，查看联系方式+撮合奖励\n• 铂金会员：¥5999/年，优先推荐+更多权益\n• 钻石会员：¥12000/年，全功能+专属服务',
  '撮合奖励是什么？': '当您发布的社区需求与商家资源成功撮合（双方确认合作意向）后，平台将给予200元物资奖励！这是邻盟为支持社区发展提供的特别福利。',
  '如何联系商家/社区？': '您可以在资源广场/需求广场浏览并点击「立即联系」提交合作意向。商家审核通过后，双方即可通过平台内留言功能沟通。金牌及以上会员可直接查看对方联系方式。',
  '招商大使是什么？': '招商大使是邻盟的合作伙伴，负责推广平台、招募社区和商家入驻。成功介绍可获得提成：首次介绍20%提成，续费10%提成。成为大使请联系平台客服。',
  '如何成为金牌会员？': '金牌会员需缴纳年费2999元/年。登录后进入「会员中心」即可升级。金牌会员权益包括：查看商家详细联系方式、优先匹配推荐、参与撮合奖励计划等。',
  '撮合成功的标准？': '当社区与商家双方确认合作意向，且意向状态变为"已接受/已合作"时，即视为撮合成功。届时平台会记录并发放相应奖励。'
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function formatTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

async function sendQuickQuestion(question) {
  inputText.value = question
  await sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: text,
    time: formatTime()
  })
  inputText.value = ''
  scrollToBottom()

  // 模拟AI回复
  aiTyping.value = true
  scrollToBottom()

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

  aiTyping.value = false

  let reply = aiReplies[text]
  if (!reply) {
    reply = `感谢您的问题「${text}」。我们的AI客服正在学习中，建议您联系人工客服获取更详细的帮助。您也可以拨打平台热线：400-888-8888`
  }

  messages.value.push({
    role: 'assistant',
    content: reply,
    time: formatTime()
  })
  scrollToBottom()
}
</script>

<style scoped>
.service-float-btn {
  position: fixed;
  right: 24px;
  bottom: 80px;
  z-index: 999;
  cursor: pointer;
}

.float-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #36cfc9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.float-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
}

.service-chat-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 360px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #409EFF, #36cfc9);
  color: white;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.chat-actions {
  display: flex;
  gap: 4px;
}

.ai-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: #f0f9ff;
  color: #409EFF;
  font-size: 12px;
  border-bottom: 1px solid #e6f7ff;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
}

.chat-empty {
  text-align: center;
  color: #606266;
  padding: 20px;
}

.chat-empty p {
  margin: 6px 0;
  font-size: 14px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 16px;
}

.quick-tag {
  cursor: pointer;
  font-size: 12px;
}

.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
}

.bot-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #36cfc9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  background: #67C23A;
  color: white;
}

.message-bubble {
  max-width: 75%;
}

.message-content {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.user .message-content {
  background: #67C23A;
  color: white;
  border-bottom-right-radius: 2px;
}

.assistant .message-content {
  background: white;
  color: #303133;
  border-bottom-left-radius: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.message-time {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  text-align: right;
}

.ai-thinking {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409EFF;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.quick-reply {
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background: white;
}

.quick-label {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .service-float-btn {
    right: 16px;
    bottom: 70px;
  }

  .float-icon {
    width: 48px;
    height: 48px;
  }

  .service-chat-panel {
    right: 8px;
    bottom: 8px;
    left: 8px;
    width: auto;
    height: 70vh;
  }
}
</style>
