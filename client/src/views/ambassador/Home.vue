<template>
  <div class="ambassador-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-left">
        <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(ambData.real_name || '大使')}&background=F59E0B&color=fff&size=80`" class="amb-avatar" />
        <div class="banner-info">
          <div class="amb-name">欢迎回来，{{ ambData.real_name || '招商大使' }}！</div>
          <div class="amb-meta">
            <el-tag :type="getLevelTagType(ambassadorLevel)" size="small">{{ ambassadorLevel?.name || '招商大使' }}</el-tag>
            <span v-if="ambData.status === 1" class="amb-code">渠道码：{{ ambData.qr_code || '—' }}</span>
            <el-tag v-else type="info" size="small">审核中</el-tag>
            <span class="join-time">入职时间：{{ (ambData.created_at || '').slice(0, 10) }}</span>
          </div>
        </div>
      </div>
      <div class="banner-actions" v-if="ambData.status === 1">
        <el-button type="warning" @click="$router.push('/ambassador/qrcode')">
          <el-icon><Grid /></el-icon> 查看我的二维码
        </el-button>
      </div>
      <div class="banner-actions" v-else>
        <el-tag type="warning">资料审核中，请耐心等待...</el-tag>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="stats-row">
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-val">{{ ambData.total_merchants || 0 }}家</div>
          <div class="stat-label">累计发展商家</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-val">¥{{ fmtMoney(monthCommission) }}</div>
          <div class="stat-label">本月提成</div>
        </div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-val">¥{{ fmtMoney(ambData.pending_commission) }}</div>
          <div class="stat-label">待结算</div>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-val">¥{{ fmtMoney(ambData.total_commission - ambData.withdraw_amount) }}</div>
          <div class="stat-label">可提现余额</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 近期收益 -->
      <el-col :xs="24" :md="16">
        <div class="section-card">
          <div class="section-header">
            <h3>📈 近6个月收益趋势</h3>
          </div>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div v-for="(m, i) in monthlyData" :key="i" class="bar-col">
                <div class="bar-wrap">
                  <div class="bar-fill" :style="{ height: Math.max(4, (m.commission / maxCommission * 100)) + '%' }">
                    <div class="bar-tooltip">¥{{ fmtMoney(m.commission) }}</div>
                  </div>
                </div>
                <div class="bar-label">{{ m.month }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最新发展记录 -->
        <div class="section-card" style="margin-top:16px">
          <div class="section-header">
            <h3>👥 最新发展商家</h3>
            <el-button text type="primary" @click="$router.push('/ambassador/records')">查看全部</el-button>
          </div>
          <el-table :data="recentMerchants" stripe>
            <el-table-column prop="company_name" label="商家名称" min-width="140" />
            <el-table-column prop="member_level" label="会员等级" width="100">
              <template #default="{ row }">
                <el-tag :type="levelColors[levelLabel(row.member_level)] || 'info'" size="small">{{ levelLabel(row.member_level) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="入驻时间" width="160">
              <template #default="{ row }"><span class="fee-text">{{ fmtTime(row.created_at) }}</span></template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusTag[row.status]" size="small">{{ statusLabel[row.status] }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading && recentMerchants.length === 0" description="暂无发展记录" :image-size="60" />
        </div>
      </el-col>

      <!-- 右侧 -->
      <el-col :xs="24" :md="8">
        <!-- 收益概况 -->
        <div class="section-card">
          <h3>💰 收益概况</h3>
          <div class="income-items">
            <div class="income-item total">
              <div class="income-label">累计提成</div>
              <div class="income-val">¥ {{ fmtMoney(ambData.total_commission) }}</div>
            </div>
            <div class="income-item">
              <div class="income-label">待结算</div>
              <div class="income-val pending">¥ {{ fmtMoney(ambData.pending_commission) }}</div>
            </div>
            <div class="income-item">
              <div class="income-label">已提现</div>
              <div class="income-val">¥ {{ fmtMoney(ambData.withdraw_amount) }}</div>
            </div>
            <div class="income-item">
              <div class="income-label">账户余额</div>
              <div class="income-val">¥ {{ fmtMoney(ambData.total_commission - ambData.withdraw_amount) }}</div>
            </div>
          </div>
          <el-button v-if="ambData.status === 1" type="warning" style="width:100%;margin-top:16px" @click="$router.push('/ambassador/withdraw')">
            申请提现
          </el-button>
        </div>

        <!-- 快速操作 -->
        <div class="section-card" style="margin-top:16px" v-if="ambData.status === 1">
          <h3>⚡ 快速操作</h3>
          <div class="quick-actions">
            <div class="qa-item" @click="$router.push('/ambassador/qrcode')">
              <el-icon :size="24" color="#F59E0B"><Grid /></el-icon>
              <span>分享渠道码</span>
            </div>
            <div class="qa-item" @click="$router.push('/ambassador/records')">
              <el-icon :size="24" color="#409EFF"><List /></el-icon>
              <span>发展记录</span>
            </div>
            <div class="qa-item" @click="$router.push('/ambassador/commission')">
              <el-icon :size="24" color="#67C23A"><Money /></el-icon>
              <span>提成明细</span>
            </div>
            <div class="qa-item" @click="$router.push('/ambassador/withdraw')">
              <el-icon :size="24" color="#8B5CF6"><Wallet /></el-icon>
              <span>申请提现</span>
            </div>
          </div>
        </div>

        <!-- 提成政策说明 -->
        <div class="section-card" style="margin-top:16px">
          <h3>📋 我的等级权益</h3>
          <div class="level-info">
            <div class="level-badge" :class="'level-' + ambassadorLevel?.level">
              <span class="level-name">{{ ambassadorLevel?.name || '主管级' }}</span>
              <span class="level-rate">{{ ambassadorLevel?.commissionRate }}%</span>
            </div>
            <div v-if="ambassadorLevel?.benefits" class="level-benefits">{{ ambassadorLevel.benefits }}</div>
          </div>
          <div class="policy-info">
            <div class="policy-row">
              <span class="policy-label">我的提成比例</span>
              <span class="policy-value primary">{{ ambassadorLevel?.commissionRate }}%</span>
            </div>
            <div v-if="ambassadorLevel?.canDevelopSub" class="policy-row">
              <span class="policy-label">下级提成比例</span>
              <span class="policy-value">{{ ambassadorLevel?.subCommissionRate }}%</span>
            </div>
            <div class="policy-row">
              <span class="policy-label">首次入会提成</span>
              <span class="policy-value">{{ ambassadorLevel?.commissionRate || 25 }}%</span>
            </div>
            <div class="policy-row">
              <span class="policy-label">续费提成</span>
              <span class="policy-value">{{ commissionConfig?.renewRate }}%</span>
            </div>
            <div class="policy-row">
              <span class="policy-label">最低提现金额</span>
              <span class="policy-value">{{ commissionConfig.minWithdraw }}元</span>
            </div>
          </div>
          <div v-if="nextLevel" class="upgrade-tip">
            <span>升级到 {{ nextLevel.name }} 可获得 {{ nextLevel.commissionRate }}% 提成</span>
            <el-button size="small" type="warning" @click="openUpgradeDialog">立即升级</el-button>
          </div>
          <div class="policy-remark">
            招商大使提成政策：成功邀请商家入驻并完成付费后，首次入会按年费的{{ ambassadorLevel?.commissionRate || 25 }}%结算提成；商家每年续费后，按续费金额的{{ commissionConfig?.renewRate || 25 }}%追加提成{{ commissionConfig?.minWithdraw ? '。提成每月1日统一结算，最低提现' + commissionConfig.minWithdraw + '元，3个工作日内到账。' : '' }}
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 升级对话框 -->
    <el-dialog v-model="showUpgradeDialog" title="升级大使等级" width="500px" destroy-on-close>
      <div class="upgrade-dialog-content">
        <p style="color:#606266;margin-bottom:16px">选择要升级的目标等级：</p>
        <div class="upgrade-options">
          <div v-for="lv in upgradeOptions" :key="lv.level" class="upgrade-option" :class="{selected: selectedUpgradeLevel?.level === lv.level}" @click="selectedUpgradeLevel = lv">
            <div class="uo-head">
              <span class="uo-badge">{{ lv.name }}</span>
              <span class="uo-rate">{{ lv.commissionRate }}%提成</span>
              <span class="uo-fee">¥{{ lv.fee || 0 }}</span>
            </div>
            <div class="uo-benefits">
              {{ lv.canDevelopSub ? '可发展下级大使，下级提成' + lv.subCommissionRate + '%' : '注册即为大使' }}
            </div>
          </div>
        </div>
        <div v-if="selectedUpgradeLevel" class="upgrade-summary">
          升级到 <strong>{{ selectedUpgradeLevel.name }}</strong>，需缴纳 <strong style="color:#E6A23C">¥{{ selectedUpgradeLevel.fee || 0 }}</strong>
        </div>
        <div class="upgrade-benefits" v-if="selectedUpgradeLevel">
          <div class="benefits-title">升级权益</div>
          <ul>
            <li>提成比例提升至 {{ selectedUpgradeLevel.commissionRate }}%</li>
            <li v-if="selectedUpgradeLevel.canDevelopSub">可发展下级大使，获得下级 {{ selectedUpgradeLevel.subCommissionRate }}% 提成</li>
            <li>享受更多专属服务和资源支持</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeUpgradeDialog">取消</el-button>
        <el-button type="warning" :disabled="!selectedUpgradeLevel" @click="handleUpgrade">确认升级</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Grid, List, Money, Wallet } from '@element-plus/icons-vue'
import { getHomeData, getCommissionConfig } from '@/api/ambassador'

const router = useRouter()
const loading = ref(false)
const ambData = ref({})
const recentMerchants = ref([])
const monthCommission = ref(0)
const commissionConfig = ref({})
const showUpgradeDialog = ref(false)
const selectedUpgradeLevel = ref(null)

const upgradeOptions = computed(() => {
  const currentLevel = ambassadorLevel.value?.level || 1
  return ambassadorLevels.value
    .filter(l => l.level > currentLevel)
    .sort((a, b) => a.level - b.level)
})

const levelLabel = (lvl) => ({ 0:'免费试用', 1:'普通会员', 2:'银牌会员', 3:'金牌会员', 4:'铂金会员', 5:'钻石会员' })[lvl] || '普通会员'
const levelColors = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': 'warning', '钻石会员': 'danger' }
const statusLabel = { 0:'待审核', 1:'已缴费', 2:'禁用' }
const statusTag = { 0:'warning', 1:'success', 2:'info' }

// 大使等级和权益
const ambassadorLevels = ref([])
const ambassadorLevel = computed(() => {
  const level = ambData.value?.ambassador_level || 1
  const found = ambassadorLevels.value.find(l => l.level === level)
  // 确保返回有效数据
  if (found) return found
  // 如果没找到对应的等级，返回主管级默认数据
  return { level: 1, name: '主管级', commissionRate: 25, canDevelopSub: false, subCommissionRate: 0, benefits: '注册即为大使，获得基础提成' }
})

const nextLevel = computed(() => {
  const currentLevel = ambassadorLevel.value?.level || 1
  const levels = ambassadorLevels.value.sort((a, b) => a.level - b.level)
  return levels.find(l => l.level > currentLevel)
})

const getLevelTagType = (level) => {
  if (!level) return 'info'
  const types = { 1: 'info', 2: 'warning', 3: 'danger' }
  return types[level.level] || 'info'
}

const openUpgradeDialog = () => {
  showUpgradeDialog.value = true
}

const closeUpgradeDialog = () => {
  showUpgradeDialog.value = false
}

const handleUpgrade = () => {
  ElMessage.info('升级功能开发中，请联系客服完成升级')
  showUpgradeDialog.value = false
}

const settlePeriodLabel = computed(() => ({
  monthly: '每月1日结算',
  quarterly: '每季度结算',
  manual: '手动结算'
})[commissionConfig.value.settlePeriod] || '每月1日结算')

// 近6个月柱状图数据（本地计算）
const monthlyData = ref([
  { month: '11月', commission: 0 }, { month: '12月', commission: 0 },
  { month: '1月', commission: 0 }, { month: '2月', commission: 0 },
  { month: '3月', commission: 0 }, { month: '4月', commission: 0 }
])
const maxCommission = computed(() => Math.max(1200, ...monthlyData.value.map(m => m.commission)))

async function loadHome() {
  loading.value = true
  try {
    const res = await getHomeData()
    const d = res.data || {}
    ambData.value = d
    recentMerchants.value = d.recentMerchants || []
    monthCommission.value = d.monthCommission || 0
  } catch {
    ElMessage.error('加载首页数据失败')
  } finally {
    loading.value = false
  }
}

async function loadConfig() {
  try {
    const res = await getCommissionConfig()
    if (res.data) {
      commissionConfig.value = res.data
      // 加载大使等级配置
      if (res.data.ambassador_levels && res.data.ambassador_levels.length > 0) {
        ambassadorLevels.value = res.data.ambassador_levels
      } else {
        // 默认等级
        ambassadorLevels.value = [
          { level: 1, name: '主管级', fee: 0, commissionRate: 25, canDevelopSub: false, subCommissionRate: 0, benefits: '注册即为大使，获得基础提成' },
          { level: 2, name: '经理级', fee: 399, commissionRate: 30, canDevelopSub: true, subCommissionRate: 10, benefits: '可发展下级大使，获得下级提成' },
          { level: 3, name: '总监级', fee: 1999, commissionRate: 40, canDevelopSub: true, subCommissionRate: 10, benefits: '最高等级，全额提成+下级提成' }
        ]
      }
    }
  } catch {
    // 使用默认值
    ambassadorLevels.value = [
      { level: 1, name: '主管级', fee: 0, commissionRate: 25, canDevelopSub: false, subCommissionRate: 0, benefits: '注册即为大使，获得基础提成' },
      { level: 2, name: '经理级', fee: 399, commissionRate: 30, canDevelopSub: true, subCommissionRate: 10, benefits: '可发展下级大使，获得下级提成' },
      { level: 3, name: '总监级', fee: 1999, commissionRate: 40, canDevelopSub: true, subCommissionRate: 10, benefits: '最高等级，全额提成+下级提成' }
    ]
  }
}

onMounted(() => { loadHome(); loadConfig() })

function fmtMoney(v) {
  if (!v) return '0'
  return Number(v).toLocaleString()
}

function fmtTime(t) {
  if (!t) return ''
  return String(t).slice(5, 16).replace('T', ' ')
}
</script>

<style scoped>
.ambassador-home { background: #f5f5f5; padding: 12px 14px 20px; max-width: 1200px; margin: 0 auto; }
.welcome-banner { background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; position: relative; overflow: hidden; }
.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50px; right: -30px;
  width: 200px; height: 200px;
  background: rgba(255,255,255,.05);
  border-radius: 50%;
}
.banner-left { display: flex; align-items: center; gap: 14px; }
.amb-avatar { width: 52px; height: 52px; border-radius: 50%; border: 2px solid #F59E0B; }
.amb-name { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.amb-meta { display: flex; align-items: center; gap: 10px; }
.amb-code, .join-time { color: rgba(255,255,255,0.6); font-size: 12px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.stat-card { background: #fff; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.stat-icon { font-size: 24px; }
.stat-val { font-size: 18px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.stat-trend { margin-left: auto; font-size: 12px; font-weight: 600; }
.stat-trend.up { color: #67C23A; }
.stat-trend.down { color: #F56C6C; }
.stat-card.blue .stat-val { color: #409EFF; }
.stat-card.green .stat-val { color: #67C23A; }
.stat-card.yellow .stat-val { color: #E6A23C; }
.section-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-header h3, .section-card h3 { margin: 0 0 12px; font-size: 14px; font-weight: 700; }
.chart-placeholder { height: 160px; }
.bar-chart { display: flex; align-items: flex-end; height: 140px; gap: 10px; padding-bottom: 20px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
.bar-fill { background: linear-gradient(180deg, #F59E0B, #D97706); width: 100%; border-radius: 4px 4px 0 0; position: relative; transition: height 0.3s; cursor: pointer; min-height: 4px; }
.bar-fill:hover .bar-tooltip { display: block; }
.bar-tooltip { display: none; position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: #1a1a2e; color: #fff; font-size: 11px; padding: 3px 6px; border-radius: 4px; white-space: nowrap; }
.bar-label { font-size: 11px; color: #909399; margin-top: 4px; }
.fee-text { color: #303133; font-weight: 500; }
.commission-text { color: #67C23A; font-weight: 600; }
.income-items { display: flex; flex-direction: column; gap: 8px; }
.income-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f7fa; }
.income-item.total { padding-bottom: 10px; }
.income-label { font-size: 13px; color: #606266; }
.income-val { font-size: 16px; font-weight: 700; color: #303133; }
.income-val.pending { color: #E6A23C; }
.income-item.total .income-val { font-size: 20px; color: #F59E0B; }
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.qa-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 12px; color: #606266; }
.qa-item:hover { border-color: #F59E0B; background: #fff8e1; }
.ranking-list { display: flex; flex-direction: column; gap: 8px; }
.rank-item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; }
.rank-item.me { background: #fff8e1; border: 1px solid #FCD34D; }
.rank-num { width: 20px; height: 20px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.rank-num.first { background: #FFD700; color: #fff; }
.rank-num.second { background: #C0C0C0; color: #fff; }
.rank-num.third { background: #CD7F32; color: #fff; }
.rank-name { flex: 1; font-size: 13px; font-weight: 500; }
.rank-val { font-size: 12px; color: #67C23A; font-weight: 600; }

/* 提成政策卡片 */
.level-info { margin-bottom: 12px; }
.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.level-badge.level-1 { background: linear-gradient(135deg, #667eea, #764ba2); }
.level-badge.level-2 { background: linear-gradient(135deg, #f093fb, #f5576c); }
.level-badge.level-3 { background: linear-gradient(135deg, #f59e0b, #d97706); }
.level-name { font-size: 14px; font-weight: 600; }
.level-rate { font-size: 18px; font-weight: 800; }
.level-benefits { margin-top: 8px; font-size: 12px; color: #909399; }

.policy-info { margin-top: 8px; }
.policy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
}
.policy-row:last-of-type { border-bottom: none; }
.policy-label { font-size: 12px; color: #606266; }
.policy-value { font-size: 13px; color: #F59E0B; font-weight: 600; }
.policy-value.primary { color: #667eea; font-size: 15px; }
.policy-remark {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
.upgrade-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fff8e1;
  border-radius: 8px;
  font-size: 12px;
  color: #E6A23C;
}

/* 升级对话框样式 */
.upgrade-dialog-content {
  padding: 10px 0;
}
.upgrade-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.compare-item {
  flex: 1;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}
.compare-item.current {
  background: #f5f7fa;
}
.compare-item.target {
  background: linear-gradient(135deg, #fff8e1, #fff3cd);
  border: 1px solid #F59E0B;
}
.compare-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.compare-name {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}
.compare-rate {
  font-size: 14px;
  color: #F59E0B;
  font-weight: 600;
}
.compare-arrow {
  font-size: 24px;
  color: #F59E0B;
}
.upgrade-fee {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.fee-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}
.fee-label {
  color: #606266;
  font-size: 14px;
}
.fee-value {
  color: #F56C6C;
  font-weight: 600;
  font-size: 16px;
}
.upgrade-benefits {
  margin-bottom: 20px;
}
.benefits-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
.upgrade-benefits ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}
.upgrade-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 升级选项样式 */
.upgrade-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.upgrade-option {
  padding: 14px;
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}
.upgrade-option:hover {
  border-color: #F59E0B;
}
.upgrade-option.selected {
  border-color: #F59E0B;
  background: #fff8e1;
}
.uo-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.uo-badge {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.uo-rate {
  color: #F59E0B;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}
.uo-fee {
  color: #F56C6C;
  font-weight: 700;
  font-size: 16px;
}
.uo-benefits {
  font-size: 12px;
  color: #909399;
  padding-left: 4px;
}
.upgrade-summary {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

@media (min-width: 769px) {
  .ambassador-home { padding: 20px 20px 40px; min-height: 100vh; }
  .welcome-banner { padding: 24px 32px; margin-bottom: 20px; }
  .banner-left { gap: 20px; }
  .amb-avatar { width: 60px; height: 60px; }
  .amb-name { font-size: 20px; }
  .amb-meta { gap: 12px; }
  .stats-row { grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .stat-card { padding: 16px 20px; border-radius: 12px; }
  .stat-icon { font-size: 28px; }
  .stat-val { font-size: 22px; }
  .stat-label { font-size: 13px; }
  .section-card { padding: 20px; border-radius: 12px; margin-bottom: 16px; }
  .section-header { margin-bottom: 16px; }
  .section-header h3, .section-card h3 { font-size: 16px; margin-bottom: 14px; }
  .quick-actions { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
  .qa-item { padding: 16px; }
}

@media (max-width: 768px) {
  .ambassador-home {
    padding-bottom: 70px;
    width: 100%;
    max-width: 100%;
  }
  .welcome-banner { flex-direction: column; gap: 14px; padding: 16px; border-radius: 12px; }
  .banner-left { flex-direction: column; text-align: center; }
  .banner-info { text-align: center; }
  .amb-name { font-size: 16px; margin-bottom: 6px; }
  .amb-meta { flex-direction: column; gap: 6px; align-items: center; }
  .stats-row { grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { padding: 12px; border-radius: 10px; }
  .stat-icon { font-size: 22px; }
  .stat-val { font-size: 18px; }
  .stat-label { font-size: 11px; }
  .section-card { padding: 14px 12px; border-radius: 10px; }
  .section-header h3, .section-card h3 { font-size: 14px; margin-bottom: 12px; }
  :deep(.el-table) { font-size: 11px; }
  :deep(.el-table th) { padding: 6px 4px; font-size: 11px; }
  :deep(.el-table td) { padding: 6px 4px; }
  :deep(.el-dialog) { width: 95% !important; margin: 12px auto !important; }
  :deep(.el-dialog__body) { padding: 16px; }
  .income-item { padding: 6px 0; }
  .income-label { font-size: 13px; }
  .income-val { font-size: 16px; }
  .income-item.total .income-val { font-size: 20px; }
  .quick-actions { gap: 10px; }
  .qa-item { padding: 12px; font-size: 12px; }
}
</style>
