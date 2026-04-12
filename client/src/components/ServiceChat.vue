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
          <p>👋 {{ serviceConfig.welcome || '你好！我是邻盟平台客服' }}</p>
          <p v-if="!serviceConfig.welcome">有什么可以帮助您的吗？</p>

          <!-- 快捷分类切换 -->
          <div class="quick-categories">
            <el-tag
              v-for="(cat, idx) in quickCategories"
              :key="cat.label"
              :type="expandedCategory === idx ? 'primary' : 'info'"
              size="small"
              @click="switchCategory(idx)"
              class="cat-tag"
            >{{ cat.label }}</el-tag>
          </div>

          <!-- 当前分类的快捷问题 -->
          <div class="quick-questions">
            <el-tag v-for="q in quickQuestions" :key="q" @click="sendQuickQuestion(q)" class="quick-tag">{{ q }}</el-tag>
          </div>

          <!-- 常见FAQ折叠 -->
          <div class="faq-section">
            <div class="faq-toggle" @click="showFaq = !showFaq">
              <span>常见问题解答</span>
              <el-icon :class="{ 'faq-arrow': true, 'expanded': showFaq }"><ArrowRight /></el-icon>
            </div>
            <div v-if="showFaq" class="faq-list">
              <div v-for="(faq, idx) in faqs" :key="idx" class="faq-item" @click="sendQuickQuestion(faq.q)">
                <div class="faq-q">{{ idx + 1 }}. {{ faq.q }}</div>
                <div class="faq-a">{{ faq.a }}</div>
              </div>
            </div>
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
import { ref, nextTick, onMounted } from 'vue'
import { ChatDotRound, Service, Close, User, Promotion, MagicStick, ArrowRight } from '@element-plus/icons-vue'
import { getServiceConfig, getFaqList } from '@/api/admin'

const visible = ref(false)
const loading = ref(false)
const messages = ref([])
const inputText = ref('')
const aiTyping = ref(false)
const unreadCount = ref(0)
const isAiMode = ref(true)
const messagesContainer = ref(null)
const showFaq = ref(false)

// 从API加载的配置
const serviceConfig = ref({
  name: '邻盟智能客服',
  welcome: '您好！我是邻盟智能客服助手 👋\n请问有什么可以帮您？',
  hotline: '400-888-8888',
  email: '12494789@qq.com',
  unknownReply: '抱歉，我暂时无法理解您的问题。您可以：\n1. 拨打客服热线：400-888-8888\n2. 发送邮件至：12494789@qq.com'
})

// 快捷问题分类（默认）
const defaultCategories = [
  {
    label: '平台服务',
    questions: ['平台是什么？', '如何发布需求？', '如何发布资源？', '撮合奖励是什么？', '会员权益有哪些？']
  },
  {
    label: '会员相关',
    questions: ['如何成为金牌会员？', '会员权益有哪些？', '如何升级会员？', '会员到期怎么办？']
  },
  {
    label: '合作问题',
    questions: ['如何联系商家/社区？', '撮合成功的标准？', '招商大使是什么？', '如何成为大使？']
  },
  {
    label: '常见问题',
    questions: ['忘记密码怎么办？', '如何修改个人信息？', '如何取消会员？', '联系方式是多少？']
  }
]

const quickCategories = ref(defaultCategories)
const expandedCategory = ref(0)
const quickQuestions = ref(quickCategories.value[0].questions)

// 常见FAQ列表（默认）
const defaultFaqs = [
  { q: '社区发布需求需要什么条件？', a: '社区账号完成认证后即可免费发布需求。建议详细填写需求类型、活动内容、目标人群等信息，便于精准匹配。' },
  { q: '商家入驻需要哪些资料？', a: '商家入驻需要提供营业执照、法人信息、商家简介等资料。审核通过后即可发布资源。' },
  { q: '撮合成功后奖励如何发放？', a: '当社区与商家双方确认合作意向后，平台将自动记录撮合信息。奖励以物资形式发放给社区。' },
  { q: '金牌会员有什么特权？', a: '金牌会员可查看商家详细联系方式、参与撮合奖励计划、获得优先匹配推荐等。' },
  { q: '资源发布后多久能收到反馈？', a: '资源发布后会即时进入匹配系统。建议完善资源描述和目标人群，可提高匹配效率和曝光度。' }
]
const faqs = ref(defaultFaqs)

// 默认AI回复
const defaultAiReplies = {
  '平台是什么？': '邻盟是一个社区资源智能匹配平台，致力于连接社区与商家，帮助社区获取更多资源支持，助商家精准触达目标社区。我们提供智能匹配、在线对接、撮合奖励等一站式服务。',
  '如何发布需求？': '登录社区端后，点击首页「发布新需求」按钮，填写：需求标题、需求类型、详细描述、目标人群、期望回报等信息。填写越详细，匹配越精准！',
  '如何发布资源？': '登录商家端后，点击「发布赞助资源」按钮，填写：资源类型、内容描述、赞助方式、目标人群、合作要求等信息。优质资源将获得更多曝光机会。',
  '撮合奖励是什么？': '当您发布的社区需求与商家资源成功撮合（双方确认合作意向）后，平台将给予物资奖励！这是邻盟为支持社区发展提供的特别福利。',
  '会员权益有哪些？': '邻盟会员分为五个等级：\n• 普通会员：免费，基本功能\n• 银牌会员：¥999/年，基础权益\n• 金牌会员：¥2999/年，查看联系方式+撮合奖励\n• 铂金会员：¥5999/年，优先推荐+更多权益\n• 钻石会员：¥12000/年，全功能+专属服务',
  '如何成为金牌会员？': '金牌会员需缴纳年费2999元/年。登录后进入「会员中心」即可升级。金牌会员权益包括：查看商家详细联系方式、优先匹配推荐、参与撮合奖励计划等。',
  '如何升级会员？': '登录后进入「会员中心」，选择您想要的会员等级并完成支付即可升级。支持支付宝、微信支付。',
  '会员到期怎么办？': '会员到期前7天系统会发送提醒短信。到期后会自动降级为普通会员，功能权益会有所限制。您可以随时续费恢复原有权益。',
  '如何取消会员？': '取消会员请致客服热线 400-888-8888。取消后当月权益仍可使用，次月1日起按普通会员标准计费。',
  '如何联系商家/社区？': '您可以在资源广场/需求广场浏览并点击「立即联系」提交合作意向。商家审核通过后，双方即可通过平台内留言功能沟通。金牌及以上会员可直接查看对方联系方式。',
  '撮合成功的标准？': '当社区与商家双方确认合作意向，且意向状态变为"已接受/已合作"时，即视为撮合成功。届时平台会记录并发放相应奖励。',
  '招商大使是什么？': '招商大使是邻盟的合作伙伴，负责推广平台、招募社区和商家入驻。成功介绍可获得提成：首次介绍20%提成，续费10%提成。成为大使请联系平台客服。',
  '如何成为大使？': '成为招商大使非常简单！联系平台客服或前往「招商大使」页面申请即可。无需缴纳费用，成功推荐商家/社区入驻即可获得奖励。',
  '忘记密码怎么办？': '在登录页面点击「忘记密码」，输入注册手机号，系统会发送验证码到您的手机，验证后即可设置新密码。',
  '如何修改个人信息？': '登录后进入「个人中心」-「编辑资料」，可以修改头像、昵称、联系方式等信息。商家用户还可以修改公司介绍。',
  '联系方式是多少？': `客服热线：${serviceConfig.value.hotline}（工作日 9:00-18:00）\n邮箱：${serviceConfig.value.email}\n微信：搜索公众号「邻盟平台」`
}

// AI回复（动态）
const aiReplies = ref({ ...defaultAiReplies })

// 从API加载配置
async function loadServiceConfig() {
  try {
    // 并行加载设置和FAQ
    const [configRes, faqRes] = await Promise.all([
      getServiceConfig(),
      getFaqList()
    ])
    
    // 加载客服设置
    if (configRes?.data) {
      serviceConfig.value = { ...serviceConfig.value, ...configRes.data }
      
      // 更新联系方式相关的回复
      if (configRes.data.hotline) {
        aiReplies.value['联系方式是多少？'] = `客服热线：${configRes.data.hotline}（工作日 9:00-18:00）\n邮箱：${configRes.data.email || '12494789@qq.com'}\n微信：搜索公众号「邻盟平台」`
      }
    }
    
    // 加载FAQ
    if (faqRes?.data?.length) {
      faqs.value = faqRes.data
      // 从FAQ生成快捷问题和回复
      const newQuestions = []
      faqRes.data.forEach((faq, idx) => {
        if (faq.enabled !== false) {
          newQuestions.push(faq.question)
          // 动态添加FAQ的回复
          aiReplies.value[faq.question] = faq.answer
        }
      })
      if (newQuestions.length > 0) {
        // 按分类重组
        const catCount = Math.ceil(newQuestions.length / 4)
        quickCategories.value = [
          { label: '常见问题', questions: newQuestions.slice(0, catCount) },
          { label: '使用帮助', questions: newQuestions.slice(catCount, catCount * 2) },
          { label: '会员相关', questions: newQuestions.slice(catCount * 2, catCount * 3) },
          { label: '其他问题', questions: newQuestions.slice(catCount * 3) }
        ].filter(c => c.questions.length > 0)
        quickQuestions.value = quickCategories.value[0]?.questions || []
      }
    }
  } catch (err) {
    console.warn('加载客服配置失败，使用默认配置:', err)
  }
}

// 暴露打开客服窗口的方法
const openChat = () => {
  visible.value = true
}

// 通过provide暴露给子组件
import { provide } from 'vue'
provide('openServiceChat', openChat)

// 快捷问题分类切换
function switchCategory(idx) {
  expandedCategory.value = idx
  quickQuestions.value = quickCategories.value[idx].questions
}

// 常见FAQ列表（折叠显示）
const faqs = ref([
  { q: '社区发布需求需要什么条件？', a: '社区账号完成认证后即可免费发布需求。建议详细填写需求类型、活动内容、目标人群等信息，便于精准匹配。' },
  { q: '商家入驻需要哪些资料？', a: '商家入驻需要提供营业执照、法人信息、商家简介等资料。审核通过后即可发布资源。' },
  { q: '撮合成功后奖励如何发放？', a: '当社区与商家双方确认合作意向后，平台将自动记录撮合信息。奖励以物资形式发放给社区。' },
  { q: '金牌会员有什么特权？', a: '金牌会员可查看商家详细联系方式、参与撮合奖励计划、获得优先匹配推荐等。' },
  { q: '资源发布后多久能收到反馈？', a: '资源发布后会即时进入匹配系统。建议完善资源描述和目标人群，可提高匹配效率和曝光度。' }
])

// 模拟AI回复（支持多种问法）
const aiReplies = {
  // 平台服务类
  '平台是什么？': '邻盟是一个社区资源智能匹配平台，致力于连接社区与商家，帮助社区获取更多资源支持，助商家精准触达目标社区。我们提供智能匹配、在线对接、撮合奖励等一站式服务。',
  '如何发布需求？': '登录社区端后，点击首页「发布新需求」按钮，填写：需求标题、需求类型、详细描述、目标人群、期望回报等信息。填写越详细，匹配越精准！',
  '如何发布资源？': '登录商家端后，点击「发布赞助资源」按钮，填写：资源类型、内容描述、赞助方式、目标人群、合作要求等信息。优质资源将获得更多曝光机会。',
  '撮合奖励是什么？': '当您发布的社区需求与商家资源成功撮合（双方确认合作意向）后，平台将给予物资奖励！这是邻盟为支持社区发展提供的特别福利。',
  '会员权益有哪些？': '邻盟会员分为五个等级：\n• 普通会员：免费，基本功能\n• 银牌会员：¥999/年，基础权益\n• 金牌会员：¥2999/年，查看联系方式+撮合奖励\n• 铂金会员：¥5999/年，优先推荐+更多权益\n• 钻石会员：¥12000/年，全功能+专属服务',

  // 会员相关类
  '如何成为金牌会员？': '金牌会员需缴纳年费2999元/年。登录后进入「会员中心」即可升级。金牌会员权益包括：查看商家详细联系方式、优先匹配推荐、参与撮合奖励计划等。',
  '如何升级会员？': '登录后进入「会员中心」，选择您想要的会员等级并完成支付即可升级。支持支付宝、微信支付。',
  '会员到期怎么办？': '会员到期前7天系统会发送提醒短信。到期后会自动降级为普通会员，功能权益会有所限制。您可以随时续费恢复原有权益。',
  '如何取消会员？': '取消会员请致客服热线 400-888-8888。取消后当月权益仍可使用，次月1日起按普通会员标准计费。',

  // 合作问题类
  '如何联系商家/社区？': '您可以在资源广场/需求广场浏览并点击「立即联系」提交合作意向。商家审核通过后，双方即可通过平台内留言功能沟通。金牌及以上会员可直接查看对方联系方式。',
  '撮合成功的标准？': '当社区与商家双方确认合作意向，且意向状态变为"已接受/已合作"时，即视为撮合成功。届时平台会记录并发放相应奖励。',
  '招商大使是什么？': '招商大使是邻盟的合作伙伴，负责推广平台、招募社区和商家入驻。成功介绍可获得提成：首次介绍20%提成，续费10%提成。成为大使请联系平台客服。',
  '如何成为大使？': '成为招商大使非常简单！联系平台客服或前往「招商大使」页面申请即可。无需缴纳费用，成功推荐商家/社区入驻即可获得奖励。',

  // 常见问题类
  '忘记密码怎么办？': '在登录页面点击「忘记密码」，输入注册手机号，系统会发送验证码到您的手机，验证后即可设置新密码。',
  '如何修改个人信息？': '登录后进入「个人中心」-「编辑资料」，可以修改头像、昵称、联系方式等信息。商家用户还可以修改公司介绍。',
  '联系方式是多少？': '客服热线：400-888-8888（工作日 9:00-18:00）\n邮箱：12494789@qq.com\n微信：搜索公众号「邻盟平台」'
}

// 关键词匹配函数
function findBestMatch(input) {
  const lower = input.toLowerCase()

  // 精确匹配
  if (aiReplies[input]) return aiReplies[input]

  // 关键词匹配
  const keywords = {
    '金牌': '如何成为金牌会员？',
    '忘记密码': '忘记密码怎么办？',
    '密码': '忘记密码怎么办？',
    '取消会员': '如何取消会员？',
    '退订': '如何取消会员？',
    '升级': '如何升级会员？',
    '续费': '会员到期怎么办？',
    '到期': '会员到期怎么办？',
    '联系': '如何联系商家/社区？',
    '联系方式': '联系方式是多少？',
    '电话': '联系方式是多少？',
    '热线': '联系方式是多少？',
    '投诉': '联系方式是多少？',
    '反馈': '联系方式是多少？'
  }

  for (const [key, question] of Object.entries(keywords)) {
    if (lower.includes(key)) {
      return aiReplies[question]
    }
  }

  return null
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
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800))

  aiTyping.value = false

  // 使用关键词匹配查找回复
  let reply = findBestMatch(text)
  if (!reply) {
    const unknownMsg = serviceConfig.value.unknownReply || '抱歉，我暂时无法理解您的问题。'
    const contactInfo = `\n\n您也可以：\n📞 拨打热线：${serviceConfig.value.hotline || '400-888-8888'}\n📧 发送邮件：${serviceConfig.value.email || '12494789@qq.com'}`
    reply = `感谢您的问题「${text}」。我们的AI客服正在学习中。\n\n${unknownMsg}${contactInfo}`
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

.quick-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 12px;
}

.cat-tag {
  cursor: pointer;
  font-size: 11px;
}

.faq-section {
  margin-top: 16px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.faq-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #909399;
  font-size: 12px;
  padding: 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.faq-toggle:hover {
  background: #f5f7fa;
  color: #409EFF;
}

.faq-arrow {
  transition: transform 0.2s;
}

.faq-arrow.expanded {
  transform: rotate(90deg);
}

.faq-list {
  margin-top: 8px;
  text-align: left;
}

.faq-item {
  padding: 8px 10px;
  margin-bottom: 6px;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.faq-item:hover {
  background: #ecf5ff;
}

.faq-q {
  font-size: 12px;
  color: #409EFF;
  font-weight: 500;
  margin-bottom: 4px;
}

.faq-a {
  font-size: 11px;
  color: #909399;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
