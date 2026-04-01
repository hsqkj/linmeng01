<template>
  <div class="page">
    <div class="page-header">
      <h2>商家资源</h2>
      <span style="color:#909399;font-size:13px">为您智能推荐最匹配的商家资源</span>
    </div>

    <!-- 搜索与筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索资源名称/商家名称" style="width:240px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.type" placeholder="资源类型" style="width:140px" clearable>
        <el-option label="全部类型" value="" />
        <el-option v-for="t in resourceTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filters.merchantType" placeholder="行业分类" style="width:140px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in merchantTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filters.level" placeholder="会员等级" style="width:130px" clearable>
        <el-option label="全部等级" value="" />
        <el-option v-for="l in memberLevels" :key="l" :label="l" :value="l" />
      </el-select>
      <el-select v-model="filters.matchOrder" placeholder="排序方式" style="width:130px">
        <el-option label="匹配度优先" value="match" />
        <el-option label="最新发布" value="newest" />
        <el-option label="等级优先" value="level" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 资源列表 -->
    <div class="resource-list">
      <el-card v-for="resource in resources" :key="resource.id" shadow="hover" class="resource-card" @click="viewDetail(resource)">
        <div class="card-header">
          <div class="rating-stars">
            <span v-for="n in 5" :key="n" class="star" :class="{filled: n <= resource.starRating}">★</span>
          </div>
          <div class="match-score">
            <span v-for="n in 5" :key="n" class="heart" :class="{filled: n <= resource.matchScore}">♥</span>
            <span class="score-pct">{{ resource.matchScore * 20 }}%</span>
          </div>
        </div>
        <h4 class="res-title">{{ resource.title }}</h4>
        <div class="res-meta">
          <el-tag size="small">{{ resource.type }}</el-tag>
          <span class="merchant-name" @click.stop="viewMerchantInfo(resource)">{{ resource.merchant }}</span>
          <span class="merchant-type">{{ resource.merchantType }}</span>
        </div>
        <p class="res-desc">{{ resource.desc }}</p>
        <div class="res-footer">
          <el-tag size="small" type="success">{{ resource.merchantLevel }}</el-tag>
          <el-button type="primary" size="small" @click.stop="viewDetail(resource)">查看详情</el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="resources.length" :page-size="9" />
    </div>

    <!-- 资源详情对话框 -->
    <el-dialog v-model="showDetail" title="商家资源详情" width="760px" v-if="currentResource">
      <div class="detail-top">
        <div class="detail-match">
          <span v-for="n in 5" :key="n" class="heart-lg" :class="{filled: n <= currentResource.matchScore}">♥</span>
          <span class="match-pct">匹配度 {{ currentResource.matchScore * 20 }}%</span>
        </div>
        <el-tag :type="levelTagType[currentResource.merchantLevel]">{{ currentResource.merchantLevel }}</el-tag>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="资源标题" :span="2">
          <strong>{{ currentResource.title }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="资源类型">
          <el-tag size="small">{{ currentResource.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布商家">{{ currentResource.merchant }}</el-descriptions-item>
        <el-descriptions-item label="商家类型">{{ currentResource.merchantType }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="levelTagType[currentResource.merchantLevel]" size="small">{{ currentResource.merchantLevel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源说明" :span="2">{{ currentResource.desc }}</el-descriptions-item>
        <el-descriptions-item label="可提供内容" :span="2">{{ currentResource.detail?.provide || '详见资源描述' }}</el-descriptions-item>
        <el-descriptions-item label="期望回报" :span="2">{{ currentResource.detail?.reward || '冠名权、展台位置' }}</el-descriptions-item>
        <el-descriptions-item label="有效期">{{ currentResource.validUntil }}</el-descriptions-item>
        <el-descriptions-item label="适合社区类型">{{ currentResource.detail?.suitableType || '亲子型、综合型社区' }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in (currentResource.tags||[])" :key="tag" size="small" style="margin:2px">{{ tag }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 商家基本信息（社区无等级限制，但不显示联系电话） -->
      <div class="contact-section">
        <el-descriptions :column="2" border title="商家基本信息">
          <el-descriptions-item label="联系人">{{ currentResource.detail?.contact || '张经理' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话"><span style="color:#909399">平台保护，联系需通过平台</span></el-descriptions-item>
          <el-descriptions-item label="企业地址" :span="2">{{ currentResource.detail?.address || '武汉市东湖新技术开发区' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="primary" @click="leaveMessage(currentResource)">留言咨询</el-button>
      </template>
    </el-dialog>

    <!-- 留言对话框 -->
    <el-dialog v-model="showMessage" title="留言给商家" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom:16px">
        <template #default>留言内容将经平台审核后推送给商家。请勿在留言中填写手机号、微信号等联系方式，违规内容将被屏蔽。</template>
      </el-alert>
      <el-form label-position="top">
        <el-form-item label="留言内容" required>
          <el-input v-model="messageContent" type="textarea" :rows="4" :maxlength="300" show-word-limit placeholder="请描述您的社区情况和合作意向，系统将推送给商家..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMessage = false">取消</el-button>
        <el-button type="primary" @click="submitMessage">发送留言</el-button>
      </template>
    </el-dialog>

    <!-- 商家基本信息弹窗 -->
    <el-dialog v-model="showMerchantInfo" :title="currentMerchantInfo?.merchant + ' - 商家基本信息'" width="560px">
      <el-descriptions :column="2" border v-if="currentMerchantInfo">
        <el-descriptions-item label="商家名称">{{ currentMerchantInfo.merchant }}</el-descriptions-item>
        <el-descriptions-item label="商家类型">{{ currentMerchantInfo.merchantType }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="levelTagType[currentMerchantInfo.merchantLevel]" size="small">{{ currentMerchantInfo.merchantLevel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentMerchantInfo.detail?.contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话"><span style="color:#909399">平台保护，联系需通过平台</span></el-descriptions-item>
        <el-descriptions-item label="企业地址" :span="2">{{ currentMerchantInfo.detail?.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="擅长领域" :span="2">
          <el-tag v-for="tag in (currentMerchantInfo.tags||[])" :key="tag" size="small" style="margin:2px">{{ tag }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showMerchantInfo = false">关闭</el-button>
        <el-button type="primary" @click="showMerchantInfo=false; showDetail=true; leaveMessage(currentResource)">立即留言</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const showDetail = ref(false), showMessage = ref(false), showMerchantInfo = ref(false)
const currentResource = ref(null), messageContent = ref(''), currentMerchantInfo = ref(null)

const filters = reactive({ keyword: '', type: '', merchantType: '', level: '', matchOrder: 'match' })
const resourceTypes = ['资金赞助', '物资提供', '人力支持', '技术支持', '专业服务', '媒体报道']
const merchantTypes = ['教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果', '美业', '保健养生', '体育健身', '银行保险', '电信服务', '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材', '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务', '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰', '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料', '办公用品', '设备租赁', '其他']
const memberLevels = ['普通会员', '银牌会员', '金牌会员', '铂金会员', '钻石会员']
const levelTagType = { '普通会员': 'info', '银牌会员': '', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }

const resources = reactive([
  {
    id: 1, title: '星巴克赞助活动资金最高5万元', type: '资金赞助', merchant: '星巴克咖啡', merchantType: '茶艺咖啡', merchantLevel: '金牌会员', starRating: 5, matchScore: 5,
    desc: '专为亲子类、文化类社区活动提供资金支持，资金到位快，条件灵活。', validUntil: '2026-12-31',
    tags: ['亲子活动', '文化活动', '资金赞助'],
    detail: { provide: '活动资金支持1万~5万元，根据活动规模面议', reward: '冠名权、活动现场展台2个、公众号推文2篇', suitableType: '亲子型、文化型社区', contact: '张店长', phone: '138-8888-0001', address: '武汉市东湖新技术开发区光谷大道888号' }
  },
  {
    id: 2, title: '新东方免费亲子教育公益讲座', type: '专业服务', merchant: '新东方教育', merchantType: '教育培训', merchantLevel: '铂金会员', starRating: 5, matchScore: 4,
    desc: '提供专业讲师进社区，开展亲子教育主题公益讲座，内容可定制。', validUntil: '2026-09-30',
    tags: ['教育培训', '亲子家庭', '公益讲座'],
    detail: { provide: '1~2名专职讲师，每场2小时，可连续举办3场', reward: '教育机构宣传展架1个，课程手册发放', suitableType: '有幼儿园或小学的社区', contact: '李主任', phone: '139-8888-0002', address: '武汉市东湖新技术开发区关山大道500号' }
  },
  {
    id: 3, title: '京东健康义诊进社区服务', type: '专业服务', merchant: '京东健康', merchantType: '保健养生', merchantLevel: '铂金会员', starRating: 4, matchScore: 5,
    desc: '执业医师到社区开展义诊，提供血压血糖等免费检测，老年居民受益。', validUntil: '2026-12-31',
    tags: ['医疗健康', '老年服务', '义诊'],
    detail: { provide: '2名执业医师+护士1名，检测设备自带，全程约4小时', reward: '健康品牌展示，社区公告栏宣传1个月', suitableType: '老年群体占比较高的社区', contact: '王医生', phone: '136-8888-0003', address: '武汉市东湖新技术开发区光谷广场金融中心' }
  },
  {
    id: 4, title: '华润万家节庆物资捐赠', type: '物资提供', merchant: '华润万家', merchantType: '商超零售', merchantLevel: '金牌会员', starRating: 4, matchScore: 3,
    desc: '在春节、端午、中秋等传统节日提供食品物资等捐赠，最多2万元物资。', validUntil: '2026-12-31',
    tags: ['物资赞助', '节庆活动'],
    detail: { provide: '食品、生活物资等，约1~2万元，节前2周提前沟通', reward: '超市优惠展位展示，社区广播宣传', suitableType: '各类社区均可', contact: '陈总', phone: '135-8888-0004', address: '武汉市东湖新技术开发区光谷一路1000号' }
  },
  {
    id: 5, title: '中国移动5G技术讲座+WiFi支持', type: '技术支持', merchant: '中国移动', merchantType: '电信服务', merchantLevel: '钻石会员', starRating: 5, matchScore: 4,
    desc: '提供5G科技科普讲座和社区活动现场WiFi支持，展示智慧社区解决方案。', validUntil: '2026-12-31',
    tags: ['技术支持', '科技讲座', '智慧社区'],
    detail: { provide: '5G工程师讲座1场+现场WiFi布署支持', reward: '中国移动品牌展示区，宣传物料展放', suitableType: '有科技创新需求的社区', contact: '刘总监', phone: '137-8888-0005', address: '武汉市东湖新技术开发区珞喻路1000号' }
  },
  {
    id: 6, title: '平安保险健康保障公益讲座', type: '专业服务', merchant: '平安保险', merchantType: '银行保险', merchantLevel: '银牌会员', starRating: 3, matchScore: 3,
    desc: '专业理财顾问进社区，开展健康保障知识普及，为居民答疑解惑。', validUntil: '2026-10-31',
    tags: ['金融保险', '健康讲座', '老年服务'],
    detail: { provide: '2名专业顾问，公益讲座约2小时，资料免费派发', reward: '展台1个，宣传册展架1个', suitableType: '老年群体较多的社区', contact: '赵顾问', phone: '137-8888-0006', address: '武汉市东湖新技术开发区金融港金融城' }
  }
])

function viewDetail(res) {
  // 跳转到统一的商家详情页
  router.push(`/community/merchants/${res.id}`)
}
function viewMerchantInfo(res) { currentMerchantInfo.value = res; showMerchantInfo.value = true }
function doSearch() { ElMessage.info('搜索功能已触发（演示版）') }
function resetFilters() { filters.keyword = ''; filters.type = ''; filters.merchantType = ''; filters.level = ''; filters.matchOrder = 'match' }

function leaveMessage(res) {
  messageContent.value = ''
  showMessage.value = true
}
function submitMessage() {
  if (!messageContent.value.trim()) { ElMessage.warning('请填写留言内容'); return }
  showMessage.value = false
  showDetail.value = false
  ElMessage.success('留言已发送，平台审核后将推送给商家，请留意回复通知')
}
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
.resource-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.resource-card { cursor: pointer; transition: transform 0.2s; }
.resource-card:hover { transform: translateY(-2px); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rating-stars { display: flex; align-items: center; gap: 1px; }
.star { color: #dcdfe6; font-size: 14px; }
.star.filled { color: #f5a623; }
.match-score { display: flex; align-items: center; gap: 4px; }
.heart { color: #ddd; font-size: 12px; }
.heart.filled { color: #f56c6c; }
.score-pct { font-size: 11px; color: #909399; margin-left: 2px; }
.res-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; line-height: 1.4; }
.res-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.merchant-name { font-size: 13px; color: #409EFF; font-weight: 500; cursor: pointer; text-decoration: underline; }
.merchant-type { font-size: 12px; color: #909399; }
.res-desc { font-size: 13px; color: #606266; margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.res-footer { display: flex; align-items: center; justify-content: space-between; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.detail-top { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.heart-lg { font-size: 22px; color: #ddd; }
.heart-lg.filled { color: #f56c6c; }
.match-pct { font-size: 14px; color: #f56c6c; font-weight: 600; margin-left: 6px; }
.contact-section { margin-top: 16px; }
</style>
