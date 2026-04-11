<template>
  <div class="users-page">
    <h2>商家/专家用户管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索名称/联系人" style="width:200px" clearable />
      <el-select v-model="filterUserType" placeholder="用户类型" style="width:120px" clearable>
        <el-option label="全部" value="" />
        <el-option label="商家" value="merchant" />
        <el-option label="专家" value="expert" />
      </el-select>
      <el-select v-model="filterEnterprise" placeholder="企业类型" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in enterpriseOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filterIndustry" placeholder="行业分类" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in industryOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filterLevel" placeholder="会员等级" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="lv in levelFilterOptions" :key="lv.lv" :label="lv.name" :value="lv.lv" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" style="width:110px" clearable>
        <el-option label="全部" value="" /><el-option label="待审核" :value="0" /><el-option label="正常" :value="1" /><el-option label="已禁用" :value="2" />
      </el-select>
    </div>
    <el-table :data="merchants" stripe border v-loading="loading">
      <el-table-column type="index" width="50" />
      <el-table-column prop="company_type" label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.company_type === 'expert' ? '' : 'success'" size="small">{{ row.company_type === 'expert' ? '专家' : '商家' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="company_name" label="名称" min-width="150" />
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

    <!-- 商家/专家详情对话框 -->
    <el-dialog v-model="showDetail" :title="currentMerchant?.company_type === 'expert' ? '专家详细信息' : '商家详细信息'" width="820px">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户类型">
              <el-tag :type="currentMerchant?.company_type === 'expert' ? '' : 'success'" size="small">{{ currentMerchant?.company_type === 'expert' ? '专家' : '商家' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="行业分类">{{ currentMerchant?.industry || '-' }}</el-descriptions-item>
            <el-descriptions-item label="名称" :span="2">{{ currentMerchant?.company_name }}</el-descriptions-item>
            <el-descriptions-item label="联系人/姓名">{{ currentMerchant?.contact_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentMerchant?.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ fmtTime(currentMerchant?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="statusTag[currentMerchant?.status]" size="small">{{ statusLabels[currentMerchant?.status] }}</el-tag>
            </el-descriptions-item>
            <!-- 专家独有信息 -->
            <template v-if="currentMerchant?.company_type === 'expert'">
              <el-descriptions-item label="专家类型">{{ currentMerchant?.industry || '-' }}</el-descriptions-item>
              <el-descriptions-item label="社会身份">{{ currentMerchant?.social_identity || '-' }}</el-descriptions-item>
            </template>
            <!-- 商家独有信息 -->
            <template v-else>
              <el-descriptions-item label="Logo" :span="2">
                <el-image v-if="currentMerchant?.logo" :src="currentMerchant.logo" style="width:80px;height:80px;border-radius:8px" fit="cover" :preview-src-list="[currentMerchant.logo]" />
                <span v-else style="color:#909399">暂无Logo</span>
              </el-descriptions-item>
              <el-descriptions-item label="营业执照" :span="2">
                <el-image v-if="currentMerchant?.business_license" :src="currentMerchant.business_license" style="width:120px;height:80px;border-radius:6px" fit="cover" :preview-src-list="[currentMerchant.business_license]" />
                <span v-else style="color:#909399">暂无营业执照</span>
              </el-descriptions-item>
              <el-descriptions-item label="地址">{{ currentMerchant?.address || '-' }}</el-descriptions-item>
            </template>
          </el-descriptions>
        </el-tab-pane>

        <!-- 专家资料（仅专家显示） -->
        <el-tab-pane v-if="currentMerchant?.company_type === 'expert'" label="专家资料" name="expert">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="个人简介">{{ currentMerchant?.description || '暂无简介' }}</el-descriptions-item>
            <el-descriptions-item label="社会身份">{{ currentMerchant?.social_identity || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="荣誉资质">{{ currentMerchant?.honors || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="服务标签">
              <div class="tag-list" v-if="parsedTags.length">
                <el-tag v-for="tag in parsedTags" :key="tag" style="margin:4px">{{ tag }}</el-tag>
              </div>
              <span v-else style="color:#909399">暂无标签</span>
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:16px;display:flex;gap:20px;flex-wrap:wrap">
            <div v-if="currentMerchant?.logo" style="text-align:center">
              <div class="img-label">个人照片</div>
              <el-image :src="currentMerchant.logo" style="width:120px;height:150px;border-radius:8px" fit="cover" :preview-src-list="[currentMerchant.logo]" />
            </div>
            <div v-if="parsedImages.length" style="text-align:center">
              <div class="img-label">身份证照片</div>
              <el-image v-for="(img,i) in parsedImages" :key="i" :src="img" style="width:120px;height:80px;border-radius:8px;margin-top:4px" fit="cover" :preview-src-list="parsedImages" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="简介" name="intro">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="简介" :span="2">{{ currentMerchant?.description || '暂无简介' }}</el-descriptions-item>
            <el-descriptions-item label="社会身份" :span="2">{{ currentMerchant?.social_identity || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="荣誉资质" :span="2">{{ currentMerchant?.honors || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="专家介绍" :span="2">{{ currentMerchant?.expert_intro || '暂无' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="merchantProducts.length" style="margin-top:20px">
            <h4 style="margin-bottom:12px">产品/服务介绍</h4>
            <div class="admin-products-grid">
              <div v-for="(p, idx) in merchantProducts" :key="idx" class="admin-product-item">
                <el-image v-if="p.image" :src="p.image" fit="cover" style="width:100%;height:120px;border-radius:6px" :preview-src-list="merchantProducts.filter(x=>x.image).map(x=>x.image)" />
                <div v-if="p.title || p.description" style="padding:8px">
                  <div v-if="p.title" style="font-weight:600;font-size:13px;margin-bottom:4px">{{ p.title }}</div>
                  <div v-if="p.description" style="font-size:12px;color:#606266">{{ p.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="标签" name="tags">
          <p style="color:#909399;font-size:13px;margin-bottom:12px">用户选择的标签，影响智能匹配精准度</p>
          <div class="tag-list">
            <el-tag v-for="tag in parsedTags" :key="tag" style="margin:4px">{{ tag }}</el-tag>
            <span v-if="!parsedTags.length" style="color:#909399">暂无标签</span>
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
import { getMerchants, updateMerchantStatus, updateMerchantLevel, updateMerchantRating, getBasicTypesConfig, getMemberConfig } from '@/api/admin'

const search = ref(''), filterEnterprise = ref(''), filterIndustry = ref(''), filterLevel = ref(''), filterStatus = ref('')
const filterUserType = ref('')
const showDetail = ref(false), showLevelDialog = ref(false), showRatingDialog = ref(false)
const currentMerchant = ref(null), detailTab = ref('basic')
const newLevel = ref(0), levelReason = ref('')
const newRating = ref(0), ratingReason = ref('')
const merchants = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10

// 会员等级配置（从API动态加载）
const memberLevelConfig = ref({})
const levelLabel = (lvl) => memberLevelConfig.value[lvl] || 'Lv' + lvl
const enterpriseOptions = ref([])
const industryOptions = ref([])
const levelColor = { '免费试用': 'info', '普通会员': '', '银牌会员': 'success', '金牌会员': 'warning', '铂金会员': 'danger', '钻石会员': 'danger' }
const levelOptions = ref([])
const levelFilterOptions = computed(() => {
  return Object.entries(memberLevelConfig.value).map(([lv, name]) => ({ lv: parseInt(lv), name }))
})
const statusLabels = { 0: '待审核', 1: '正常', 2: '已禁用' }
const statusTag = { 0: 'warning', 1: 'success', 2: 'danger' }

// 解析标签和图片
const parsedTags = computed(() => {
  if (!currentMerchant.value?.tags) return []
  try {
    const t = typeof currentMerchant.value.tags === 'string' ? JSON.parse(currentMerchant.value.tags) : currentMerchant.value.tags
    return Array.isArray(t) ? t : []
  } catch { return [] }
})

const parsedImages = computed(() => {
  if (!currentMerchant.value?.images) return []
  try {
    const imgs = typeof currentMerchant.value.images === 'string' ? JSON.parse(currentMerchant.value.images) : currentMerchant.value.images
    // 如果是对象数组（新产品格式），返回空数组，交给 merchantProducts 处理
    if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'object') return []
    return Array.isArray(imgs) ? imgs.filter(Boolean) : []
  } catch { return [] }
})

const merchantProducts = computed(() => {
  const images = currentMerchant.value?.images
  if (!images) return []
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed.filter(p => p.image || p.title || p.description)
    }
  } catch {}
  return []
})

async function loadMerchants() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterLevel.value) params.level = filterLevel.value
    if (filterIndustry.value) params.industry = filterIndustry.value
    if (search.value) params.keyword = search.value
    const res = await getMerchants(params)
    // 用户类型过滤（客户端过滤）
    let list = res.data?.list || res.data || []
    if (filterEnterprise.value) list = list.filter(m => m.enterprise_type === filterEnterprise.value)
    if (filterUserType.value) list = list.filter(m => m.company_type === filterUserType.value)
    merchants.value = list
    total.value = res.data?.pagination?.total || res.data?.total || list.length
  } catch { merchants.value = [] }
  finally { loading.value = false }
}

async function loadFilterOptions() {
  try {
    const [basicRes, memberRes] = await Promise.all([
      getBasicTypesConfig(),
      getMemberConfig()
    ])
    if (basicRes.data?.enterpriseTypes?.length > 0) {
      enterpriseOptions.value = basicRes.data.enterpriseTypes.map(t => t.name).filter(Boolean)
    }
    if (basicRes.data?.industryTypes?.length > 0) {
      industryOptions.value = basicRes.data.industryTypes.map(t => t.name).filter(Boolean)
    }
    if (memberRes.data?.member_levels?.length > 0) {
      levelOptions.value = memberRes.data.member_levels.map(l => ({
        lv: l.level, name: l.name || 'Lv' + l.level, fee: l.fee || 0
      }))
      // 设置会员等级名称映射
      const map = {}
      memberRes.data.member_levels.forEach(l => {
        map[l.level] = l.name || 'Lv' + l.level
      })
      memberLevelConfig.value = map
    }
  } catch {}
}

onMounted(() => { loadFilterOptions(); loadMerchants() })

watch([filterStatus, filterLevel, filterIndustry, filterEnterprise, filterUserType], () => { page.value = 1; loadMerchants() })
watch(search, () => { page.value = 1; loadMerchants() })

async function viewMerchant(row) {
  // 尝试加载完整数据（包含专家照片等）
  try {
    const { getMerchantDetail } = await import('@/api/admin')
    const res = await getMerchantDetail(row.id)
    currentMerchant.value = res.data || row
  } catch {
    currentMerchant.value = row
  }
  detailTab.value = row.company_type === 'expert' ? 'expert' : 'basic'
  showDetail.value = true
}

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
.img-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.admin-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.admin-product-item { background: #f5f7fa; border-radius: 8px; overflow: hidden; }

@media (max-width: 768px) {
  .users-page {
    padding: 12px;
    padding-bottom: 70px;
  }
  .users-page h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  .filter-bar {
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .filter-bar .el-input {
    width: 100% !important;
    font-size: 13px;
  }
  .filter-bar .el-select {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  :deep(.el-table) {
    font-size: 11px;
  }
  :deep(.el-table__header th) {
    font-size: 10px;
    padding: 6px 3px;
  }
  :deep(.el-table__body td) {
    padding: 6px 3px;
  }
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 820px;
  }
  :deep(.el-dialog__body) {
    padding: 12px;
  }
  :deep(.el-tabs__content) {
    overflow: auto;
  }
  .pagination {
    justify-content: center;
  }
  .tag-list {
    gap: 4px;
  }
  .star-display {
    gap: 1px;
  }
  .star {
    font-size: 12px;
  }
}
</style>
