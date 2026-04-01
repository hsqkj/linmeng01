<template>
  <div class="page">
    <div class="page-header">
      <h2>社区需求</h2>
      <span style="color:#909399;font-size:13px">为您智能推荐与业务最匹配的社区需求</span>
    </div>

    <!-- 搜索与筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索需求名称/活动描述" style="width:240px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.district" placeholder="按区/街道" style="width:140px" clearable>
        <el-option label="全部地区" value="" />
        <el-option label="浦东新区-花木街道" value="花木街道" />
        <el-option label="浦东新区-张江镇" value="张江镇" />
        <el-option label="浦东新区-陆家嘴" value="陆家嘴街道" />
      </el-select>
      <el-select v-model="filters.type" placeholder="需求类型" style="width:130px" clearable>
        <el-option label="全部类型" value="" />
        <el-option label="活动赞助" value="活动赞助" />
        <el-option label="专家服务" value="专家服务" />
        <el-option label="空间运营" value="空间运营" />
      </el-select>
      <el-select v-model="filters.targetGroup" placeholder="目标人群" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="g in targetGroups" :key="g" :label="g" :value="g" />
      </el-select>
      <el-select v-model="filters.sortBy" placeholder="排序" style="width:130px">
        <el-option label="匹配度优先" value="match" />
        <el-option label="最新发布" value="newest" />
        <el-option label="活动时间最近" value="time" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 需求列表 -->
    <div class="demand-list">
      <el-card v-for="demand in demands" :key="demand.id" shadow="hover" class="demand-card" @click="viewDetail(demand)">
        <div class="card-header">
          <div class="match-score">
            <span v-for="n in 5" :key="n" class="heart" :class="{filled: n <= demand.matchScore}">♥</span>
            <span class="score-pct">{{ demand.matchScore * 20 }}%匹配</span>
          </div>
          <el-tag size="small" :type="typeColors[demand.type]">{{ demand.type }}</el-tag>
        </div>
        <h4 class="demand-title">{{ demand.title }}</h4>
        <div class="demand-meta">
          <el-icon :size="13" style="color:#909399"><Location /></el-icon>
          <span>{{ demand.community }}</span>
          <span class="divider">|</span>
          <el-icon :size="13" style="color:#909399"><Calendar /></el-icon>
          <span>{{ demand.activityTime }}</span>
        </div>
        <div class="demand-tags">
          <el-tag v-for="g in demand.targetGroups" :key="g" size="small" type="info" style="margin:2px">{{ g }}</el-tag>
        </div>
        <div class="demand-footer">
          <div class="sponsor-types">
            <span style="font-size:12px;color:#909399">所需：</span>
            <el-tag v-for="s in demand.sponsorTypes" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
          </div>
          <el-button type="primary" size="small" @click.stop="viewDetail(demand)">查看详情</el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="demands.length" :page-size="9" />
    </div>

    <!-- 需求详情弹窗 -->
    <el-dialog v-model="showDetail" title="需求详情" width="780px" v-if="currentDemand">
      <div class="detail-top">
        <div class="match-area">
          <span v-for="n in 5" :key="n" class="heart-lg" :class="{filled: n <= currentDemand.matchScore}">♥</span>
          <span class="match-pct">匹配度 {{ currentDemand.matchScore * 20 }}%</span>
        </div>
        <el-tag :type="typeColors[currentDemand.type]">{{ currentDemand.type }}</el-tag>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="需求名称" :span="2"><strong>{{ currentDemand.title }}</strong></el-descriptions-item>
        <el-descriptions-item label="发布社区">{{ currentDemand.community }}</el-descriptions-item>
        <el-descriptions-item label="所属街道">{{ currentDemand.district }}</el-descriptions-item>
        <el-descriptions-item label="活动时间" :span="2">{{ currentDemand.activityTime }}</el-descriptions-item>
        <el-descriptions-item label="活动地点">{{ currentDemand.location }}</el-descriptions-item>
        <el-descriptions-item label="预计参与人数">{{ currentDemand.audience }}人</el-descriptions-item>
        <el-descriptions-item label="目标人群" :span="2">
          <el-tag v-for="g in currentDemand.targetGroups" :key="g" size="small" type="info" style="margin:2px">{{ g }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所需赞助类型" :span="2">
          <el-tag v-for="s in currentDemand.sponsorTypes" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商家可获回报" :span="2">
          <div style="color:#E6A23C;font-weight:500">{{ currentDemand.merchantReward }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">{{ currentDemand.desc }}</el-descriptions-item>
      </el-descriptions>

      <!-- 联系方式（金牌会员始终可见） -->
      <div class="contact-section" style="margin-top:16px">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="社区联系人">{{ currentDemand.contact || '张主任' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentDemand.phone || '138-1234-5678' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 留言区 -->
      <div class="comment-section" style="margin-top:20px">
        <div style="font-weight:600;margin-bottom:10px;font-size:15px">留言区（{{ comments.length }}条）</div>
        <div class="comment-tip">
          <el-icon color="#E6A23C"><Warning /></el-icon>
          留言内容不允许填写手机号、微信号等联系方式，违规内容将被平台屏蔽
        </div>
        <div v-for="c in comments" :key="c.id" class="comment-item">
          <div class="comment-header">
            <span class="commenter">{{ c.commenter }}</span>
            <el-tag :type="c.commenterType==='商家'?'success':'primary'" size="small">{{ c.commenterType }}</el-tag>
            <span class="comment-time">{{ c.time }}</span>
          </div>
          <div class="comment-content">{{ c.content }}</div>
          <div v-if="c.reply" class="comment-reply">
            <span class="reply-by">{{ c.replyBy }} 回复：</span>{{ c.reply }}
          </div>
        </div>

        <!-- 发表留言 -->
        <div class="new-comment">
          <el-input v-model="newComment" type="textarea" :rows="3" placeholder="写下您的留言... （请勿填写手机号、微信号等联系方式）" :maxlength="300" show-word-limit />
          <el-button type="primary" style="margin-top:8px" @click="submitComment">发送留言</el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="success" @click="expressIntent">表达合作意向</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Location, Calendar, Warning } from '@element-plus/icons-vue'

const showDetail = ref(false)
const currentDemand = ref(null), newComment = ref('')

const filters = reactive({ keyword: '', district: '', type: '', targetGroup: '', sortBy: 'match' })
const targetGroups = ['亲子家庭', '老年群体', '青少年', '上班族', '残障人士', '低收入群体', '外来人口', '妇女群体', '全龄段']
const typeColors = { '活动赞助': 'primary', '专家服务': 'success', '空间运营': 'warning' }

const demands = reactive([
  {
    id: 1, title: '六一儿童节亲子嘉年华赞助', type: '活动赞助', community: '阳光花园社区', district: '花木街道',
    matchScore: 5, activityTime: '2026-06-01 09:00~17:00', location: '室外·南门广场', audience: 800,
    targetGroups: ['亲子家庭', '青少年'], sponsorTypes: ['资金赞助', '物资提供'],
    merchantReward: '冠名权、现场展台2个、公众号推文3篇、社区LED广告屏1周',
    desc: '本次活动为社区年度亲子嘉年华，预计参与800+居民，诚邀企业赞助，品牌曝光机会丰富。',
    contact: '张主任', phone: '138-1234-5678'
  },
  {
    id: 2, title: '老年人心理健康公益讲座', type: '专家服务', community: '幸福里社区', district: '花木街道',
    matchScore: 4, activityTime: '2026-05-15 14:00~16:00', location: '室内·社区活动室', audience: 80,
    targetGroups: ['老年群体'], sponsorTypes: ['专业服务'],
    merchantReward: '展台1个、社区广播宣传、居民感谢卡名单',
    desc: '为老年居民提供心理健康知识讲座，需要专业心理咨询师支持。',
    contact: '李社工', phone: '139-5678-0000'
  },
  {
    id: 3, title: '社区广场社会化运营合作', type: '空间运营', community: '翠竹苑社区', district: '张江镇',
    matchScore: 3, activityTime: '长期合作，协商后定', location: '室外·中心广场（约400㎡）', audience: 200,
    targetGroups: ['全龄段'], sponsorTypes: ['人力支持', '技术支持'],
    merchantReward: '广场冠名权、展位优先使用权、社区推荐',
    desc: '寻求商家合作运营社区广场，开展文化、体育、商业等活动，长期合作机会。',
    contact: '王书记', phone: '135-9012-0000'
  },
  {
    id: 4, title: '端午节包粽子传统文化活动', type: '活动赞助', community: '幸福里社区', district: '花木街道',
    matchScore: 4, activityTime: '2026-05-28 09:00~12:00', location: '室内·多功能厅', audience: 150,
    targetGroups: ['亲子家庭', '老年群体', '全龄段'], sponsorTypes: ['物资提供'],
    merchantReward: '活动手册鸣谢、社区公众号图文报道',
    desc: '端午节传统文化活动，需粽叶、糯米等物资支持，可接受食品类企业赞助。',
    contact: '李社工', phone: '139-5678-0000'
  }
])

const comments = ref([
  { id: 1, commenter: '星巴克咖啡', commenterType: '商家', content: '我们非常感兴趣，可以提供资金和咖啡饮品支持，活动理念与我们品牌理念契合！', time: '2026-03-28 14:30', reply: '感谢关注，欢迎通过平台发起合作意向！', replyBy: '阳光花园社区' },
  { id: 2, commenter: '华润万家', commenterType: '商家', content: '可以提供物资支持，具体数量可以商议', time: '2026-03-30 10:00', reply: '', replyBy: '' }
])

function viewDetail(demand) {
  // 统一跳转到完整的需求详情页
  window.location.href = `/merchant/demands/${demand.id}`
}

function doSearch() { ElMessage.info('搜索已触发（演示版）') }
function resetFilters() { Object.assign(filters, { keyword: '', district: '', type: '', targetGroup: '', sortBy: 'match' }) }

function submitComment() {
  if (!newComment.value.trim()) { ElMessage.warning('请填写留言内容'); return }
  comments.value.push({
    id: Date.now(), commenter: '星巴克咖啡', commenterType: '商家',
    content: newComment.value, time: new Date().toLocaleString('zh-CN'), reply: '', replyBy: ''
  })
  newComment.value = ''
  ElMessage.success('留言已发送，等待平台审核后展示')
}

function expressIntent() {
  showDetail.value = false
  ElMessage.success('合作意向已发送给社区，请等待回复！')
}
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
.demand-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.demand-card { cursor: pointer; transition: transform 0.2s; }
.demand-card:hover { transform: translateY(-2px); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.match-score { display: flex; align-items: center; gap: 2px; }
.heart { color: #ddd; font-size: 14px; }
.heart.filled { color: #f56c6c; }
.score-pct { font-size: 12px; color: #f56c6c; font-weight: 600; margin-left: 4px; }
.demand-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
.demand-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; margin-bottom: 8px; flex-wrap: wrap; }
.divider { color: #ddd; }
.demand-tags { margin-bottom: 8px; }
.demand-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.sponsor-types { display: flex; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.detail-top { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.heart-lg { font-size: 22px; color: #ddd; }
.heart-lg.filled { color: #f56c6c; }
.match-pct { font-size: 14px; color: #f56c6c; font-weight: 600; margin-left: 6px; }
.comment-tip { background: #fff8e1; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #E6A23C; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.comment-item { border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
.comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.commenter { font-weight: 600; font-size: 14px; }
.comment-time { font-size: 12px; color: #909399; margin-left: auto; }
.comment-content { font-size: 14px; color: #303133; line-height: 1.6; }
.comment-reply { margin-top: 8px; background: #f5f7fa; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #606266; }
.reply-by { font-weight: 600; color: #409EFF; }
.new-comment { margin-top: 12px; }
</style>
