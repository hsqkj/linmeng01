<template>
  <div class="users-page">
    <h2>商家用户管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索商家名称/联系人" style="width:200px" clearable />
      <el-select v-model="filterType" placeholder="企业类型" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in ['餐饮','零售','教育','医疗健康','科技互联网','金融保险','文旅娱乐']" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filterLevel" placeholder="会员等级" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="l in ['普通会员','银牌会员','金牌会员','铂金会员','钻石会员']" :key="l" :label="l" :value="l" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" style="width:110px">
        <el-option label="全部" value="" /><el-option label="待审核" value="待审核" /><el-option label="正常" value="正常" /><el-option label="已禁用" value="已禁用" />
      </el-select>
    </div>
    <el-table :data="filteredMerchants" stripe border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="name" label="商家名称" min-width="150" />
      <el-table-column prop="type" label="企业类型" width="100" />
      <el-table-column prop="level" label="会员等级" width="100">
        <template #default="{ row }"><el-tag :type="levelColor[row.level]||''" size="small">{{ row.level }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="starRating" label="平台评级" width="110" align="center">
        <template #default="{ row }">
          <div class="star-display">
            <span v-for="n in 5" :key="n" :class="['star', { filled: n <= row.starRating }]">★</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="fee" label="年费" width="90">
        <template #default="{ row }"><span style="font-weight:600;color:#E6A23C">¥{{ row.fee.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="resources" label="发布资源" width="80" align="center" />
      <el-table-column prop="matchings" label="撮合成功" width="80" align="center" />
      <el-table-column prop="registerTime" label="注册时间" width="150" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="row.status==='正常'?'success':row.status==='已禁用'?'danger':'warning'" size="small">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewMerchant(row)">详情</el-button>
          <el-button text type="warning" size="small" @click="changeLevel(row)">改等级</el-button>
          <el-button text type="success" size="small" @click="changeRating(row)">改评级</el-button>
          <el-button v-if="row.status==='待审核'" text type="success" size="small" @click="approveMerchant(row)">通过</el-button>
          <el-button v-if="row.status!=='已禁用'" text type="danger" size="small" @click="disableMerchant(row)">禁用</el-button>
          <el-button v-else text type="success" size="small" @click="enableMerchant(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="68" :page-size="10" /></div>

    <!-- 商家详情对话框 -->
    <el-dialog v-model="showDetail" title="商家详细信息" width="820px" v-if="currentMerchant">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商家名称" :span="2">{{ currentMerchant.name }}</el-descriptions-item>
            <el-descriptions-item label="企业类型">{{ currentMerchant.type }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">
              <el-tag :type="levelColor[currentMerchant.level]" size="small">{{ currentMerchant.level }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="平台评级">
              <div class="star-display">
                <span v-for="n in 5" :key="n" :class="['star', { filled: n <= currentMerchant.starRating }]">★</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentMerchant.detail?.contact || '王经理' }}</el-descriptions-item>
            <el-descriptions-item label="联系手机">{{ currentMerchant.detail?.phone || '138****8888' }}</el-descriptions-item>
            <el-descriptions-item label="注册手机">{{ currentMerchant.detail?.regPhone || '138****8888' }}</el-descriptions-item>
            <el-descriptions-item label="营业执照">{{ currentMerchant.detail?.license || '91310115XXXXXXXX' }}</el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ currentMerchant.detail?.address || '上海市浦东新区花木路1000号' }}</el-descriptions-item>
            <el-descriptions-item label="年费" :span="1">¥{{ currentMerchant.fee.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentMerchant.registerTime }}</el-descriptions-item>
            <el-descriptions-item label="招商大使">{{ currentMerchant.detail?.ambassador || '王大使（AMB2024003）' }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="currentMerchant.status==='正常'?'success':'danger'" size="small">{{ currentMerchant.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="企业简介" name="intro">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="企业简介" :span="2">{{ currentMerchant.detail?.intro || '专注于提供高品质服务，积极参与社区公益活动，已在多个社区开展合作。' }}</el-descriptions-item>
            <el-descriptions-item label="社会职务" :span="2">{{ currentMerchant.detail?.socialTitle || '上海市工商联会员、浦东新区商协会理事' }}</el-descriptions-item>
            <el-descriptions-item label="成功案例" :span="2">{{ currentMerchant.detail?.successCase || '2025年赞助阳光花园社区年度亲子活动，覆盖800+居民，品牌曝光量超10万次。' }}</el-descriptions-item>
            <el-descriptions-item label="专家介绍" :span="2">{{ currentMerchant.detail?.expertIntro || '拥有5名持证专业服务人员，可提供现场服务和线上咨询。' }}</el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:16px">
            <div style="font-weight:600;margin-bottom:8px">商品图文</div>
            <div class="product-imgs">
              <div v-for="i in 3" :key="i" class="product-img-item">
                <div class="img-placeholder">图片{{ i }}</div>
                <div class="img-desc">商品介绍{{ i }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="标签" name="tags">
          <p style="color:#909399;font-size:13px;margin-bottom:12px">商家选择的标签，影响智能匹配精准度</p>
          <div class="tag-list">
            <el-tag v-for="tag in (currentMerchant.detail?.tags || ['亲子服务','社区公益','文化活动','餐饮服务'])" :key="tag" style="margin:4px">{{ tag }}</el-tag>
          </div>
        </el-tab-pane>

        <el-tab-pane label="资源与撮合" name="records">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="发布资源数">{{ currentMerchant.resources }}条</el-descriptions-item>
            <el-descriptions-item label="撮合成功数">{{ currentMerchant.matchings }}次</el-descriptions-item>
            <el-descriptions-item label="累计贡献">{{ currentMerchant.matchings * 200 }}元物资</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="warning" @click="changeLevel(currentMerchant)">修改等级</el-button>
        <el-button v-if="currentMerchant.status!=='已禁用'" type="danger" @click="disableMerchant(currentMerchant); showDetail=false">禁用账号</el-button>
      </template>
    </el-dialog>

    <!-- 改等级对话框 -->
    <el-dialog v-model="showLevelDialog" title="修改会员等级" width="420px" v-if="currentMerchant">
      <el-form label-width="100px">
        <el-form-item label="商家名称">
          <span>{{ currentMerchant.name }}</span>
        </el-form-item>
        <el-form-item label="当前等级">
          <el-tag :type="levelColor[currentMerchant.level]" size="small">{{ currentMerchant.level }}</el-tag>
        </el-form-item>
        <el-form-item label="修改为">
          <el-select v-model="newLevel" style="width:200px">
            <el-option v-for="l in levelOptions" :key="l.name" :label="'Lv'+l.lv+' '+l.name+'（¥'+l.fee+'）'" :value="l.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="修改原因">
          <el-input v-model="levelReason" type="textarea" :rows="2" placeholder="请填写修改原因（运营记录用）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLevelDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmChangeLevel">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 改评级对话框 -->
    <el-dialog v-model="showRatingDialog" title="修改平台评级" width="420px" v-if="currentMerchant">
      <el-form label-width="100px">
        <el-form-item label="商家名称">
          <span>{{ currentMerchant.name }}</span>
        </el-form-item>
        <el-form-item label="当前评级">
          <div class="star-display">
            <span v-for="n in 5" :key="n" :class="['star', { filled: n <= currentMerchant.starRating }]">★</span>
          </div>
        </el-form-item>
        <el-form-item label="修改为">
          <div class="rating-selector">
            <el-rate v-model="newRating" :max="5" show-text :texts="['1星', '2星', '3星', '4星', '5星']" />
          </div>
        </el-form-item>
        <el-form-item label="评级说明">
          <el-input v-model="ratingReason" type="textarea" :rows="2" placeholder="请填写评级调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRatingDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmChangeRating">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const search = ref(''), filterType = ref(''), filterLevel = ref(''), filterStatus = ref('')
const showDetail = ref(false), showLevelDialog = ref(false), showRatingDialog = ref(false)
const currentMerchant = ref(null), detailTab = ref('basic')
const newLevel = ref(''), levelReason = ref('')
const newRating = ref(0), ratingReason = ref('')

const levelColor = { '普通会员': 'info', '银牌会员': '', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }
const levelOptions = [
  { lv: 1, name: '普通会员', fee: '0' },
  { lv: 2, name: '银牌会员', fee: '999' },
  { lv: 3, name: '金牌会员', fee: '2999' },
  { lv: 4, name: '铂金会员', fee: '5999' },
  { lv: 5, name: '钻石会员', fee: '12000' }
]

const merchants = reactive([
  {
    name: '星巴克咖啡', type: '餐饮', level: '金牌会员', fee: 2999, resources: 3, matchings: 5, registerTime: '2026-01-05 10:00', status: '正常', starRating: 5,
    detail: { contact: '张店长', phone: '138****5001', regPhone: '138****5001', license: '913101155XXXX', address: '上海市浦东新区花木路888号', ambassador: '王大使（AMB2024003）', intro: '星巴克是全球知名咖啡连锁品牌，积极参与社区公益。', socialTitle: '上海市连锁经营协会会员', successCase: '赞助2025年阳光花园亲子活动，提供2万元物资。', expertIntro: '拥有专业活动策划团队3人。', tags: ['餐饮服务', '亲子友好', '公益活动', '文化活动'] }
  },
  {
    name: '新东方教育', type: '教育', level: '铂金会员', fee: 5999, resources: 4, matchings: 7, registerTime: '2026-01-08 14:30', status: '正常', starRating: 4,
    detail: { contact: '李主任', phone: '139****5002', regPhone: '139****5002', license: '913101156XXXX', address: '上海市浦东新区张江路500号', ambassador: '李招商（AMB2024001）', intro: '新东方教育专注K12教育，可提供专家讲师进社区服务。', socialTitle: '上海市教育培训协会理事', successCase: '开展社区亲子编程启蒙课5场，惠及300+家庭。', expertIntro: '拥有专职讲师20名，均具备教师资格证。', tags: ['教育培训', '亲子友好', '专业服务', '社区公益'] }
  },
  {
    name: '京东健康', type: '医疗健康', level: '铂金会员', fee: 5999, resources: 2, matchings: 4, registerTime: '2026-01-12 09:15', status: '正常', starRating: 4,
    detail: { contact: '王医生', phone: '136****5003', regPhone: '136****5003', license: '913101157XXXX', address: '上海市浦东新区陆家嘴金融中心', ambassador: '王大使（AMB2024003）', intro: '京东健康提供专业医疗健康服务，可开展义诊进社区。', socialTitle: '上海市医疗行业协会会员', successCase: '开展社区义诊活动8次，服务居民2000+人次。', expertIntro: '拥有执业医师5名，护士10名。', tags: ['医疗健康', '老年服务', '公益义诊', '健康讲座'] }
  },
  {
    name: '华润万家', type: '零售', level: '金牌会员', fee: 2999, resources: 5, matchings: 6, registerTime: '2026-02-01 11:00', status: '正常', starRating: 3,
    detail: { contact: '陈总', phone: '135****5004', regPhone: '135****5004', license: '913101158XXXX', address: '上海市浦东新区花木路1000号', ambassador: '李招商（AMB2024001）', intro: '华润万家是知名零售超市，可提供物资赞助和场地支持。', socialTitle: '上海市零售商业协会会员', successCase: '赞助社区节庆活动3次，提供物资约5万元。', expertIntro: '/', tags: ['物资赞助', '零售', '节庆活动', '社区公益'] }
  },
  {
    name: '中国移动', type: '科技互联网', level: '钻石会员', fee: 12000, resources: 3, matchings: 8, registerTime: '2026-02-10 15:00', status: '正常', starRating: 5,
    detail: { contact: '刘总监', phone: '137****5005', regPhone: '137****5005', license: '913101159XXXX', address: '上海市浦东新区世纪大道1000号', ambassador: '张推广（AMB2024005）', intro: '中国移动提供5G技术和媒体资源，支持智慧社区建设。', socialTitle: '上海市互联网协会理事', successCase: '为3个社区提供免费WiFi覆盖，赞助数字技术培训课程8场。', expertIntro: '拥有5G专家工程师3名，可提供技术讲座和咨询服务。', tags: ['技术支持', '媒体宣传', '智慧社区', '科技讲座'] }
  },
  {
    name: '某新商家', type: '餐饮', level: '普通会员', fee: 0, resources: 0, matchings: 0, registerTime: '2026-04-01 10:30', status: '待审核', starRating: 0,
    detail: { contact: '新商家老板', phone: '135****0000', regPhone: '135****0000', license: '待审核', address: '上海市浦东新区某地址', ambassador: '/', intro: '新注册商家，待审核。', tags: [] }
  }
])

const filteredMerchants = computed(() => {
  return merchants.filter(m => {
    const matchSearch = !search.value || m.name.includes(search.value)
    const matchType = !filterType.value || m.type === filterType.value
    const matchLevel = !filterLevel.value || m.level === filterLevel.value
    const matchStatus = !filterStatus.value || m.status === filterStatus.value
    return matchSearch && matchType && matchLevel && matchStatus
  })
})

function viewMerchant(row) { currentMerchant.value = row; detailTab.value = 'basic'; showDetail.value = true }

function changeLevel(row) {
  currentMerchant.value = row
  newLevel.value = row.level
  levelReason.value = ''
  showLevelDialog.value = true
}

function changeRating(row) {
  currentMerchant.value = row
  newRating.value = row.starRating
  ratingReason.value = ''
  showRatingDialog.value = true
}

function confirmChangeRating() {
  if (!ratingReason.value.trim()) { ElMessage.warning('请填写评级调整原因'); return }
  currentMerchant.value.starRating = newRating.value
  showRatingDialog.value = false
  ElMessage.success('平台评级已修改为：' + newRating.value + '星')
}

function confirmChangeLevel() {
  if (!levelReason.value.trim()) { ElMessage.warning('请填写修改原因'); return }
  currentMerchant.value.level = newLevel.value
  const feeMap = { '普通会员': 0, '银牌会员': 999, '金牌会员': 2999, '铂金会员': 5999, '钻石会员': 12000 }
  currentMerchant.value.fee = feeMap[newLevel.value] || 0
  showLevelDialog.value = false
  ElMessage.success('等级已修改为：' + newLevel.value)
}

function approveMerchant(row) {
  ElMessageBox.confirm('确认通过该商家的注册审核？', '审核确认', { type: 'success' })
    .then(() => { row.status = '正常'; ElMessage.success('审核已通过') }).catch(() => {})
}

function disableMerchant(row) {
  ElMessageBox.confirm(`确认禁用"${row.name}"的账号？禁用后该商家将无法登录和发布资源。`, '禁用确认', {
    type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消'
  }).then(() => { row.status = '已禁用'; ElMessage.success('账号已禁用') }).catch(() => {})
}

function enableMerchant(row) {
  ElMessageBox.confirm(`确认恢复"${row.name}"的账号？`, '恢复确认', { type: 'info' })
    .then(() => { row.status = '正常'; ElMessage.success('账号已恢复') }).catch(() => {})
}
</script>
<style scoped>
.users-page { max-width: 1200px; margin: 0 auto; }
.users-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.tag-list { display: flex; flex-wrap: wrap; }
.product-imgs { display: flex; gap: 12px; flex-wrap: wrap; }
.product-img-item { width: 120px; text-align: center; }
.img-placeholder { width: 120px; height: 80px; background: #f5f7fa; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 12px; }
.img-desc { font-size: 12px; color: #606266; margin-top: 4px; }
.star-display { display: inline-flex; gap: 2px; }
.star { color: #dcdfe6; font-size: 14px; }
.star.filled { color: #f56c6c; }
.rating-selector { padding: 4px 0; }
</style>
