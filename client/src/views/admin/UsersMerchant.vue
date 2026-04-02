<template>
  <div class="users-page">
    <h2>商家用户管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索商家名称/联系人" style="width:200px" clearable />
      <el-select v-model="filterType" placeholder="企业类型" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in industryOptions":key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filterLevel" placeholder="会员等级" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option label="普通会员" :value="1" /><el-option label="银牌会员" :value="2" /><el-option label="金牌会员" :value="3" /><el-option label="铂金会员" :value="4" /><el-option label="钻石会员" :value="5" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" style="width:110px" clearable>
        <el-option label="全部" value="" /><el-option label="待审核" :value="0" /><el-option label="正常" :value="1" /><el-option label="已禁用" :value="2" />
      </el-select>
    </div>
    <el-table :data="merchants" stripe border v-loading="loading">
      <el-table-column type="index" width="50" />
      <el-table-column prop="company_name" label="商家名称" min-width="150" />
      <el-table-column prop="industry" label="行业分类" width="110" />
      <el-table-column prop="member_level" label="会员等级" width="100">
        <template #default="{ row }"><el-tag :type="levelColor[levelLabel(row.member_level)]||''" size="small">{{ levelLabel(row.member_level) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="star_rating" label="平台评级" width="110" align="center">
        <template #default="{ row }">
          <div class="star-display">
            <span v-for="n in 5":key="n" :class="['star', { filled: n <= (row.star_rating || 0) }]">★</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="payment_amount" label="年费" width="90">
        <template #default="{ row }"><span style="font-weight:600;color:#E6A23C">¥{{ (row.payment_amount || 0).toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="resource_count" label="发布资源" width="80" align="center" />
      <el-table-column prop="match_count" label="撮合成功" width="80" align="center" />
      <el-table-column prop="created_at" label="注册时间" width="150">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusTag[row.status]" size="small">{{ statusLabels[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewMerchant(row)">详情</el-button>
          <el-button text type="warning" size="small" @click="changeLevel(row)">改等级</el-button>
          <el-button text type="success" size="small" @click="changeRating(row)">改评级</el-button>
          <el-button v-if="row.status===0" text type="success" size="small" @click="approveMerchant(row)">通过</el-button>
          <el-button v-if="row.status!==2" text type="danger" size="small" @click="disableMerchant(row)">禁用</el-button>
          <el-button v-else text type="success" size="small" @click="enableMerchant(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" /></div>

    <!-- 商家详情对话框 -->
    <el-dialog v-model="showDetail" title="商家详细信息" width="820px">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商家名称" :span="2">{{ currentMerchant.company_name }}</el-descriptions-item>
            <el-descriptions-item label="行业分类">{{ currentMerchant.industry }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">
              <el-tag :type="levelColor[levelLabel(currentMerchant.member_level)]" size="small">{{ levelLabel(currentMerchant.member_level) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="平台评级">
              <div class="star-display">
                <span v-for="n in 5":key="n" :class="['star', { filled: n <= (currentMerchant.star_rating || 0) }]">★</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentMerchant.contact_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系手机">{{ currentMerchant.contact_phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册手机">{{ currentMerchant.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="营业执照">{{ currentMerchant.business_license || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ currentMerchant.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="年费">¥{{ (currentMerchant.payment_amount || 0).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ fmtTime(currentMerchant.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="statusTag[currentMerchant.status]" size="small">{{ statusLabels[currentMerchant.status] }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="企业简介" name="intro">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="企业简介" :span="2">{{ currentMerchant.intro || '暂无简介' }}</el-descriptions-item>
            <el-descriptions-item label="社会职务" :span="2">{{ currentMerchant.social_title || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="成功案例" :span="2">{{ currentMerchant.success_case || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="专家介绍" :span="2">{{ currentMerchant.expert_intro || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="标签" name="tags">
          <p style="color:#909399;font-size:13px;margin-bottom:12px">商家选择的标签，影响智能匹配精准度</p>
          <div class="tag-list">
            <el-tag v-for="tag in (currentMerchant.tags ? JSON.parse(currentMerchant.tags) : [])":key="tag" style="margin:4px">{{ tag }}</el-tag>
            <span v-if="!(currentMerchant.tags && JSON.parse(currentMerchant.tags).length)" style="color:#909399">暂无标签</span>
          </div>
        </el-tab-pane>

        <el-tab-pane label="资源与撮合" name="records">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="发布资源数">{{ currentMerchant.resource_count || 0 }}条</el-descriptions-item>
            <el-descriptions-item label="撮合成功数">{{ currentMerchant.match_count || 0 }}次</el-descriptions-item>
            <el-descriptions-item label="累计贡献">{{ (currentMerchant.match_count || 0) * 200 }}元物资</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="warning" @click="changeLevel(currentMerchant)">修改等级</el-button>
        <el-button v-if="currentMerchant.status!==2" type="danger" @click="disableMerchant(currentMerchant); showDetail=false">禁用账号</el-button>
      </template>
    </el-dialog>

    <!-- 改等级对话框 -->
    <el-dialog v-model="showLevelDialog" title="修改会员等级" width="420px">
      <el-form label-width="100px">
        <el-form-item label="商家名称">
          <span>{{ currentMerchant?.company_name }}</span>
        </el-form-item>
        <el-form-item label="当前等级">
          <el-tag :type="levelColor[levelLabel(currentMerchant?.member_level)]" size="small">{{ levelLabel(currentMerchant?.member_level) }}</el-tag>
        </el-form-item>
        <el-form-item label="修改为">
          <el-select v-model="newLevel" style="width:200px">
            <el-option v-for="l in levelOptions":key="l.lv" :label="'Lv'+l.lv+' '+l.name+'（¥'+l.fee+'）'" :value="l.lv" />
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
    <el-dialog v-model="showRatingDialog" title="修改平台评级" width="420px">
      <el-form label-width="100px">
        <el-form-item label="商家名称">
          <span>{{ currentMerchant?.company_name }}</span>
        </el-form-item>
        <el-form-item label="当前评级">
          <div class="star-display">
            <span v-for="n in 5":key="n" :class="['star', { filled: n <= (currentMerchant?.star_rating || 0) }]">★</span>
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
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMerchants, updateMerchantStatus, updateMerchantLevel, updateMerchantRating } from '@/api/admin'

const search = ref(''), filterType = ref(''), filterLevel = ref(''), filterStatus = ref('')
const showDetail = ref(false), showLevelDialog = ref(false), showRatingDialog = ref(false)
const currentMerchant = ref(null), detailTab = ref('basic')
const newLevel = ref(0), levelReason = ref('')
const newRating = ref(0), ratingReason = ref('')
const merchants = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10

const levelLabel = (lvl) => ({ 1:'普通会员', 2:'银牌会员', 3:'金牌会员', 4:'铂金会员', 5:'钻石会员' })[lvl] || '普通会员'
const industryOptions = [
  '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果', '美业',
  '保健养生', '体育健身', '银行保险', '电信服务', '商超零售', '快递物流',
  '家政服务', '废旧回收', '五金建材', '家居装修', '家纺布艺', '电子电器',
  '房产中介', '汽车服务', '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲',
  '服装服饰', '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
  '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体', '自媒体',
  'IT互联网', '软件开发', '图文广告', '电子电器维修', '家居维修', '美发',
  '建筑工程', '其他'
]
const levelColor = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }
const levelOptions = [
  { lv: 1, name: '普通会员', fee: '0' },
  { lv: 2, name: '银牌会员', fee: '999' },
  { lv: 3, name: '金牌会员', fee: '2999' },
  { lv: 4, name: '铂金会员', fee: '5999' },
  { lv: 5, name: '钻石会员', fee: '12000' }
]
const statusLabels = { 0: '待审核', 1: '正常', 2: '已禁用' }
const statusTag = { 0: 'warning', 1: 'success', 2: 'danger' }

async function loadMerchants() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterLevel.value) params.level = filterLevel.value
    if (search.value) params.keyword = search.value
    const res = await getMerchants(params)
    // 行业过滤（后端暂不支持，客户端过滤）
    let list = res.data?.list || res.data || []
    if (filterType.value) list = list.filter(m => m.industry === filterType.value)
    merchants.value = list
    total.value = res.data?.pagination?.total || res.data?.total || list.length
  } catch { merchants.value = [] }
  finally { loading.value = false }
}

onMounted(() => { loadMerchants() })

watch([filterStatus, filterLevel], () => { page.value = 1; loadMerchants() })
watch(search, () => { page.value = 1; loadMerchants() })

function viewMerchant(row) { currentMerchant.value = row; detailTab.value = 'basic'; showDetail.value = true }

function changeLevel(row) {
  currentMerchant.value = row
  newLevel.value = row.member_level
  levelReason.value = ''
  showLevelDialog.value = true
}

function changeRating(row) {
  currentMerchant.value = row
  newRating.value = row.star_rating || 0
  ratingReason.value = ''
  showRatingDialog.value = true
}

async function confirmChangeRating() {
  if (!ratingReason.value.trim()) { ElMessage.warning('请填写评级调整原因'); return }
  try {
    await updateMerchantRating(currentMerchant.value.id, { rating: newRating.value, reason: ratingReason.value })
    currentMerchant.value.star_rating = newRating.value
    showRatingDialog.value = false
    ElMessage.success('平台评级已修改为：' + newRating.value + '星')
  } catch { ElMessage.error('修改失败') }
}

async function confirmChangeLevel() {
  if (!levelReason.value.trim()) { ElMessage.warning('请填写修改原因'); return }
  try {
    await updateMerchantLevel(currentMerchant.value.id, { level: newLevel.value })
    currentMerchant.value.member_level = newLevel.value
    showLevelDialog.value = false
    ElMessage.success('等级已修改为：' + levelLabel(newLevel.value))
  } catch { ElMessage.error('修改失败') }
}

async function approveMerchant(row) {
  try {
    await ElMessageBox.confirm('确认通过该商家的注册审核？', '审核确认', { type: 'success' })
    await updateMerchantStatus(row.id, { status: 1 })
    row.status = 1
    ElMessage.success('审核已通过')
  } catch {}
}

async function disableMerchant(row) {
  try {
    await ElMessageBox.confirm('确认禁用该商家账号？', '禁用确认', { type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消' })
    await updateMerchantStatus(row.id, { status: 2 })
    row.status = 2
    ElMessage.success('账号已禁用')
  } catch {}
}

async function enableMerchant(row) {
  try {
    await ElMessageBox.confirm('确认恢复该商家账号？', '恢复确认', { type: 'info' })
    await updateMerchantStatus(row.id, { status: 1 })
    row.status = 1
    ElMessage.success('账号已恢复')
  } catch {}
}

function onPageChange(p) { page.value = p; loadMerchants() }
function fmtTime(t) { return t ? String(t).slice(0, 16).replace('T', ' ') : '' }
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
