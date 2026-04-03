<template>
  <div class="merchant-detail">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回商家资源</el-button>
    </div>

    <div class="detail-layout">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <div class="merchant-card">
          <div class="merchant-header">
            <div class="merchant-logo">
              <img :src="currentMerchant.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentMerchant.name)}&background=4A90D9&color=fff&size=128`" class="logo-img" />
            </div>
            <div class="merchant-info">
              <div class="merchant-meta">
                <el-tag :type="levelTagType[currentMerchant.level] || 'info'" size="large">{{ currentMerchant.level }}</el-tag>
                <el-tag type="info" size="small">{{ currentMerchant.type }}</el-tag>
              </div>
              <h1 class="merchant-name">{{ currentMerchant.name }}</h1>
              <div class="merchant-rating">
                <span class="rating-label">商家评级：</span>
                <el-icon v-for="n in 5" :key="n" :class="['star-icon', { filled: n <= currentMerchant.starRating }]">
                  <StarFilled />
                </el-icon>
                <span class="rating-text">{{ currentMerchant.starRating || 0 }}星</span>
              </div>
              <div class="match-hearts">{{ '❤️'.repeat(currentMerchant.matchScore) }}{{ '🤍'.repeat(5 - currentMerchant.matchScore) }} <span class="match-text">与您匹配度 {{ currentMerchant.matchScore * 20 }}%</span></div>
              <div class="merchant-tags">
                <el-tag v-for="tag in currentMerchant.tags" :key="tag" size="small" effect="plain" style="margin:2px">{{ tag }}</el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 资源基本信息 -->
          <div class="section">
            <h3>📋 商家资源信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">资源类型</span>
                <span class="info-value"><el-tag size="small">{{ currentMerchant.resourceType }}</el-tag></span>
              </div>
              <div class="info-item">
                <span class="info-label">适合社区</span>
                <span class="info-value">{{ currentMerchant.suitableCommunity || '各类社区均可' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">有效期</span>
                <span class="info-value">{{ currentMerchant.validUntil }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">发布时间</span>
                <span class="info-value">{{ currentMerchant.publishTime }}</span>
              </div>
            </div>
          </div>

          <!-- 资源详情 -->
          <div class="section">
            <h3>📝 资源描述</h3>
            <p class="description">{{ currentMerchant.desc }}</p>
          </div>

          <!-- 可提供内容 -->
          <div class="section">
            <h3>🎯 可提供内容</h3>
            <div class="provide-block">
              <div class="provide-item" v-if="currentMerchant.provide">
                <div class="provide-icon">📦</div>
                <div class="provide-text">{{ currentMerchant.provide }}</div>
              </div>
              <div class="provide-item" v-if="currentMerchant.scale">
                <div class="provide-icon">📊</div>
                <div class="provide-text">{{ currentMerchant.scale }}</div>
              </div>
            </div>
          </div>

          <!-- 期望回报 -->
          <div class="section">
            <h3>🏆 期望回报</h3>
            <div class="reward-block">
              <p>{{ currentMerchant.reward || '面议' }}</p>
            </div>
          </div>

          <!-- 商家擅长领域 -->
          <div class="section">
            <h3>🏷️ 商家擅长领域</h3>
            <div class="tags-section">
              <el-tag v-for="tag in currentMerchant.tags" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
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
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：商家信息 + 操作 -->
      <div class="side-content">
        <!-- 操作卡 -->
        <div class="action-card">
          <div class="match-score">
            <div class="hearts">{{ '❤️'.repeat(currentMerchant.matchScore) }}{{ '🤍'.repeat(5 - currentMerchant.matchScore) }}</div>
            <div class="score-label">与您的匹配度 {{ currentMerchant.matchScore * 20 }}%</div>
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
            <el-descriptions-item label="商家名称">{{ currentMerchant.name }}</el-descriptions-item>
            <el-descriptions-item label="行业分类">{{ currentMerchant.type }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">
              <el-tag :type="levelTagType[currentMerchant.level] || 'info'" size="small">{{ currentMerchant.level }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="平台评级">
              <span class="inline-stars">
                <el-icon v-for="n in 5" :key="n" :class="['star-icon', 'small', { filled: n <= currentMerchant.starRating }]">
                  <StarFilled />
                </el-icon>
              </span>
              <span style="margin-left:4px;color:#909399">({{ currentMerchant.starRating || 0 }}星)</span>
            </el-descriptions-item>
            <el-descriptions-item label="联系人"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
            <el-descriptions-item label="联系电话"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
          </el-descriptions>
          <el-alert type="info" :closable="false" show-icon style="margin-top:12px">
            <template #default>留言内容将经平台审核后推送给商家。</template>
          </el-alert>
        </div>

        <!-- 相似资源推荐 -->
        <div class="similar-card">
          <h4>🔗 相似商家推荐</h4>
          <div class="similar-list">
            <div class="similar-item" v-for="s in similarMerchants.filter(m => m.id !== currentMerchant.id)" :key="s.id" @click="viewSimilar(s)">
              <div class="sim-logo">
                <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=4A90D9&color=fff&size=64`" />
              </div>
              <div class="sim-info">
                <div class="sim-name">{{ s.name }}</div>
                <div class="sim-meta">{{ s.type }} · {{ '❤️'.repeat(s.matchScore) }}{{ '🤍'.repeat(5 - s.matchScore) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
    <el-dialog v-model="showFullMerchantDialog" :title="currentMerchant.name + ' - 商家详细信息'" width="560px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商家名称">{{ currentMerchant.name }}</el-descriptions-item>
        <el-descriptions-item label="行业分类">{{ currentMerchant.type }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="levelTagType[currentMerchant.level] || 'info'" size="small">{{ currentMerchant.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平台评级">
          <span class="inline-stars">
            <el-icon v-for="n in 5" :key="n" :class="['star-icon', 'small', { filled: n <= currentMerchant.starRating }]">
              <StarFilled />
            </el-icon>
          </span>
          <span style="margin-left:4px;color:#909399">({{ currentMerchant.starRating || 0 }}星)</span>
        </el-descriptions-item>
        <el-descriptions-item label="联系人"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
        <el-descriptions-item label="联系电话"><el-link type="primary" @click="contactService">请联系平台客服</el-link></el-descriptions-item>
        <el-descriptions-item label="企业地址" :span="2">{{ currentMerchant.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="擅长领域" :span="2">
          <el-tag v-for="tag in currentMerchant.tags" :key="tag" size="small" style="margin:2px">{{ tag }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="简介" :span="2">{{ currentMerchant.intro || '暂无简介' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showFullMerchantDialog = false">关闭</el-button>
        <el-button type="primary" @click="showFullMerchantDialog=false; leaveMessage()">立即留言</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, StarFilled } from '@element-plus/icons-vue'
import { getResourceComments, createResourceComment } from '@/api/community'

const route = useRoute()
const router = useRouter()
const commentText = ref('')
const messageContent = ref('')
const showMessageDialog = ref(false)
const showFullMerchantDialog = ref(false)
const commentLoading = ref(false)

const levelTagType = {
  '普通会员': 'info',
  '银牌会员': '',
  '金牌会员': 'warning',
  '铂金会员': 'danger',
  '钻石会员': 'danger'
}

// 商家资源数据池
const merchantPool = {
  1: {
    id: 1, name: '星巴克咖啡', type: '茶艺咖啡', level: '金牌会员', starRating: 5, resourceType: '资金赞助',
    matchScore: 5, tags: ['社区建设', '志愿服务', '亲子活动', '文化活动'],
    desc: '专为亲子类、文化类社区活动提供资金支持，资金到位快，条件灵活。我们致力于为社区发展贡献力量，希望通过赞助活动建立与社区居民的情感连接。',
    provide: '活动资金支持1万~5万元，根据活动规模面议',
    scale: '覆盖武汉市多个区域门店，可调拨充足资源',
    reward: '冠名权、活动现场展台2个、公众号推文2篇',
    suitableCommunity: '亲子型、文化型社区',
    validUntil: '2026-12-31', publishTime: '2026-03-15',
    contact: '张店长', phone: '138-8888-0001',
    address: '武汉市东湖新技术开发区光谷大道888号',
    intro: '星巴克咖啡致力于成为社区的一部分，通过支持社区活动建立与居民的情感连接。'
  },
  2: {
    id: 2, name: '新东方教育', type: '教育培训', level: '铂金会员', starRating: 5, resourceType: '专业服务',
    matchScore: 4, tags: ['教育培训', '亲子家庭', '公益讲座', '儿童活动'],
    desc: '提供专业讲师进社区，开展亲子教育主题公益讲座，内容可定制。我们的讲师团队专业、亲和力强，深受家长和孩子喜爱。',
    provide: '1~2名专职讲师，每场2小时，可连续举办3场',
    scale: '武汉校区拥有50+专业讲师团队',
    reward: '教育机构宣传展架1个，课程手册发放',
    suitableCommunity: '有幼儿园或小学的社区',
    validUntil: '2026-09-30', publishTime: '2026-03-10',
    contact: '李主任', phone: '139-8888-0002',
    address: '武汉市东湖新技术开发区关山大道500号',
    intro: '新东方教育集团专注教育培训30年，致力于为每一个家庭提供优质教育资源。'
  },
  3: {
    id: 3, name: '京东健康', type: '保健养生', level: '铂金会员', starRating: 4, resourceType: '专业服务',
    matchScore: 5, tags: ['医疗健康', '老年服务', '义诊', '健康讲座'],
    desc: '执业医师到社区开展义诊，提供血压血糖等免费检测，老年居民受益。我们的医疗团队专业、耐心，为社区居民提供便捷的健康服务。',
    provide: '2名执业医师+护士1名，检测设备自带，全程约4小时',
    scale: '全国知名医疗健康平台，专业资质齐全',
    reward: '健康品牌展示，社区公告栏宣传1个月',
    suitableCommunity: '老年群体占比较高的社区',
    validUntil: '2026-12-31', publishTime: '2026-02-28',
    contact: '王医生', phone: '136-8888-0003',
    address: '武汉市东湖新技术开发区光谷广场金融中心',
    intro: '京东健康是京东集团旗下专注于医疗健康业务的子集团，为用户提供便捷、专业的健康服务。'
  },
  4: {
    id: 4, name: '华润万家', type: '商超零售', level: '金牌会员', starRating: 4, resourceType: '物资提供',
    matchScore: 3, tags: ['社区建设', '节庆活动', '物资赞助', '扶贫帮困'],
    desc: '在春节、端午、中秋等传统节日提供食品物资等捐赠，最多2万元物资。我们的超市网络覆盖广泛，可以快速响应社区需求。',
    provide: '食品、生活物资等，约1~2万元，节前2周提前沟通',
    scale: '全国连锁超市，物资储备充足',
    reward: '超市优惠展位展示，社区广播宣传',
    suitableCommunity: '各类社区均可',
    validUntil: '2026-12-31', publishTime: '2026-03-01',
    contact: '陈总', phone: '135-8888-0004',
    address: '武汉市东湖新技术开发区光谷一路1000号',
    intro: '华润万家是华润集团旗下零售连锁企业，全国门店超过3000家，致力于为社区居民提供优质商品和服务。'
  },
  5: {
    id: 5, name: '中国移动', type: '电信服务', level: '钻石会员', starRating: 5, resourceType: '技术支持',
    matchScore: 4, tags: ['技术支持', '科技讲座', '智慧社区', '5G应用'],
    desc: '提供5G科技科普讲座和社区活动现场WiFi支持，展示智慧社区解决方案。作为国内领先的通信运营商，我们积极履行社会责任。',
    provide: '5G工程师讲座1场+现场WiFi布署支持',
    scale: '国内最大的通信运营商，技术实力雄厚',
    reward: '中国移动品牌展示区，宣传物料展放',
    suitableCommunity: '有科技创新需求的社区',
    validUntil: '2026-12-31', publishTime: '2026-02-20',
    contact: '刘总监', phone: '137-8888-0005',
    address: '武汉市东湖新技术开发区珞喻路1000号',
    intro: '中国移动是全球领先的通信运营商，积极参与智慧城市建设，为社区提供数字化支持。'
  },
  6: {
    id: 6, name: '平安保险', type: '银行保险', level: '银牌会员', starRating: 3, resourceType: '专业服务',
    matchScore: 3, tags: ['金融保险', '健康讲座', '老年服务', '风险保障'],
    desc: '专业理财顾问进社区，开展健康保障知识普及，为居民答疑解惑。我们的顾问团队专业、诚信，深受居民信赖。',
    provide: '2名专业顾问，公益讲座约2小时，资料免费派发',
    scale: '国内知名保险公司，服务网络覆盖广',
    reward: '展台1个，宣传册展架1个',
    suitableCommunity: '老年群体较多的社区',
    validUntil: '2026-10-31', publishTime: '2026-03-05',
    contact: '赵顾问', phone: '137-8888-0006',
    address: '武汉市东湖新技术开发区金融港金融城',
    intro: '平安保险是国内领先的综合性金融保险集团，致力于为社区居民提供全面的风险保障和理财服务。'
  }
}

const currentMerchant = ref(merchantPool[1])

onMounted(() => {
  const id = parseInt(route.params.id)
  if (merchantPool[id]) {
    currentMerchant.value = merchantPool[id]
  }
  loadComments() // 加载留言列表
})

// 留言数据（兼容API返回格式）
const comments = ref([])

const similarMerchants = [
  { id: 2, name: '新东方教育', type: '教育', matchScore: 4 },
  { id: 3, name: '京东健康', type: '医疗健康', matchScore: 5 },
  { id: 4, name: '华润万家', type: '零售', matchScore: 3 }
]

// 加载资源留言
async function loadComments() {
  try {
    const id = route.params.id
    const res = await getResourceComments(id)
    // API返回的是扁平结构，加工成前端需要的格式
    comments.value = (res.data || []).map(c => ({
      id: c.id,
      name: c.user_name || '社区用户',
      avatar: c.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || '社区')}&background=4A90D9&color=fff`,
      time: new Date(c.created_at).toLocaleString('zh-CN'),
      text: c.content,
      replies: []
    }))
  } catch (e) {
    console.error('加载留言失败', e)
  }
}

function submitComment() {
  if (!commentText.value.trim()) return
  commentLoading.value = true
  createResourceComment(route.params.id, { content: commentText.value })
    .then(() => {
      ElMessage.success('留言已发送')
      commentText.value = ''
      loadComments() // 刷新留言列表
    })
    .catch(() => {
      ElMessage.error('留言失败，请重试')
    })
    .finally(() => {
      commentLoading.value = false
    })
}

function leaveMessage() {
  messageContent.value = ''
  showMessageDialog.value = true
}

// 联系平台客服 - 跳转到留言咨询页
function contactService() {
  router.push('/community/messages')
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

function viewSimilar(merchant) {
  router.push(`/community/merchants/${merchant.id}`)
}
</script>

<style scoped>
.merchant-detail { max-width: 1200px; margin: 0 auto; padding: 20px; }
.page-header { margin-bottom: 20px; }
.detail-layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
.main-content, .side-content { display: flex; flex-direction: column; gap: 16px; }
.merchant-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.merchant-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 8px; }
.merchant-logo { flex-shrink: 0; }
.logo-img { width: 100px; height: 100px; border-radius: 12px; object-fit: cover; }
.merchant-info { flex: 1; }
.merchant-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.match-hearts { margin-left: auto; font-size: 18px; }
.merchant-name { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
.merchant-rating { display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 14px; }
.rating-label { color: #909399; }
.star-icon { font-size: 16px; color: #dcdfe6; }
.star-icon.filled { color: #f5a623; }
.star-icon.small { font-size: 13px; }
.rating-text { color: #606266; font-size: 13px; margin-left: 4px; }
.match-text { margin-left: 4px; color: #909399; font-size: 12px; }
.merchant-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.section { margin-top: 24px; }
.section h3 { font-size: 16px; font-weight: 700; color: #303133; margin-bottom: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.description { color: #606266; line-height: 1.8; font-size: 14px; }
.provide-block { background: #f0f9ff; border-radius: 8px; padding: 16px; }
.provide-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.provide-item:last-child { margin-bottom: 0; }
.provide-icon { font-size: 24px; }
.provide-text { font-size: 14px; color: #303133; line-height: 1.6; }
.reward-block { background: #fffbf0; border-left: 3px solid #E6A23C; padding: 14px; border-radius: 4px; }
.reward-block p { margin: 0; color: #606266; line-height: 1.8; }
.tags-section { display: flex; flex-wrap: wrap; }
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
.action-card, .info-card, .similar-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.match-score { text-align: center; margin-bottom: 16px; }
.hearts { font-size: 24px; }
.score-label { font-size: 13px; color: #909399; margin-top: 4px; }
.info-card h4, .similar-card h4 { margin: 0 0 16px; font-size: 15px; }
.similar-list { display: flex; flex-direction: column; gap: 10px; }
.similar-item { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.similar-item:hover { border-color: #409EFF; background: #f0f7ff; }
.sim-logo img { width: 40px; height: 40px; border-radius: 8px; }
.sim-name { font-size: 13px; font-weight: 500; }
.sim-meta { font-size: 12px; color: #909399; margin-top: 2px; }

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
  .merchant-header { flex-direction: column; align-items: center; text-align: center; }
  .info-grid { grid-template-columns: 1fr; }
  .merchant-meta { justify-content: center; flex-wrap: wrap; }
  .match-hearts { margin-left: 0; }
}
</style>
