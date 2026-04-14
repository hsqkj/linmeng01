<template>
  <div class="merchant-detail" v-loading="loading">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回资源列表</el-button>
    </div>

    <div v-if="resource" class="detail-layout">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <div class="merchant-card">
          <div class="merchant-header">
            <div class="merchant-logo">
              <img :src="resource.merchant_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(resource.company_name || '商家')}&background=4A90D9&color=fff&size=128`" class="logo-img" @error="(e) => e.target.style.display='none'" />
            </div>
            <div class="merchant-info">
              <div class="merchant-meta">
                <el-tag :type="memberLevelTagType" size="large">{{ memberLevelName }}</el-tag>
                <el-tag type="info" size="small">{{ getResourceTypeName(resource.resource_type) }}</el-tag>
              </div>
              <h1 class="merchant-name">{{ resource.company_name || '商家名称' }}</h1>
              <div class="merchant-rating">
                <span class="rating-label">商家评级：</span>
                <span class="star-rating-text">{{ resource.star_rating || 0 }}星</span>
              </div>
              <div class="match-hearts">
                <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= (resource.matchHearts || 0) }]">♥</span>
                <span class="match-text">与您匹配度 {{ (resource.matchScore || 0) * 20 }}%</span>
              </div>
              <div class="merchant-tags">
                <el-tag v-for="tag in (resource.tags || [])" :key="tag" size="small" effect="plain" style="margin:2px">{{ tag }}</el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 资源基本信息 -->
          <div class="section">
            <h3>📋 资源信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">资源类型</span>
                <span class="info-value"><el-tag size="small">{{ getResourceTypeName(resource.resource_type) }}</el-tag></span>
              </div>
              <div class="info-item">
                <span class="info-label">浏览次数</span>
                <span class="info-value">{{ resource.view_count || 0 }} 次</span>
              </div>
              <div class="info-item">
                <span class="info-label">有效期至</span>
                <span class="info-value">{{ resource.valid_until || '长期有效' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">发布时间</span>
                <span class="info-value">{{ formatDate(resource.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- 资源描述 -->
          <div class="section">
            <h3>📝 资源描述</h3>
            <p class="description">{{ resource.content || resource.description || '暂无描述' }}</p>
          </div>

          <!-- 期望回报 -->
          <div class="section" v-if="resource.expected_return">
            <h3>🏆 期望回报</h3>
            <div class="reward-block">
              <p>{{ resource.expected_return }}</p>
            </div>
          </div>

          <!-- 商家简介 -->
          <div class="section" v-if="resource.merchant_description">
            <h3>🏢 商家简介</h3>
            <p class="description">{{ resource.merchant_description }}</p>
          </div>

          <!-- 社会身份 -->
          <div class="section" v-if="resource.social_identity">
            <h3>🎖️ 社会身份</h3>
            <p class="description">{{ resource.social_identity }}</p>
          </div>

          <!-- 资质荣誉 -->
          <div class="section" v-if="resource.honors">
            <h3>🏅 资质荣誉</h3>
            <p class="description">{{ resource.honors }}</p>
          </div>

          <!-- 详细介绍/产品服务 -->
          <div class="section" v-if="merchantProducts.length">
            <h3>📦 产品/服务介绍</h3>
            <div class="products-showcase">
              <div v-for="(product, idx) in merchantProducts" :key="idx" class="product-card">
                <div v-if="product.image" class="product-img">
                  <el-image :src="product.image" fit="cover" style="width:100%;height:160px;border-radius:8px" :preview-src-list="[product.image]" />
                </div>
                <div v-if="product.title || product.description" class="product-info">
                  <h4 v-if="product.title">{{ product.title }}</h4>
                  <p v-if="product.description">{{ product.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 留言区 -->
          <div class="section">
            <h3>💬 留言与咨询（{{ comments.length }}条）</h3>
            <div class="comment-input" id="comment-area">
              <el-input v-model="commentText" placeholder="有意向合作？可以在这里留言咨询..." type="textarea" :rows="3" />
              <el-button type="primary" :loading="commentLoading" @click="submitComment" style="margin-top:8px">发送留言</el-button>
            </div>
            <div class="comment-list">
              <div class="comment-item" v-for="c in comments" :key="c.id">
                <img :src="c.avatar" class="comment-avatar" />
                <div class="comment-content">
                  <div class="comment-meta">
                    <span class="commenter-name">{{ c.name }}</span>
                    <span class="comment-time">{{ c.time }}</span>
                  </div>
                  <div class="comment-text">{{ c.text }}</div>
                  <div class="comment-replies" v-if="c.replies && c.replies.length">
                    <div class="reply-item" v-for="r in c.replies" :key="r.id">
                      <strong>{{ r.name }}：</strong>{{ r.text }}
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-if="comments.length === 0" description="暂无留言" :image-size="60" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：商家信息 + 操作 -->
      <div class="side-content">
        <!-- 操作卡 -->
        <div class="action-card">
          <div class="match-score">
            <div class="hearts">
              <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= (resource.matchHearts || 0) }]">♥</span>
            </div>
            <div class="score-label">匹配度 {{ (resource.matchScore || 0) * 20 }}%</div>
          </div>
          <div class="action-btns">
            <el-button type="primary" @click="leaveMessage">
              💬 留言咨询
            </el-button>
            <el-button @click="showMerchantInfoDialog">
              🏢 查看商家
            </el-button>
          </div>
        </div>

        <!-- 商家基本信息 -->
        <div class="info-card">
          <h4>🏢 商家基本信息</h4>
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="商家名称">{{ resource.company_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="行业分类">{{ resource.industry || '-' }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">
              <el-tag :type="memberLevelTagType" size="small">{{ memberLevelName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="平台评级">
              <span class="star-rating-text">{{ resource.star_rating || 0 }}星</span>
            </el-descriptions-item>
            <el-descriptions-item label="联系人"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
            <el-descriptions-item label="联系电话"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
          </el-descriptions>
          <el-alert type="info" :closable="false" show-icon style="margin-top:12px">
            <template #default>留言内容将经平台审核后推送给商家。</template>
          </el-alert>
        </div>
      </div>
    </div>

    <!-- 资源不存在 -->
    <el-result v-else icon="error" title="资源不存在" sub-title="该资源可能已下架或不存在">
      <template #extra>
        <el-button type="primary" @click="$router.push('/community/resources')">返回资源列表</el-button>
      </template>
    </el-result>

    <!-- 留言对话框 -->
    <el-dialog v-model="showMessageDialog" title="留言给商家" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom:16px">
        <template #default>留言内容将经平台审核后推送给商家。请勿在留言中填写手机号、微信号等联系方式，违规内容将被屏蔽。</template>
      </el-alert>
      <el-form label-position="top">
        <el-form-item label="留言内容" required>
          <el-input v-model="messageContent" type="textarea" :rows="4" :maxlength="300" show-word-limit placeholder="请描述您的社区情况和合作意向，系统将推送给商家..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMessageDialog = false">取消</el-button>
        <el-button type="primary" @click="submitMessage">发送留言</el-button>
      </template>
    </el-dialog>

    <!-- 商家信息详情弹窗 -->
    <el-dialog v-model="showFullMerchantDialog" :title="(resource?.company_name || '商家') + ' - 商家详细信息'" width="560px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商家名称">{{ resource?.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="行业分类">{{ resource?.industry || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="memberLevelTagType" size="small">{{ memberLevelName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平台评级">
          <span class="star-rating-text">{{ resource?.star_rating || 0 }}星</span>
        </el-descriptions-item>
        <el-descriptions-item label="联系人"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
        <el-descriptions-item label="联系电话"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
        <el-descriptions-item label="商家简介" :span="2">{{ resource?.merchant_description || '暂无简介' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showFullMerchantDialog = false">关闭</el-button>
        <el-button type="primary" @click="showFullMerchantDialog=false; leaveMessage()">立即留言</el-button>
      </template>
    </el-dialog>

    <!-- 智能客服弹窗 -->
    <el-dialog v-model="showServiceDialog" title="智能客服" width="520px" :close-on-click-modal="false">
      <div class="service-dialog">
        <div class="service-welcome">
          <div class="service-avatar">
            <el-avatar :size="48" src="https://cdn-icons-png.flaticon.com/512/3649/3649339.png" />
          </div>
          <div class="welcome-bubble">
            <p>您好！我是邻盟智能客服助手 👋</p>
            <p>请问有什么可以帮您？</p>
          </div>
        </div>

        <!-- 常见问题快捷入口 -->
        <div class="quick-questions" v-if="serviceMessages.length === 0">
          <p class="quick-title">您可以尝试：</p>
          <div class="quick-btns">
            <el-button v-for="q in quickQuestions" :key="q" size="small" @click="askQuestion(q)" text>{{ q }}</el-button>
          </div>
        </div>

        <!-- 对话列表 -->
        <div class="service-messages" v-else>
          <div v-for="(msg, idx) in serviceMessages" :key="idx" :class="['message-item', msg.type]">
            <div class="message-avatar" v-if="msg.type === 'robot'">
              <el-avatar :size="32" src="https://cdn-icons-png.flaticon.com/512/3649/3649339.png" />
            </div>
            <div class="message-bubble">
              <div class="message-content" v-html="msg.content"></div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>
        </div>

        <!-- FAQ列表 -->
        <div class="faq-list" v-if="showFaq">
          <h4>相关问题：</h4>
          <div v-for="(faq, idx) in currentFaqs" :key="idx" class="faq-item" @click="askQuestion(faq.q)">
            <span class="faq-q">Q: {{ faq.q }}</span>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="service-input">
          <el-input
            v-model="serviceInput"
            placeholder="输入您的问题..."
            @keyup.enter="sendServiceMessage"
          >
            <template #append>
              <el-button @click="sendServiceMessage" :disabled="!serviceInput.trim()">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getResourceDetail, getResourceComments, createResourceComment, getMerchantDetail } from '@/api/community'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const resource = ref(null)
const commentText = ref('')
const messageContent = ref('')
const showMessageDialog = ref(false)
const showFullMerchantDialog = ref(false)
const showServiceDialog = ref(false)
const commentLoading = ref(false)
const comments = ref([])

// 智能客服相关
const serviceInput = ref('')
const serviceMessages = ref([])
const showFaq = ref(false)
const currentFaqs = ref([])

// 快捷问题
const quickQuestions = [
  '如何发布资源？',
  '会员等级有什么区别？',
  '如何联系商家？',
  '撮合奖励是什么？'
]

// FAQ资料库
const faqDatabase = [
  { q: '如何发布资源？', a: '登录商家端后，进入"发布资源"页面，填写资源类型、内容、期望回报等信息即可发布。发布后需平台审核通过才能展示。' },
  { q: '会员等级有什么区别？', a: '邻盟平台分为：免费试用（3个月）、普通会员、银牌会员（12个月）、金牌会员（12个月）、铂金会员（12个月）、钻石会员（12个月）。等级越高，享有的权益越多，如查看联系方式、优先推荐等。' },
  { q: '如何联系商家？', a: '金牌会员及以上可查看商家联系方式。其他会员可通过"留言咨询"功能向商家发送合作意向，平台审核后推送给商家。' },
  { q: '撮合奖励是什么？', a: '当社区发布的需求与商家资源成功对接时，双方可获得撮合奖励。商家提供物资支持，社区贡献方贡献对接服务，共同推进社区活动落地。' },
  { q: '资源审核需要多久？', a: '资源审核通常在1-2个工作日内完成。如需加急，请联系平台客服。' },
  { q: '如何升级会员？', a: '登录商家端后，进入"会员中心"页面，选择您想要的会员等级进行购买支付即可。' },
  { q: '已发布资源如何修改？', a: '登录商家端后，进入"我的资源"，找到对应资源点击"编辑"即可修改。修改后需重新审核。' },
  { q: '如何成为社区合作伙伴？', a: '您可以查看社区发布的各类需求，通过"留言咨询"功能表达合作意向，或直接联系平台客服了解更多合作方式。' }
]

function askQuestion(question) {
  // 添加用户消息
  serviceMessages.value.push({
    type: 'user',
    content: question,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })

  // 查找匹配的FAQ
  const matchedFaq = faqDatabase.find(f => question.includes(f.q) || f.q.includes(question))
  if (matchedFaq) {
    setTimeout(() => {
      serviceMessages.value.push({
        type: 'robot',
        content: matchedFaq.a,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
    }, 500)
  } else {
    // 智能回复
    setTimeout(() => {
      serviceMessages.value.push({
        type: 'robot',
        content: '感谢您的提问！您可以：<br>1. 拨打客服热线：400-888-8888<br>2. 发送邮件至：12494789@qq.com<br>3. 继续描述您的问题，我会尽力帮助您~',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
    }, 500)
  }
}

function sendServiceMessage() {
  if (!serviceInput.value.trim()) return
  const q = serviceInput.value.trim()
  serviceInput.value = ''
  askQuestion(q)
}

// 会员等级名称映射（从API动态加载）
const memberLevelMapData = ref({})
const memberLevelMap = computed(() => memberLevelMapData.value)
const memberLevelTagTypeMap = { 0: 'info', 1: '', 2: 'warning', 3: 'danger', 4: 'danger', 5: 'danger' }

// 资源类型映射（从API动态加载）
const resourceTypeMap = ref({})
const getResourceTypeName = (type) => {
  if (type === null || type === undefined || type === '') return '其他'
  if (typeof type === 'string' && resourceTypeMap.value[type] !== undefined) {
    return resourceTypeMap.value[type]
  }
  const n = parseInt(type)
  if (!isNaN(n) && resourceTypeMap.value[n] !== undefined) {
    return resourceTypeMap.value[n]
  }
  if (typeof type === 'string') {
    return type
  }
  return '其他'
}

// 加载资源类型和会员等级配置
async function loadResourceTypes() {
  try {
    const { getPublishTypes } = await import('@/api/community')
    const res = await getPublishTypes()
    // 资源类型
    if (res.data?.resource_types?.length) {
      const map = {}
      res.data.resource_types.forEach((name, idx) => {
        map[idx] = name
        map[name] = name
      })
      resourceTypeMap.value = map
    }
    // 会员等级
    if (res.data?.member_levels?.length) {
      const map = {}
      res.data.member_levels.forEach(item => {
        map[item.level] = item.name
      })
      memberLevelMapData.value = map
    }
  } catch {}
}

const memberLevelName = computed(() => memberLevelMap[resource.value?.member_level] || '普通会员')
const memberLevelTagType = computed(() => memberLevelTagTypeMap[resource.value?.member_level] || 'info')

// 解析产品/服务介绍
const merchantProducts = computed(() => {
  const images = resource.value?.merchant_images
  if (!images) return []
  if (Array.isArray(images)) {
    if (images.length > 0 && typeof images[0] === 'object') return images.filter(p => p.image || p.title || p.description)
    return images.filter(Boolean).map(img => ({ image: img, title: '', description: '' }))
  }
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object') return parsed.filter(p => p.image || p.title || p.description)
        return parsed.filter(Boolean).map(img => ({ image: img, title: '', description: '' }))
      }
    } catch {}
    return images.split(',').filter(Boolean).map(img => ({ image: img.trim(), title: '', description: '' }))
  }
  return []
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadResource() {
  loading.value = true
  try {
    const merchantId = route.params.id
    // 获取商家详情
    const merchantRes = await getMerchantDetail(merchantId)
    resource.value = merchantRes.data
  } catch (e) {
    resource.value = null
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  // 商家详情页不加载资源留言
  comments.value = []
}

function submitComment() {
  // 商家详情页不支持留言
  ElMessage.info('商家详情页暂不支持留言功能')
}

function leaveMessage() {
  messageContent.value = ''
  showMessageDialog.value = true
}

function contactService() {
  // 打开智能客服对话框
  showServiceDialog.value = true
}

function submitMessage() {
  if (!messageContent.value.trim()) {
    ElMessage.warning('请填写留言内容')
    return
  }
  showMessageDialog.value = false
  ElMessage.success('留言已发送，平台审核后将推送给商家，请留意回复通知')
}

function showMerchantInfoDialog() {
  showFullMerchantDialog.value = true
}

onMounted(() => {
  loadResource()
  loadComments()
  loadResourceTypes()
})
</script>

<style scoped>
.merchant-detail { max-width: 1200px; margin: 0 auto; padding: 20px; }
.page-header { margin-bottom: 20px; }
.detail-layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
.main-content, .side-content { display: flex; flex-direction: column; gap: 16px; }
.merchant-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.merchant-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 8px; }
.merchant-logo { flex-shrink: 0; }
.logo-img { width: 100px; height: 100px; border-radius: 12px; object-fit: cover; background: #f0f2f5; }
.merchant-info { flex: 1; }
.merchant-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.match-hearts { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
.heart { font-size: 16px; color: #dcdfe6; }
.heart.filled { color: #f56c6c; }
.merchant-name { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
.merchant-rating { display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 14px; }
.rating-label { color: #909399; }
.star-rating-text { color: #f5a623; font-weight: 600; }
.match-text { margin-left: 8px; color: #909399; font-size: 12px; }
.merchant-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.section { margin-top: 24px; }
.section h3 { font-size: 16px; font-weight: 700; color: #303133; margin-bottom: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.description { color: #606266; line-height: 1.8; font-size: 14px; }
.reward-block { background: #fffbf0; border-left: 3px solid #E6A23C; padding: 14px; border-radius: 4px; }
.reward-block p { margin: 0; color: #606266; line-height: 1.8; }
.comment-input { margin-bottom: 20px; }
.comment-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.comment-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.commenter-name { font-weight: 600; font-size: 14px; }
.comment-time { font-size: 12px; color: #909399; }
.comment-text { font-size: 14px; color: #303133; }
.comment-replies { margin-top: 8px; background: #f5f7fa; border-radius: 6px; padding: 8px 12px; }
.reply-item { font-size: 13px; color: #606266; }
.action-card, .info-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.match-score { text-align: center; margin-bottom: 12px; }
.hearts { font-size: 18px; }
.score-label { font-size: 12px; color: #909399; margin-top: 4px; }
.action-btns { display: flex; gap: 10px; }
.action-btns .el-button { flex: 1; padding: 10px 12px; font-size: 13px; }
.info-card h4 { margin: 0 0 12px; font-size: 14px; }

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; gap: 12px; }
  .merchant-header { flex-direction: column; align-items: center; text-align: center; }
  .info-grid { grid-template-columns: 1fr; }
  .merchant-meta { justify-content: center; flex-wrap: wrap; }
  .match-hearts { justify-content: center; }
  .action-btns { flex-wrap: wrap; }
  .action-btns .el-button { flex: 1; min-width: 80px; font-size: 12px; }
}
.products-showcase { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.product-card { background: #f9f9f9; border-radius: 8px; overflow: hidden; }
.product-info { padding: 12px; }
.product-info h4 { margin: 0 0 8px; font-size: 14px; color: #303133; }
.product-info p { margin: 0; font-size: 13px; color: #606266; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

/* 智能客服样式 */
.service-dialog { min-height: 400px; display: flex; flex-direction: column; }
.service-welcome { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 12px; }
.welcome-bubble p { margin: 0 0 4px; font-size: 14px; color: #303133; }
.quick-questions { margin-bottom: 16px; }
.quick-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.quick-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.service-messages { flex: 1; overflow-y: auto; max-height: 280px; margin-bottom: 16px; }
.message-item { display: flex; gap: 8px; margin-bottom: 12px; }
.message-item.robot { flex-direction: row; }
.message-item.user { flex-direction: row-reverse; }
.message-bubble { max-width: 75%; }
.message-content { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
.message-item.robot .message-content { background: #f5f7fa; color: #303133; }
.message-item.user .message-content { background: #409EFF; color: #fff; }
.message-time { font-size: 11px; color: #909399; margin-top: 4px; text-align: right; }
.faq-list { margin-bottom: 16px; padding: 12px; background: #fffbf0; border-radius: 8px; }
.faq-list h4 { margin: 0 0 8px; font-size: 13px; color: #E6A23C; }
.faq-item { padding: 8px 12px; cursor: pointer; font-size: 13px; color: #606266; border-radius: 4px; }
.faq-item:hover { background: #fdf6ec; color: #E6A23C; }
.service-input { border-top: 1px solid #ebeef5; padding-top: 12px; }
</style>
