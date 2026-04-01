<template>
  <div class="demand-detail">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回需求大厅</el-button>
    </div>

    <div class="detail-layout">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <div class="demand-card">
          <div class="demand-header">
            <div class="demand-meta">
              <el-tag type="primary" size="large" effect="dark">{{ currentDemand.type }}</el-tag>
              <el-tag type="info" size="small" style="margin-left:8px">{{ currentDemand.locationType === '室外' ? '🌳' : '🏠' }} {{ currentDemand.locationType }}活动</el-tag>
              <span class="match-hearts" title="匹配度">{{ '❤️'.repeat(currentDemand.matchScore) }}{{ '🤍'.repeat(5 - currentDemand.matchScore) }}</span>
            </div>
            <h1 class="demand-title">{{ currentDemand.title }}</h1>
            <div class="community-info">
              <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(currentDemand.community)}&background=4A90D9&color=fff`" class="community-avatar" />
              <div>
                <div class="community-name" style="cursor:pointer;color:#409EFF" @click="showCommunityDetail">{{ currentDemand.community }}</div>
                <div class="community-addr">{{ currentDemand.district }}</div>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 活动基本信息 -->
          <div class="section">
            <h3>📋 活动基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">活动类型</span>
                <span class="info-value">{{ currentDemand.type }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">目标对象</span>
                <span class="info-value">
                  <el-tag v-for="g in currentDemand.targetGroups" :key="g" size="small" type="warning" style="margin:2px">{{ g }}</el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">活动时间</span>
                <span class="info-value">{{ currentDemand.activityTime }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">活动地点</span>
                <span class="info-value">{{ currentDemand.locationType === '室外' ? '🌳' : '🏠' }} {{ currentDemand.location }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">预计参与</span>
                <span class="info-value">约 {{ currentDemand.audience }} 人</span>
              </div>
              <div class="info-item">
                <span class="info-label">截止日期</span>
                <span class="info-value deadline">{{ currentDemand.deadline }}</span>
              </div>
            </div>
          </div>

          <!-- 活动简介 -->
          <div class="section">
            <h3>📝 活动简介</h3>
            <p class="description">{{ currentDemand.desc }}</p>
          </div>

          <!-- 所需赞助 -->
          <div class="section">
            <h3>🎯 所需赞助</h3>
            <div class="sponsor-blocks">
              <div v-if="currentDemand.fundAmount" class="sponsor-block fund">
                <div class="sblock-title">💵 资金赞助</div>
                <div class="sblock-desc">所需金额：{{ currentDemand.fundAmount }}<br v-if="currentDemand.fundUsage">用途：{{ currentDemand.fundUsage }}</div>
              </div>
              <div v-if="currentDemand.goodsList" class="sponsor-block goods">
                <div class="sblock-title">📦 物资赞助</div>
                <div class="sblock-desc">{{ currentDemand.goodsList }}</div>
              </div>
              <div v-if="currentDemand.manpowerNeed" class="sponsor-block manpower">
                <div class="sblock-title">👥 人力支持</div>
                <div class="sblock-desc">{{ currentDemand.manpowerNeed }}</div>
              </div>
            </div>
          </div>

          <!-- 商家回报 - 重点展示 -->
          <div class="section reward-section">
            <h3>🏆 商家回报（赞助后您将获得）</h3>
            <div class="reward-grid">
              <div class="reward-item" v-for="r in currentDemand.rewards" :key="r.title">
                <div class="reward-icon">{{ r.icon }}</div>
                <div class="reward-text">
                  <div class="reward-title">{{ r.title }}</div>
                  <div class="reward-desc">{{ r.desc }}</div>
                </div>
              </div>
            </div>
            <div class="reward-value" v-if="currentDemand.merchantRewardDetail">
              <el-icon color="#E6A23C"><InfoFilled /></el-icon>
              <strong>回报价值说明：</strong>{{ currentDemand.merchantRewardDetail }}
            </div>
          </div>

          <!-- 活动图片 -->
          <div class="section">
            <h3>📸 往期活动图片</h3>
            <div class="activity-images">
              <div class="img-placeholder" v-for="i in (currentDemand.images || 4)" :key="i">
                <el-icon :size="40" color="#ccc"><Picture /></el-icon>
                <span>活动图片{{ i }}</span>
              </div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="section">
            <h3>🏷️ 需求标签</h3>
            <el-tag v-for="tag in currentDemand.tags" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
          </div>

          <!-- 留言区 -->
          <div class="section">
            <h3>💬 留言与咨询（{{ comments.length }}条）</h3>
            <div class="comment-input" id="comment-area">
              <el-input v-model="commentText" placeholder="有意向合作？可以在这里留言咨询..." type="textarea" :rows="3" />
              <el-button type="primary" @click="submitComment" style="margin-top:8px">发送留言</el-button>
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

      <!-- 右侧：社区信息 + 操作 -->
      <div class="side-content">
        <!-- 操作卡 -->
        <div class="action-card">
          <div class="match-score">
            <div class="hearts">{{ '❤️'.repeat(currentDemand.matchScore) }}{{ '🤍'.repeat(5 - currentDemand.matchScore) }}</div>
            <div class="score-label">与您的匹配度 {{ currentDemand.matchScore * 20 }}%</div>
          </div>
          <el-button type="primary" size="large" block @click="showIntentDialog = true" style="width:100%;margin-bottom:12px">
            🤝 我要提供赞助
          </el-button>
          <el-button size="large" block style="width:100%" @click="scrollToComment">
            💬 留言咨询
          </el-button>
          <div class="deadline-tip">
            <el-icon color="#F56C6C"><Warning /></el-icon>
            截止 {{ currentDemand.deadline }}，还有 <strong style="color:#F56C6C">{{ getDaysLeft(currentDemand.deadline) }}天</strong>
          </div>
        </div>

        <!-- 社区概况 -->
        <div class="community-card">
          <h4>🏘️ 社区概况</h4>
          <div class="community-stats">
            <div class="stat-item"><span class="stat-val">{{ currentDemand.communityStats?.households || 0 }}</span><span class="stat-lab">户数</span></div>
            <div class="stat-item"><span class="stat-val">{{ currentDemand.communityStats?.parentKid || '-' }}</span><span class="stat-lab">亲子家庭</span></div>
            <div class="stat-item"><span class="stat-val">{{ currentDemand.communityStats?.elder || '-' }}</span><span class="stat-lab">老年群体</span></div>
          </div>
          <div class="community-features">
            <el-tag v-for="f in (currentDemand.communityFeatures || [])" :key="f" size="small" type="info" effect="light" style="margin:3px">{{ f }}</el-tag>
          </div>
          <div class="contact-info">
            <div><el-icon><Phone /></el-icon> 联系人：{{ currentDemand.contact }}</div>
            <div><el-icon><Message /></el-icon> 合作请联系通过平台发起意向</div>
          </div>
        </div>

        <!-- 相似需求推荐 -->
        <div class="similar-card">
          <h4>🔗 相似需求推荐</h4>
          <div class="similar-list">
            <div class="similar-item" v-for="s in similarDemands.filter(d => d.id !== currentDemand.id)" :key="s.id" @click="$router.push('/merchant/demands/'+s.id)">
              <div class="sim-title">{{ s.title }}</div>
              <div class="sim-meta">{{ s.community }} · {{ '❤️'.repeat(s.matchScore) }}{{ '🤍'.repeat(5 - s.matchScore) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 社区详情弹窗 -->
    <el-dialog v-model="showCommunityDialog" title="社区基本信息" width="520px">
      <div class="community-detail-content" v-if="currentDemand">
        <div class="detail-header">
          <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(currentDemand.community)}&background=4A90D9&color=fff`" class="detail-avatar" />
          <div class="detail-info">
            <div class="detail-name">{{ currentDemand.community }}</div>
            <div class="detail-addr">{{ currentDemand.district }}</div>
          </div>
        </div>
        <el-divider />
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="户数规模">{{ currentDemand.communityStats?.households || '未知' }} 户</el-descriptions-item>
          <el-descriptions-item label="亲子家庭">{{ currentDemand.communityStats?.parentKid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="老年群体">{{ currentDemand.communityStats?.elder || '-' }}</el-descriptions-item>
          <el-descriptions-item label="活动类型">{{ currentDemand.locationType === '室外' ? '🌳 室外' : '🏠 室内' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-tags" style="margin-top:16px">
          <div style="font-weight:600;margin-bottom:8px">社区特点</div>
          <el-tag v-for="f in (currentDemand.communityFeatures || [])" :key="f" size="small" type="info" effect="light" style="margin:3px">{{ f }}</el-tag>
        </div>
        <div class="detail-tags" style="margin-top:16px">
          <div style="font-weight:600;margin-bottom:8px">需求标签</div>
          <el-tag v-for="tag in currentDemand.tags" :key="tag" size="small" type="primary" effect="light" style="margin:3px">{{ tag }}</el-tag>
        </div>
      </div>
    </el-dialog>

    <!-- 发起意向弹窗 -->
    <el-dialog v-model="showIntentDialog" title="发起赞助意向" width="500px">
      <el-form label-position="top">
        <el-form-item label="选择提供的赞助类型">
          <el-checkbox-group v-model="intentTypes">
            <el-checkbox label="fund">💵 资金赞助</el-checkbox>
            <el-checkbox label="goods">📦 物资提供</el-checkbox>
            <el-checkbox label="manpower">👥 人力支持</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="意向说明">
          <el-input v-model="intentDesc" type="textarea" :rows="4" placeholder="请简要说明您可以提供的资源规模和期望的合作形式..." />
        </el-form-item>
        <div style="color:#909399;font-size:12px">
          提交后，社区工作者将收到您的意向通知并决定是否接受。
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showIntentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitIntent">提交意向</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, InfoFilled, Picture, Warning, Lock, Phone, Message } from '@element-plus/icons-vue'

const route = useRoute()
const commentText = ref('')
const showIntentDialog = ref(false)
const showCommentInput = ref(false)
const showCommunityDialog = ref(false)
const intentTypes = ref([])
const intentDesc = ref('')
const isGoldMember = ref(true)

// 模拟需求数据池
const demandPool = {
  1: {
    id: 1, type: '活动赞助', locationType: '室外', title: '六一儿童节亲子嘉年华活动赞助',
    community: '光谷社区', district: '东湖新技术开发区 · 关东街道', matchScore: 5,
    activityTime: '2026-06-01 09:00 ~ 17:00', location: '社区南门广场', audience: 800, deadline: '2026-05-20',
    targetGroups: ['青少年/儿童', '亲子家庭', '全体居民'],
    desc: '本次活动为光谷社区年度最大亲子活动，将举办亲子游戏、儿童才艺表演、绘画展示等多个环节，预计吸引周边3个小区约800名居民参与。活动现场将搭建多个互动展区，为赞助商提供充足的品牌展示空间。社区公众号（粉丝5200人）将同步进行活动宣传和直播。',
    sponsorTypes: { fund: '资金赞助', goods: '物资赞助', manpower: '人力支持' },
    fundAmount: '¥ 20,000 ~ 50,000', fundUsage: '30%场地布置，40%活动物资，30%礼品采购',
    goodsList: '儿童礼品包300份、活动横幅5条（含制作）、气球装饰套装若干',
    manpowerNeed: '3名活动主持人（普通话标准）、2名摄影师，全天（9:00-18:00）',
    contact: '张主任', phone: '138-0000-1234',
    merchantReward: '冠名权、现场展台2个、公众号推文3篇、社区LED广告屏1周',
    merchantRewardDetail: '覆盖800+居民，8个业主群推送（共1200+成员），活动现场主入口横幅日均流量500人，公众号5200粉丝推文曝光',
    tags: ['亲子社区', '新建社区', '公共空间丰富', '商业密集', '科技社区'],
    images: 4, communityStats: { households: 1500, parentKid: '35%', elder: '28%' },
    communityFeatures: ['有户外广场', '有幼儿园/小学', '有商业体', '有公园', '社区商户80家'],
    rewards: [
      { icon: '🏅', title: '活动冠名权', desc: '冠名标识出现在所有活动物料和宣传中' },
      { icon: '🎪', title: '现场展台/展位', desc: '专属展台，与800+居民近距离互动' },
      { icon: '🎤', title: '主持人口播', desc: '全天活动中多次品牌口播宣传' },
      { icon: '📺', title: '背景板Logo展示', desc: '主舞台背景板品牌Logo展示' },
      { icon: '📣', title: '社区群推送', desc: '8个业主群，1200+成员群推宣传' },
      { icon: '🏆', title: '荣誉证书', desc: '颁发"爱心企业"荣誉证书' },
      { icon: '📰', title: '公众号推文', desc: '5200粉丝公众号活动报道' },
      { icon: '📌', title: '宣传栏展示', desc: '社区宣传栏品牌展示3个月' }
    ]
  },
  2: {
    id: 2, type: '专家服务', locationType: '室内', title: '老年人心理健康公益讲座',
    community: '佛祖岭社区', district: '东湖新技术开发区 · 佛祖岭街道', matchScore: 4,
    activityTime: '2026-05-15 14:00 ~ 16:00', location: '社区活动室', audience: 80, deadline: '2026-05-10',
    targetGroups: ['老年群体'],
    desc: '为老年居民提供心理健康知识讲座，需要专业心理咨询师支持。活动将邀请国家二级心理咨询师主讲，帮助老年人缓解焦虑、提升心理健康水平。',
    sponsorTypes: { manpower: '专业服务' },
    manpowerNeed: '2名心理咨询师，活动约2小时',
    contact: '李社工', phone: '139-5678-0000',
    merchantReward: '展台1个、社区广播宣传、居民感谢卡名单',
    merchantRewardDetail: '覆盖80名老年居民，社区广播全程宣传',
    tags: ['老年服务', '健康社区', '心理健康'],
    images: 3, communityStats: { households: 800, parentKid: '15%', elder: '45%' },
    communityFeatures: ['老年群体较多', '有活动室', '有社区卫生服务中心'],
    rewards: [
      { icon: '🎤', title: '主持人口播', desc: '活动现场品牌口播' },
      { icon: '📣', title: '社区广播', desc: '社区广播全程宣传' },
      { icon: '🏆', title: '荣誉证书', desc: '颁发"爱心企业"荣誉证书' },
      { icon: '📰', title: '公众号推文', desc: '1000+粉丝公众号报道' }
    ]
  },
  3: {
    id: 3, type: '空间运营', locationType: '室外', title: '社区广场社会化运营合作',
    community: '九峰社区', district: '东湖新技术开发区 · 九峰街道', matchScore: 3,
    activityTime: '长期合作，协商后定', location: '中心广场（约400㎡）', audience: 200, deadline: '2026-06-01',
    targetGroups: ['全龄段'],
    desc: '寻求商家合作运营社区广场，开展文化、体育、商业等活动，长期合作机会。广场位于社区中心位置，人流量大，适合各类品牌活动。',
    sponsorTypes: { manpower: '人力支持', fund: '技术支持' },
    contact: '王书记', phone: '135-9012-0000',
    merchantReward: '广场冠名权、展位优先使用权、社区推荐',
    merchantRewardDetail: '长期曝光，覆盖九峰社区全部2000户居民',
    tags: ['社区建设', '商业活跃', '全龄段'],
    images: 2, communityStats: { households: 1200, parentKid: '28%', elder: '20%' },
    communityFeatures: ['有400㎡广场', '居民参与度高', '商业配套完善'],
    rewards: [
      { icon: '🏅', title: '广场冠名权', desc: '长期冠名广场使用' },
      { icon: '🎪', title: '展位优先权', desc: '各类活动展位优先安排' },
      { icon: '🏆', title: '荣誉证书', desc: '颁发"社区共建单位"荣誉' }
    ]
  },
  4: {
    id: 4, type: '活动赞助', locationType: '室内', title: '端午节包粽子传统文化活动',
    community: '关南社区', district: '东湖新技术开发区 · 关东街道', matchScore: 4,
    activityTime: '2026-05-28 09:00 ~ 12:00', location: '多功能厅', audience: 150, deadline: '2026-05-15',
    targetGroups: ['亲子家庭', '老年群体', '全龄段'],
    desc: '端午节传统文化活动，需粽叶、糯米等物资支持，可接受食品类企业赞助。现场将组织包粽子比赛、传统文化展示等活动。',
    sponsorTypes: { goods: '物资提供' },
    goodsList: '粽叶、糯米、蜜枣、咸蛋等食材，500人份',
    contact: '李社工', phone: '139-5678-0000',
    merchantReward: '活动手册鸣谢、社区公众号图文报道',
    merchantRewardDetail: '150名居民参与，公众号800+粉丝推送',
    tags: ['文化活动', '节庆氛围', '亲子家庭'],
    images: 3, communityStats: { households: 800, parentKid: '15%', elder: '45%' },
    communityFeatures: ['有活动室', '传统文化氛围浓厚'],
    rewards: [
      { icon: '🏆', title: '荣誉证书', desc: '颁发"爱心企业"荣誉证书' },
      { icon: '📰', title: '公众号推文', desc: '800+粉丝公众号图文鸣谢' }
    ]
  }
}

const currentDemand = ref(demandPool[1])

onMounted(() => {
  const id = parseInt(route.params.id)
  if (demandPool[id]) {
    currentDemand.value = demandPool[id]
  }
})

const comments = ref([
  {
    id: 1,
    name: '星巴克咖啡（商家）',
    avatar: 'https://ui-avatars.com/api/?name=星巴克&background=00704a&color=fff',
    time: '2026-03-28 14:30',
    text: '我们对这个活动很感兴趣！可以提供资金5万元和品牌物料，请问场地大概有多大空间可以摆展台？',
    replies: [
      { id: 1, name: '阳光花园社区', text: '感谢关注！南门广场约2000平方米，可以为您安排15平米的品牌展台，随时欢迎来踩点！' }
    ]
  },
  {
    id: 2,
    name: '新东方教育（商家）',
    avatar: 'https://ui-avatars.com/api/?name=新东方&background=FF6B35&color=fff',
    time: '2026-03-29 10:15',
    text: '我们可以提供亲子教育互动区，免费体验编程课和绘本阅读，请问场地有电源接口吗？',
    replies: []
  }
])

function submitComment() {
  if (!commentText.value.trim()) return
  comments.value.push({
    id: Date.now(),
    name: '京东健康（您）',
    avatar: 'https://ui-avatars.com/api/?name=京东&background=E1251B&color=fff',
    time: '刚刚',
    text: commentText.value,
    replies: []
  })
  commentText.value = ''
  ElMessage.success('留言已发送')
}

function submitIntent() {
  showIntentDialog.value = false
  ElMessage.success('意向已发送！社区工作者将在24小时内回复')
}

function showCommunityDetail() {
  showCommunityDialog.value = true
}

function scrollToComment() {
  showCommentInput.value = true
  setTimeout(() => {
    document.querySelector('.comment-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.querySelector('.comment-input textarea')?.focus()
  }, 100)
}

function getDaysLeft(deadline) {
  const now = new Date('2026-04-01')
  const end = new Date(deadline)
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const similarDemands = [
  { id: 2, title: '端午节包粽子活动赞助', community: '幸福里社区', matchScore: 4 },
  { id: 3, title: '社区广场舞大赛赞助', community: '翠竹苑社区', matchScore: 3 },
  { id: 4, title: '重阳节老年健康活动', community: '阳光花园社区', matchScore: 5 }
]
</script>

<style scoped>
.demand-detail { max-width: 1200px; margin: 0 auto; padding: 20px; }
.page-header { margin-bottom: 20px; }
.detail-layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
.main-content, .side-content { display: flex; flex-direction: column; gap: 16px; }
.demand-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.demand-header { margin-bottom: 8px; }
.demand-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.match-hearts { margin-left: auto; font-size: 18px; }
.demand-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }
.community-info { display: flex; align-items: center; gap: 12px; }
.community-avatar { width: 44px; height: 44px; border-radius: 8px; }
.community-name { font-weight: 600; font-size: 15px; }
.community-addr { font-size: 13px; color: #909399; margin-top: 2px; }
.section { margin-top: 24px; }
.section h3 { font-size: 16px; font-weight: 700; color: #303133; margin-bottom: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.deadline { color: #F56C6C; font-weight: 500; }
.description { color: #606266; line-height: 1.8; font-size: 14px; }
.sponsor-blocks { display: flex; flex-direction: column; gap: 12px; }
.sponsor-block { border-radius: 8px; padding: 14px; }
.sponsor-block.fund { background: #fff5f5; border-left: 3px solid #F56C6C; }
.sponsor-block.goods { background: #fffbf0; border-left: 3px solid #E6A23C; }
.sponsor-block.manpower { background: #f0fff4; border-left: 3px solid #67C23A; }
.sblock-title { font-weight: 600; margin-bottom: 6px; }
.sblock-desc { font-size: 13px; color: #606266; line-height: 1.8; }
.reward-section { background: linear-gradient(135deg, #fff8e1, #fff); border-radius: 10px; padding: 20px; border: 1px solid #ffd04b; }
.reward-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.reward-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.reward-icon { font-size: 20px; }
.reward-title { font-weight: 600; font-size: 13px; }
.reward-desc { font-size: 12px; color: #909399; margin-top: 2px; }
.reward-value { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #E6A23C; background: #fff8dc; padding: 10px; border-radius: 8px; }
.activity-images { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.img-placeholder { background: #f5f7fa; border: 1px dashed #dcdfe6; border-radius: 8px; aspect-ratio: 4/3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #909399; font-size: 13px; }
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
.action-card, .community-card, .similar-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.match-score { text-align: center; margin-bottom: 16px; }
.hearts { font-size: 24px; }
.score-label { font-size: 13px; color: #909399; margin-top: 4px; }
.deadline-tip { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; margin-top: 12px; justify-content: center; }
.community-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.stat-item { text-align: center; }
.stat-val { display: block; font-size: 18px; font-weight: 700; color: #409EFF; }
.stat-lab { font-size: 12px; color: #909399; }
.community-card h4, .similar-card h4 { margin: 0 0 12px; font-size: 15px; }
.contact-info { margin-top: 8px; font-size: 14px; display: flex; flex-direction: column; gap: 6px; color: #303133; }
.similar-list { display: flex; flex-direction: column; gap: 10px; }
.similar-item { padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.similar-item:hover { border-color: #409EFF; background: #f0f7ff; }
.sim-title { font-size: 13px; font-weight: 500; }
.sim-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.community-detail-content { padding: 8px 0; }
.detail-header { display: flex; align-items: center; gap: 16px; }
.detail-avatar { width: 64px; height: 64px; border-radius: 12px; }
.detail-info { flex: 1; }
.detail-name { font-size: 20px; font-weight: 700; color: #1a1a2e; }
.detail-addr { font-size: 14px; color: #909399; margin-top: 4px; }
.detail-tags { display: flex; flex-wrap: wrap; align-items: center; }

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
  .reward-grid { grid-template-columns: 1fr; }
  .activity-images { grid-template-columns: repeat(2, 1fr); }
}
</style>
