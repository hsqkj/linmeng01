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
              <h1 class="merchant-name">
                <el-link type="primary" @click="showMerchantProfile" :underline="false">
                  {{ resource.title || resource.company_name || '资源名称' }}
                </el-link>
              </h1>
              <div class="merchant-rating">
                <span class="rating-label">商家评级：</span>
                <span class="star-rating-text">{{ resource.star_rating || 0 }}星</span>
              </div>
              <div class="match-hearts">
                <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= (resource.matchHearts || 0) }]">♥</span>
                <span class="match-text">与您匹配度 {{ (resource.matchScore || 0) * 20 }}%</span>
              </div>
              <div class="merchant-tags">
                <el-tag v-for="tag in resourceTagList" :key="tag" size="small" effect="plain" style="margin:2px">{{ tag }}</el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 期望回报（重点突出显示 - 置顶） -->
          <div class="section reward-section" v-if="expectedRewards.length || resource.expected_reward_desc">
            <h3>🎯 商家期望回报</h3>
            <div class="reward-highlight">
              <div class="reward-tags" v-if="expectedRewards.length">
                <el-tag v-for="reward in expectedRewards" :key="reward" type="warning" effect="dark" size="large" class="reward-tag">{{ reward }}</el-tag>
              </div>
              <div class="reward-desc" v-if="resource.expected_reward_desc">
                <p>{{ resource.expected_reward_desc }}</p>
              </div>
            </div>
          </div>

          <!-- 资源基本信息 - 按类型显示 -->
          <div class="section">
            <h3>📋 资源信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">资源类型</span>
                <span class="info-value"><el-tag size="small">{{ getResourceTypeName(resource.resource_type) }}</el-tag></span>
              </div>
              
              <!-- 专业服务(0) 专属字段 -->
              <template v-if="currentResourceType === 0">
                <div class="info-item" v-if="resource.professional_type">
                  <span class="info-label">专业服务类型</span>
                  <span class="info-value"><el-tag type="success" size="small">{{ resource.professional_type }}</el-tag></span>
                </div>
                <div class="info-item" v-if="resource.service_scope">
                  <span class="info-label">服务范围</span>
                  <span class="info-value">{{ getServiceScopeLabel(resource.service_scope) }}</span>
                </div>
                <div class="info-item" v-if="resource.certification">
                  <span class="info-label">资质证明</span>
                  <span class="info-value">{{ resource.certification }}</span>
                </div>
                <div class="info-item" v-if="resource.price_range">
                  <span class="info-label">收费标准</span>
                  <span class="info-value">{{ getPricingTypeLabel(resource.price_range) }}</span>
                </div>
              </template>
              
              <!-- 资金赞助(5) 专属字段 -->
              <template v-if="currentResourceType === 5">
                <div class="info-item" v-if="resource.min_amount > 0 || resource.max_amount > 0">
                  <span class="info-label">赞助金额范围</span>
                  <span class="info-value">{{ resource.min_amount || 0 }} ~ {{ resource.max_amount || 0 }} 元</span>
                </div>
                <div class="info-item" v-if="fundScenesList.length">
                  <span class="info-label">适用场景</span>
                  <span class="info-value">
                    <el-tag v-for="s in fundScenesList" :key="s" size="small" style="margin:2px">{{ getFundSceneLabel(s) }}</el-tag>
                  </span>
                </div>
              </template>
              
              <!-- 物资捐赠(3) 专属字段 -->
              <template v-if="currentResourceType === 3">
                <div class="info-item" v-if="resource.quantity">
                  <span class="info-label">物资数量</span>
                  <span class="info-value">{{ resource.quantity }}</span>
                </div>
                <div class="info-item" v-if="resource.pickup_way">
                  <span class="info-label">领取方式</span>
                  <span class="info-value">{{ {delivery:'可配送',pickup:'自取',both:'均可'}[resource.pickup_way] || resource.pickup_way }}</span>
                </div>
                <div class="info-item" v-if="resource.goods_expiry">
                  <span class="info-label">有效期至</span>
                  <span class="info-value">{{ resource.goods_expiry }}</span>
                </div>
              </template>
              
              <!-- 人力支持/志愿服务(4) 专属字段 -->
              <template v-if="currentResourceType === 4">
                <div class="info-item" v-if="resource.staff_count">
                  <span class="info-label">可派遣人数</span>
                  <span class="info-value">{{ resource.staff_count }}人</span>
                </div>
                <div class="info-item" v-if="resource.work_duration">
                  <span class="info-label">单次服务时长</span>
                  <span class="info-value">{{ resource.work_duration }}小时</span>
                </div>
              </template>
              
              <!-- 技术支持(6) 专属字段 -->
              <template v-if="currentResourceType === 6">
                <div class="info-item" v-if="techTypesList.length">
                  <span class="info-label">技术类型</span>
                  <span class="info-value">
                    <el-tag v-for="t in techTypesList" :key="t" size="small" style="margin:2px">{{ getTechTypeLabel(t) }}</el-tag>
                  </span>
                </div>
                <div class="info-item" v-if="resource.tech_service_type">
                  <span class="info-label">服务方式</span>
                  <span class="info-value">{{ getTechServiceTypeLabel(resource.tech_service_type) }}</span>
                </div>
              </template>
              
              <!-- 媒体报道(9) 专属字段 -->
              <template v-if="currentResourceType === 9">
                <div class="info-item" v-if="mediaChannelsList.length">
                  <span class="info-label">媒体渠道</span>
                  <span class="info-value">
                    <el-tag v-for="c in mediaChannelsList" :key="c" size="small" type="warning" style="margin:2px">{{ getMediaChannelLabel(c) }}</el-tag>
                  </span>
                </div>
                <div class="info-item" v-if="resource.media_type">
                  <span class="info-label">媒体类型</span>
                  <span class="info-value">{{ resource.media_type }}</span>
                </div>
                <div class="info-item" v-if="resource.coverage">
                  <span class="info-label">覆盖范围</span>
                  <span class="info-value">{{ resource.coverage }}</span>
                </div>
              </template>
              
              <!-- 所有类型都显示的基础信息 -->
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
              <!-- 商家地址 -->
              <div class="info-item" v-if="resource.address">
                <span class="info-label">商家地址</span>
                <span class="info-value">{{ resource.address }}</span>
              </div>
            </div>
          </div>

          <!-- 可提供内容 -->
          <div class="section">
            <h3>🎁 可提供内容</h3>
            <div class="provide-block">
              <p class="description">{{ resource.content || '暂无详细内容' }}</p>
            </div>
          </div>

          <!-- 资源图片 -->
          <div class="section" v-if="resourceImages.length">
            <h3>📷 资源图片</h3>
            <div class="image-gallery">
              <el-image 
                v-for="(img, idx) in resourceImages" 
                :key="idx"
                :src="img" 
                :preview-src-list="resourceImages"
                fit="cover"
                class="gallery-image"
              />
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

          <!-- 专家介绍 -->
          <div class="section" v-if="resource.expert_intro">
            <h3>👨‍💼 专家介绍</h3>
            <p class="description">{{ resource.expert_intro }}</p>
          </div>

          <!-- 商家图文 -->
          <div class="section" v-if="merchantImages.length">
            <h3>📸 商家图文</h3>
            <div class="image-gallery">
              <el-image 
                v-for="(img, idx) in merchantImages" 
                :key="idx"
                :src="img" 
                :preview-src-list="merchantImages"
                fit="cover"
                class="gallery-image"
              />
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
            <div class="score-label">与您的匹配度 {{ (resource.matchScore || 0) * 20 }}%</div>
          </div>
          <el-button type="primary" size="large" block @click="leaveMessage" style="width:100%;margin-bottom:12px">
            💬 留言咨询
          </el-button>
          <el-button size="large" block style="width:100%" @click="showMerchantInfoDialog">
            🏢 查看商家信息
          </el-button>
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
            <el-descriptions-item label="商家地址">{{ resource.address || '-' }}</el-descriptions-item>
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
      <div class="merchant-profile-header" v-if="merchantProfile?.logo">
        <img :src="merchantProfile.logo" class="merchant-profile-logo" />
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商家名称">{{ merchantProfile?.company_name || resource?.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="行业分类">{{ merchantProfile?.industry || resource?.industry || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="merchantProfile?.member_level ? memberLevelTagTypeMap[merchantProfile.member_level] : ''" size="small">
            {{ merchantProfile?.member_level ? memberLevelMap[merchantProfile.member_level] : memberLevelName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平台评级">
          <span class="star-rating-text">{{ merchantProfile?.star_rating || resource?.star_rating || 0 }}星</span>
        </el-descriptions-item>
        <el-descriptions-item label="商家地址" :span="2">{{ merchantProfile?.address || resource?.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商家简介" :span="2">{{ merchantProfile?.description || resource?.merchant_description || '暂无简介' }}</el-descriptions-item>
        <el-descriptions-item label="社会身份" :span="2">{{ merchantProfile?.social_identity || resource?.social_identity || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="资质荣誉" :span="2">{{ merchantProfile?.honors || resource?.honors || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="专家介绍" :span="2">{{ merchantProfile?.expert_intro || resource?.expert_intro || '暂无' }}</el-descriptions-item>
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
const merchantProfile = ref(null)
const merchantProfileLoading = ref(false)

// 智能客服相关
const serviceInput = ref('')
const serviceMessages = ref([])

// 快捷问题
const quickQuestions = [
  '如何发布资源？',
  '会员等级有什么区别？',
  '如何联系商家？',
  '撮合奖励是什么？'
]

// FAQ资料库
const faqDatabase = [
  { q: '如何发布资源？', a: '登录商家端后，进入"发布资源"页面，填写资源类型、内容等信息即可发布。发布后需平台审核通过才能展示。' },
  { q: '会员等级有什么区别？', a: '邻盟平台分为：免费试用（3个月）、普通会员、银牌会员（12个月）、金牌会员（12个月）、铂金会员（12个月）、钻石会员（12个月）。等级越高，享有的权益越多，如查看联系方式、优先推荐等。' },
  { q: '如何联系商家？', a: '金牌会员及以上可查看商家联系方式。其他会员可通过"留言咨询"功能向商家发送合作意向，平台审核后推送给商家。' },
  { q: '撮合奖励是什么？', a: '当社区发布的需求与商家资源成功对接时，双方可获得撮合奖励。' },
  { q: '资源审核需要多久？', a: '资源审核通常在1-2个工作日内完成。如需加急，请联系平台客服。' },
  { q: '如何升级会员？', a: '登录商家端后，进入"会员中心"页面，选择您想要的会员等级进行购买支付即可。' }
]

function askQuestion(question) {
  serviceMessages.value.push({
    type: 'user',
    content: question,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })

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
    setTimeout(() => {
      serviceMessages.value.push({
        type: 'robot',
        content: '感谢您的提问！您可以：<br>1. 拨打客服热线：400-888-8888<br>2. 发送邮件至：12494789@qq.com',
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

// 资源类型映射
const resourceTypeMap = {
  0: '专业服务', 1: '教育培训', 2: '场地资源', 3: '物资捐赠',
  4: '志愿服务', 5: '资金赞助', 6: '技术支持', 7: '健康医疗',
  8: '活动赞助', 9: '媒体宣传', 10: '技能培训', 11: '养老服务'
}

function getResourceTypeName(type) {
  if (resourceTypeMap[type] !== undefined) {
    return resourceTypeMap[type]
  }
  return resourceTypeMap[parseInt(type)] || '其他'
}

// 服务范围映射
const serviceScopeMap = {
  'city': '全市', 'district': '本区', 'street': '本街道', 'nationwide': '全国（线上）'
}
function getServiceScopeLabel(val) {
  return serviceScopeMap[val] || val || ''
}

// 收费标准映射
const pricingTypeMap = {
  'free': '免费（公益赞助）', 'discount': '优惠价（面议）', 'market': '市场价'
}
function getPricingTypeLabel(val) {
  return pricingTypeMap[val] || val || ''
}

// 技术类型映射
const techTypeMap = {
  'equipment': '设备器材', 'software': '软件系统', 'network': '网络通信',
  'av': '专业音视频', 'lighting': '灯光设备', 'smart': '智能设备'
}
function getTechTypeLabel(val) {
  return techTypeMap[val] || val || ''
}

// 技术服务方式映射
const techServiceTypeMap = {
  'rent': '设备租借', 'service': '提供服务团队', 'both': '均可'
}
function getTechServiceTypeLabel(val) {
  return techServiceTypeMap[val] || val || ''
}

// 媒体渠道映射
const mediaChannelMap = {
  'news': '新闻网站/APP', 'wechat': '微信公众号', 'video': '短视频（抖音/视频号）',
  'tv': '电视/广播', 'paper': '报纸'
}
function getMediaChannelLabel(val) {
  return mediaChannelMap[val] || val || ''
}

// 技术类型列表
const techTypesList = computed(() => {
  const types = resource.value?.tech_types
  if (!types) return []
  if (Array.isArray(types)) return types
  if (typeof types === 'string') {
    try { return JSON.parse(types) } catch { return [] }
  }
  return []
})

// 媒体渠道列表
const mediaChannelsList = computed(() => {
  const channels = resource.value?.media_channels
  if (!channels) return []
  if (Array.isArray(channels)) return channels
  if (typeof channels === 'string') {
    try { return JSON.parse(channels) } catch { return [] }
  }
  return []
})

// 适用场景列表
const fundScenesList = computed(() => {
  const scenes = resource.value?.fund_scenes
  if (!scenes) return []
  if (Array.isArray(scenes)) return scenes
  if (typeof scenes === 'string') {
    try { return JSON.parse(scenes) } catch { return [] }
  }
  return []
})

// 适用场景映射
const fundSceneMap = {
  'festival': '节庆活动', 'welfare': '公益活动', 'sports': '体育赛事',
  'education': '教育活动', 'culture': '文化活动', 'any': '不限场景'
}
function getFundSceneLabel(val) {
  return fundSceneMap[val] || val || ''
}

// 当前资源类型（数字）
const currentResourceType = computed(() => {
  const type = resource.value?.resource_type
  return typeof type === 'number' ? type : parseInt(type) || 0
})

// 会员等级映射
const memberLevelMap = { 0: '普通会员', 1: '银牌会员', 2: '金牌会员', 3: '铂金会员', 4: '钻石会员' }
const memberLevelTagTypeMap = { 0: 'info', 1: '', 2: 'warning', 3: 'danger', 4: 'danger' }

const memberLevelName = computed(() => memberLevelMap[resource.value?.member_level] || '普通会员')
const memberLevelTagType = computed(() => memberLevelTagTypeMap[resource.value?.member_level] || 'info')

// 标签列表
const resourceTagList = computed(() => {
  const tags = resource.value?.tags
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try { return JSON.parse(tags) } catch { return [] }
  }
  return []
})

// 资源图片
const resourceImages = computed(() => {
  const images = resource.value?.images
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return images.split(',').filter(Boolean)
    }
  }
  return []
})

// 期望回报标签
const expectedRewards = computed(() => {
  const rewards = resource.value?.expected_rewards
  if (!rewards) return []
  if (Array.isArray(rewards)) return rewards
  if (typeof rewards === 'string') {
    try {
      const parsed = JSON.parse(rewards)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
})

// 商家图文
const merchantImages = computed(() => {
  const images = resource.value?.merchant_images
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return images.split(',').filter(Boolean)
    }
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
    const res = await getResourceDetail(route.params.id)
    resource.value = res.data
  } catch (e) {
    resource.value = null
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  try {
    const res = await getResourceComments(route.params.id)
    comments.value = (res.data || []).map(c => ({
      id: c.id,
      name: c.user_name || '社区用户',
      avatar: c.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || '社区')}&background=4A90D9&color=fff`,
      time: new Date(c.created_at).toLocaleString('zh-CN'),
      text: c.content
    }))
  } catch (e) {
    comments.value = []
  }
}

function submitComment() {
  if (!commentText.value.trim()) return
  commentLoading.value = true
  createResourceComment(route.params.id, { content: commentText.value })
    .then(() => {
      ElMessage.success('留言已发送')
      commentText.value = ''
      loadComments()
    })
    .catch(() => ElMessage.error('留言失败，请重试'))
    .finally(() => { commentLoading.value = false })
}

function leaveMessage() {
  messageContent.value = ''
  showMessageDialog.value = true
}

function contactService() {
  showServiceDialog.value = true
}

function submitMessage() {
  if (!messageContent.value.trim()) {
    ElMessage.warning('请填写留言内容')
    return
  }
  showMessageDialog.value = false
  ElMessage.success('留言已发送，平台审核后将推送给商家')
}

function showMerchantInfoDialog() {
  showFullMerchantDialog.value = true
}

async function showMerchantProfile() {
  const merchantId = resource.value?.merchant_id
  if (!merchantId) return
  merchantProfileLoading.value = true
  try {
    const res = await getMerchantDetail(merchantId)
    merchantProfile.value = res.data
    showFullMerchantDialog.value = true
  } catch (e) {
    ElMessage.error('获取商家信息失败')
  } finally {
    merchantProfileLoading.value = false
  }
}

onMounted(() => {
  loadResource()
  loadComments()
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
.provide-block { background: #f0f9ff; border-radius: 8px; padding: 16px; border-left: 4px solid #409EFF; }
.reward-section { margin-top: 16px; margin-bottom: 20px; }
.reward-section h3 { color: #E6A23C; font-size: 18px; margin-bottom: 12px; }
.reward-highlight { 
  background: linear-gradient(135deg, #fff7e6, #fffbf0); 
  border: 3px solid #E6A23C; 
  border-radius: 16px; 
  padding: 24px; 
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}
.reward-tags { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; justify-content: center; }
.reward-tag { padding: 10px 20px; font-size: 16px; font-weight: 600; }
.reward-desc { 
  background: rgba(255,255,255,0.8); 
  border-radius: 8px; 
  padding: 16px; 
  text-align: center;
}
.reward-desc p { margin: 0; color: #606266; line-height: 1.8; font-size: 15px; }
.image-gallery { display: flex; flex-wrap: wrap; gap: 12px; }
.gallery-image { width: 150px; height: 150px; border-radius: 8px; cursor: pointer; }
.comment-input { margin-bottom: 20px; }
.comment-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.comment-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.commenter-name { font-weight: 600; font-size: 14px; }
.comment-time { font-size: 12px; color: #909399; }
.comment-text { font-size: 14px; color: #303133; }
.action-card, .info-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.match-score { text-align: center; margin-bottom: 16px; }
.hearts { font-size: 20px; }
.score-label { font-size: 13px; color: #909399; margin-top: 4px; }
.info-card h4 { margin: 0 0 16px; font-size: 15px; }

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
.service-input { border-top: 1px solid #ebeef5; padding-top: 12px; }
.merchant-profile-header { text-align: center; margin-bottom: 16px; }
.merchant-profile-logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #f0f0f0; }

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
  .merchant-header { flex-direction: column; align-items: center; text-align: center; }
  .info-grid { grid-template-columns: 1fr; }
  .merchant-meta { justify-content: center; flex-wrap: wrap; }
  .match-hearts { justify-content: center; }
}
</style>
