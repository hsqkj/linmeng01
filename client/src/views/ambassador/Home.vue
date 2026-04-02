<template>
  <div class="ambassador-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-left">
        <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(ambData.real_name || '大使')}&background=F59E0B&color=fff&size=80`" class="amb-avatar" />
        <div class="banner-info">
          <div class="amb-name">欢迎回来，{{ ambData.real_name || '招商大使' }}！</div>
          <div class="amb-meta">
            <el-tag type="warning" size="small">招商大使</el-tag>
            <span class="amb-code">渠道码：{{ ambData.qr_code || '—' }}</span>
            <span class="join-time">入职时间：{{ (ambData.created_at || '').slice(0, 10) }}</span>
          </div>
        </div>
      </div>
      <div class="banner-actions">
        <el-button type="warning" @click="$router.push('/ambassador/qrcode')">
          <el-icon><Grid /></el-icon> 查看我的二维码
        </el-button>
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
      <el-col :span="16">
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
      <el-col :span="8">
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
          <el-button type="warning" style="width:100%;margin-top:16px" @click="$router.push('/ambassador/withdraw')">
            申请提现
          </el-button>
        </div>

        <!-- 快速操作 -->
        <div class="section-card" style="margin-top:16px">
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
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Grid, List, Money, Wallet } from '@element-plus/icons-vue'
import { getHomeData } from '@/api/ambassador'

const router = useRouter()
const loading = ref(false)
const ambData = ref({})
const recentMerchants = ref([])
const monthCommission = ref(0)

const levelLabel = (lvl) => ({ 1:'普通会员', 2:'银牌会员', 3:'金牌会员', 4:'铂金会员', 5:'钻石会员' })[lvl] || '普通会员'
const levelColors = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': 'warning', '钻石会员': 'danger' }
const statusLabel = { 0:'待审核', 1:'已缴费', 2:'禁用' }
const statusTag = { 0:'warning', 1:'success', 2:'info' }

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
    // 动态更新本月数据
    const now = new Date()
    monthlyData.value[now.getMonth() - 3]?.commission // 3月
  } catch {
    ElMessage.error('加载首页数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadHome() })

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
.ambassador-home { max-width: 1200px; margin: 0 auto; }
.welcome-banner { background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px; padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.banner-left { display: flex; align-items: center; gap: 16px; }
.amb-avatar { width: 60px; height: 60px; border-radius: 50%; border: 3px solid #F59E0B; }
.amb-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.amb-meta { display: flex; align-items: center; gap: 12px; }
.amb-code, .join-time { color: rgba(255,255,255,0.6); font-size: 13px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-icon { font-size: 28px; }
.stat-val { font-size: 22px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.stat-trend { margin-left: auto; font-size: 13px; font-weight: 600; }
.stat-trend.up { color: #67C23A; }
.stat-trend.down { color: #F56C6C; }
.stat-card.blue .stat-val { color: #409EFF; }
.stat-card.green .stat-val { color: #67C23A; }
.stat-card.yellow .stat-val { color: #E6A23C; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-header h3, .section-card h3 { margin: 0 0 16px; font-size: 15px; font-weight: 700; }
.chart-placeholder { height: 180px; }
.bar-chart { display: flex; align-items: flex-end; height: 160px; gap: 12px; padding-bottom: 24px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
.bar-fill { background: linear-gradient(180deg, #F59E0B, #D97706); width: 100%; border-radius: 6px 6px 0 0; position: relative; transition: height 0.3s; cursor: pointer; min-height: 4px; }
.bar-fill:hover .bar-tooltip { display: block; }
.bar-tooltip { display: none; position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: #1a1a2e; color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
.bar-label { font-size: 12px; color: #909399; margin-top: 4px; }
.fee-text { color: #303133; font-weight: 500; }
.commission-text { color: #67C23A; font-weight: 600; }
.income-items { display: flex; flex-direction: column; gap: 12px; }
.income-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f7fa; }
.income-item.total { padding-bottom: 12px; }
.income-label { font-size: 14px; color: #606266; }
.income-val { font-size: 18px; font-weight: 700; color: #303133; }
.income-val.pending { color: #E6A23C; }
.income-item.total .income-val { font-size: 24px; color: #F59E0B; }
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.qa-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border: 1px solid #eee; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 13px; color: #606266; }
.qa-item:hover { border-color: #F59E0B; background: #fff8e1; }
.ranking-list { display: flex; flex-direction: column; gap: 10px; }
.rank-item { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 8px; }
.rank-item.me { background: #fff8e1; border: 1px solid #FCD34D; }
.rank-num { width: 24px; height: 24px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.rank-num.first { background: #FFD700; color: #fff; }
.rank-num.second { background: #C0C0C0; color: #fff; }
.rank-num.third { background: #CD7F32; color: #fff; }
.rank-name { flex: 1; font-size: 14px; font-weight: 500; }
.rank-val { font-size: 13px; color: #67C23A; font-weight: 600; }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .welcome-banner { flex-direction: column; gap: 16px; }
}
</style>
