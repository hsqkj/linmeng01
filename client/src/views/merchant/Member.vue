<template>
  <div class="page">
    <h2>我的会员</h2>

    <!-- 当前等级卡片 -->
    <div class="current-level-card" :style="levelCardStyle">
      <div class="level-badge">Lv{{ currentLevel.level }}</div>
      <div class="level-info">
        <div class="level-name">{{ currentLevel.name }}</div>
        <div class="level-expire">有效期至：{{ currentLevel.expire || '长期有效' }}</div>
      </div>
      <div class="level-fee">
        <div style="font-size:13px;opacity:0.8">年费</div>
        <div style="font-size:28px;font-weight:700">¥{{ currentLevel.fee.toLocaleString() }}</div>
      </div>
    </div>

    <!-- 权益展示 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">当前权益</div>
      <div class="benefit-grid">
        <div v-for="b in currentBenefits" :key="b.name" class="benefit-item">
          <el-icon :size="24" :color="b.available ? '#1a56db' : '#c0c4cc'">
            <component :is="b.icon" />
          </el-icon>
          <div class="benefit-name">{{ b.name }}</div>
          <div class="benefit-val" :class="{unavailable: !b.available}">{{ b.value }}</div>
        </div>
      </div>
    </div>

    <!-- 等级对比与升级 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title-row">
        <span class="section-title">等级权益对比</span>
        <el-button type="primary" @click="showUpgrade = true" v-if="currentLevel.level < 5">立即升级</el-button>
      </div>
      <div class="level-compare">
        <div v-for="lv in memberLevels" :key="lv.level" class="level-col" :class="{current: lv.level===currentLevel.level, higher: lv.level>currentLevel.level}">
          <div class="lv-header">
            <div class="lv-badge-sm">Lv{{ lv.level }}</div>
            <div class="lv-name">{{ lv.name }}</div>
            <div class="lv-fee">¥{{ lv.fee > 0 ? lv.fee.toLocaleString() : '免费' }}</div>
          </div>
          <div class="lv-benefits">
            <div v-for="b in lv.benefits" :key="b" class="lv-b-item">
              <el-icon color="#67C23A" :size="13"><CircleCheck /></el-icon>
              <span>{{ b }}</span>
            </div>
          </div>
          <el-button v-if="lv.level > currentLevel.level" type="primary" size="small" style="width:100%;margin-top:12px" @click="upgradeToLevel(lv)">升级</el-button>
          <div v-else-if="lv.level===currentLevel.level" class="current-tag">当前等级</div>
        </div>
      </div>
    </div>

    <!-- 续费记录 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">缴费记录</div>
      <el-table v-loading="payLoading" :data="payRecords" stripe>
        <el-table-column prop="time" label="缴费时间" width="180" />
        <el-table-column prop="level" label="会员等级" width="120"><template #default="{ row }"><el-tag size="small">{{ row.level }}</el-tag></template></el-table-column>
        <el-table-column prop="amount" label="缴费金额" width="120"><template #default="{ row }"><span style="color:#E6A23C;font-weight:600">¥{{ row.amount.toLocaleString() }}</span></template></el-table-column>
        <el-table-column prop="validUntil" label="有效期至" width="120" />
        <el-table-column prop="ambassador" label="推荐大使" min-width="100" />
        <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag type="success" size="small">{{ row.status }}</el-tag></template></el-table-column>
      </el-table>
    </div>

    <!-- 升级对话框 -->
    <el-dialog v-model="showUpgrade" title="升级会员" width="500px">
      <div class="upgrade-form">
        <p style="color:#606266;margin-bottom:16px">选择要升级的目标等级：</p>
        <div class="upgrade-options">
          <div v-for="lv in upgradeOptions" :key="lv.level" class="upgrade-option" :class="{selected: selectedUpgrade?.level === lv.level}" @click="selectedUpgrade = lv">
            <div class="uo-head">
              <span class="uo-badge">Lv{{ lv.level }}</span>
              <span class="uo-name">{{ lv.name }}</span>
              <span class="uo-fee">¥{{ lv.fee.toLocaleString() }}/年</span>
            </div>
            <div class="uo-benefits">{{ lv.benefits.slice(0, 3).join('、') }}...</div>
          </div>
        </div>
        <div v-if="selectedUpgrade" class="upgrade-summary">
          升级到 <strong>{{ selectedUpgrade.name }}</strong>，需缴纳年费 <strong style="color:#E6A23C">¥{{ selectedUpgrade.fee.toLocaleString() }}</strong>
        </div>
      </div>
      <template #footer>
        <el-button @click="showUpgrade = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedUpgrade" @click="confirmUpgrade">确认升级并缴费</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Key, Phone, Star, Aim, User, TrendCharts } from '@element-plus/icons-vue'
import { getMemberInfo, getMemberLevels } from '@/api/merchant'

const showUpgrade = ref(false), selectedUpgrade = ref(null)
const memberLevelsData = ref([])
const memberBenefitsData = ref([])  // 权益类型配置 [{name, desc, type, values:[lv1,lv2,...]}]

const currentLevel = reactive({ level: 1, name: '普通会员', fee: 0, expire: '' })

// 当前用户等级权益：从 member_benefits 配置中读取当前等级对应值
const currentBenefits = computed(() => {
  const lv = currentLevel.level
  if (memberBenefitsData.value.length === 0) return []

  const ICON_MAP = { '查看联系方式': 'Phone', '月发起意向次数': 'Aim', '优先展示': 'Star',
    '首页推荐': 'TrendCharts', '年参与活动次数': 'User', '专属客服': 'Key',
    '资源置顶次数/月': 'Star', '数据分析报告': 'TrendCharts', '品牌故事展示': 'TrendCharts' }

  return memberBenefitsData.value.map(b => {
    const val = b.values[lv - 1]
    let displayVal = ''
    let available = false
    if (b.type === '开关') {
      available = !!val
      displayVal = available ? '✅ 已开启' : '❌ 未开启'
    } else if (b.type === '数量') {
      available = true
      displayVal = `${val}次${b.name.includes('月') ? '月' : '年'}`
    } else {
      available = true
      displayVal = val || '—'
    }
    return { name: b.name, value: displayVal, icon: ICON_MAP[b.name] || 'TrendCharts', available }
  }).filter(b => b.name !== '会员有效期') // 有效期单独处理
    .concat([{ name: '会员有效期', value: '购买后' + (currentLevel.validityPeriod || 12) + '个月', icon: 'Key', available: true }])
})

// 等级列表及对比权益
const memberLevels = computed(() => memberLevelsData.value.map(lv => {
  // 从 member_benefits 拼接各等级权益描述
  const benefits = memberBenefitsData.value.map(b => {
    const val = b.values[lv.level - 1]
    if (b.type === '开关') return val ? b.name : null
    if (b.type === '数量') return `${b.name} ${val}次`
    return val ? `${b.name}: ${val}` : null
  }).filter(Boolean)
  return {
    level: lv.level, name: lv.name, fee: lv.fee || 0,
    validityPeriod: lv.validity_period || 12, benefits
  }
}))

const upgradeOptions = computed(() => memberLevels.value.filter(l => l.level > currentLevel.level))

const LEVEL_GRADIENTS = [
  'linear-gradient(135deg, #606266 0%, #909399 100%)',  // Lv1 普通
  'linear-gradient(135deg, #6f85b3 0%, #a8b8d8 100%)',  // Lv2 银牌
  'linear-gradient(135deg, #e07b00 0%, #f59f00 100%)',  // Lv3 金牌
  'linear-gradient(135deg, #3d4fc9 0%, #5e72e4 100%)',  // Lv4 铂金
  'linear-gradient(135deg, #1171ef 0%, #11cdef 100%)',  // Lv5 钻石
]
const levelCardStyle = computed(() => ({
  background: LEVEL_GRADIENTS[(currentLevel.level - 1)] || LEVEL_GRADIENTS[0],
  color: '#fff'
}))

// 缴费记录 - 从真实API加载
const payRecords = ref([])
const payLoading = ref(false)

async function loadPaymentHistory() {
  payLoading.value = true
  try {
    const { getPaymentHistory } = await import('@/api/merchant')
    const res = await getPaymentHistory()
    payRecords.value = res.data?.list || res.data || []
  } catch {
    payRecords.value = []
  } finally {
    payLoading.value = false
  }
}

function upgradeToLevel(lv) { selectedUpgrade.value = lv; showUpgrade.value = true }

function confirmUpgrade() {
  if (!selectedUpgrade.value) return
  ElMessage.success(`升级申请已提交！请完成支付 ¥${selectedUpgrade.value.fee.toLocaleString()} 后权益自动生效`)
  showUpgrade.value = false
}

async function loadMemberInfo() {
  try {
    const res = await getMemberInfo()
    const data = res.data || {}
    // member_level 0 或 null 均视为 Lv1 普通会员
    const lvNum = (typeof data.member_level === 'number' && data.member_level >= 1) ? data.member_level : 1
    currentLevel.level = lvNum

    // 从 levels 数组或对象中查找当前等级信息
    let levelDetail = null
    // 权益类型配置
    if (data.benefits && Array.isArray(data.benefits)) {
      memberBenefitsData.value = data.benefits
    }
    // 当前等级配置
    if (Array.isArray(data.levels)) {
      levelDetail = data.levels.find(l => l.level === lvNum)
      if (data.levels.length > 0 && memberLevelsData.value.length === 0) {
        memberLevelsData.value = data.levels
      }
    } else if (data.levels && typeof data.levels === 'object') {
      levelDetail = data.levels[`Lv${lvNum}`]
    }
    const defaultNames = ['普通会员','银牌会员','金牌会员','铂金会员','钻石会员']
    currentLevel.name = levelDetail?.name || defaultNames[lvNum - 1] || '普通会员'
    currentLevel.fee = levelDetail?.fee ?? 0
    currentLevel.expire = data.expire_date || data.member_expire_at || ''
    currentLevel.validityPeriod = levelDetail?.validity_period || 12
  } catch {
    // 使用默认值
  }
}

async function loadMemberLevels() {
  try {
    const res = await getMemberLevels()
    const raw = res.data
    if (raw && Array.isArray(raw.levels)) {
      memberLevelsData.value = raw.levels
    } else if (Array.isArray(raw)) {
      memberLevelsData.value = raw
    } else if (raw && typeof raw === 'object') {
      memberLevelsData.value = Object.entries(raw).map(([k, v]) => ({
        level: parseInt(k.replace('Lv', '')),
        ...v
      })).sort((a, b) => a.level - b.level)
    } else {
      memberLevelsData.value = []
    }
  } catch {
    memberLevelsData.value = []
  }
}

onMounted(() => {
  loadMemberInfo()
  loadMemberLevels()
  loadPaymentHistory()
})

</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 20px; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.current-level-card { 
  border-radius: 14px; 
  padding: 24px 28px; 
  display: flex; 
  align-items: center; 
  gap: 20px; 
  color: #fff; 
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.current-level-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: rgba(255,255,255,0.1);
  transform: rotate(15deg);
  pointer-events: none;
}
.level-1 { background: linear-gradient(135deg, #606266 0%, #909399 100%); }
.level-2 { background: linear-gradient(135deg, #6f85b3 0%, #a8b8d8 100%); }
.level-3 { background: linear-gradient(135deg, #e07b00 0%, #f59f00 100%); }
.level-4 { background: linear-gradient(135deg, #3d4fc9 0%, #5e72e4 100%); }
.level-5 { background: linear-gradient(135deg, #1171ef 0%, #11cdef 100%); }
.level-badge { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
.level-info { flex: 1; }
.level-name { font-size: 20px; font-weight: 700; }
.level-expire { font-size: 13px; opacity: 0.8; margin-top: 4px; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: block; }
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.benefit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 600px) { .benefit-grid { grid-template-columns: repeat(2, 1fr); } }
.benefit-item { text-align: center; padding: 16px; border: 1px solid #f0f0f0; border-radius: 10px; }
.benefit-name { font-size: 13px; color: #606266; margin: 8px 0 4px; }
.benefit-val { font-size: 14px; font-weight: 600; color: #303133; }
.benefit-val.unavailable { color: #c0c4cc; }
.level-compare { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.level-col { flex: 1; min-width: 150px; border: 2px solid #f0f0f0; border-radius: 10px; padding: 14px; }
.level-col.current { border-color: #E6A23C; background: #fff8e1; }
.level-col.higher { border-color: #dbeafe; }
.lv-header { text-align: center; margin-bottom: 12px; }
.lv-badge-sm { font-size: 11px; background: #f0f0f0; border-radius: 4px; padding: 2px 6px; display: inline-block; margin-bottom: 4px; }
.level-col.current .lv-badge-sm { background: #E6A23C; color: #fff; }
.lv-name { font-weight: 700; font-size: 15px; }
.lv-fee { color: #E6A23C; font-weight: 600; font-size: 14px; }
.lv-b-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #606266; margin: 4px 0; }
.current-tag { text-align: center; margin-top: 12px; font-size: 12px; color: #E6A23C; font-weight: 600; }
.upgrade-options { display: flex; flex-direction: column; gap: 10px; }
.upgrade-option { border: 2px solid #f0f0f0; border-radius: 10px; padding: 12px; cursor: pointer; transition: all 0.2s; }
.upgrade-option.selected { border-color: #1a56db; background: #eff6ff; }
.uo-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.uo-badge { background: #1a56db; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.uo-name { font-weight: 600; font-size: 15px; flex: 1; }
.uo-fee { color: #E6A23C; font-weight: 700; font-size: 15px; }
.uo-benefits { font-size: 12px; color: #909399; }
.upgrade-summary { margin-top: 16px; padding: 12px; background: #eff6ff; border-radius: 8px; font-size: 14px; color: #1e40af; }
</style>
