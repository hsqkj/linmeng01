<template>
  <div class="ambassador-home">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-left">
        <img src="https://ui-avatars.com/api/?name=李大使&background=F59E0B&color=fff&size=80" class="amb-avatar" />
        <div class="banner-info">
          <div class="amb-name">欢迎回来，李招商！</div>
          <div class="amb-meta">
            <el-tag type="warning" size="small">高级大使</el-tag>
            <span class="amb-code">渠道码：AMB2024001</span>
            <span class="join-time">入职时间：2024-01-15</span>
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
      <div class="stat-card" v-for="s in stats" :key="s.label" :class="s.color">
        <div class="stat-icon">{{ s.icon }}</div>
        <div class="stat-info">
          <div class="stat-val">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
        <div class="stat-trend" :class="s.trend > 0 ? 'up' : 'down'">
          {{ s.trend > 0 ? '↑' : '↓' }} {{ Math.abs(s.trend) }}
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
                  <div class="bar-fill" :style="{ height: (m.commission / maxCommission * 100) + '%' }">
                    <div class="bar-tooltip">¥{{ m.commission }}</div>
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
            <el-table-column prop="name" label="商家名称" min-width="140" />
            <el-table-column prop="level" label="会员等级" width="100">
              <template #default="{ row }">
                <el-tag :type="levelColors[row.level]" size="small">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fee" label="缴费金额" width="100">
              <template #default="{ row }"><span class="fee-text">¥{{ row.fee.toLocaleString() }}</span></template>
            </el-table-column>
            <el-table-column prop="commission" label="我的提成" width="100">
              <template #default="{ row }"><span class="commission-text">¥{{ row.commission.toLocaleString() }}</span></template>
            </el-table-column>
            <el-table-column prop="time" label="时间" width="120" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '已结算' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
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
              <div class="income-val">¥ 24,680</div>
            </div>
            <div class="income-item">
              <div class="income-label">待结算</div>
              <div class="income-val pending">¥ 3,200</div>
            </div>
            <div class="income-item">
              <div class="income-label">已提现</div>
              <div class="income-val">¥ 18,900</div>
            </div>
            <div class="income-item">
              <div class="income-label">账户余额</div>
              <div class="income-val">¥ 2,580</div>
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

        <!-- 排行榜 -->
        <div class="section-card" style="margin-top:16px">
          <h3>🏆 本月大使排行</h3>
          <div class="ranking-list">
            <div v-for="(r, i) in ranking" :key="r.name" class="rank-item" :class="{ me: r.isMe }">
              <div class="rank-num" :class="['first','second','third'][i] || ''">{{ i + 1 }}</div>
              <div class="rank-name">{{ r.name }}</div>
              <div class="rank-val">{{ r.count }}家 / ¥{{ r.amount.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Grid, List, Money, Wallet } from '@element-plus/icons-vue'
const router = useRouter()

const stats = [
  { icon: '👥', label: '累计发展商家', value: '38家', color: 'blue', trend: 3 },
  { icon: '✅', label: '本月新增', value: '5家', color: 'green', trend: 2 },
  { icon: '💰', label: '本月提成', value: '¥3,200', color: 'yellow', trend: 800 },
  { icon: '⏳', label: '待结算', value: '¥3,200', color: 'orange', trend: -200 }
]
const levelColors = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': '', '钻石会员': 'danger' }
const monthlyData = [
  { month: '11月', commission: 1200 }, { month: '12月', commission: 2400 },
  { month: '1月', commission: 1800 }, { month: '2月', commission: 3200 },
  { month: '3月', commission: 2900 }, { month: '4月', commission: 3200 }
]
const maxCommission = computed(() => Math.max(...monthlyData.map(m => m.commission)))
const recentMerchants = [
  { name: '华润万家超市', level: '金牌会员', fee: 2999, commission: 600, time: '04-01', status: '待结算' },
  { name: '锦江酒店', level: '铂金会员', fee: 5999, commission: 1200, time: '03-28', status: '待结算' },
  { name: '好利来蛋糕', level: '银牌会员', fee: 999, commission: 100, time: '03-25', status: '已结算' },
  { name: '滴滴出行', level: '金牌会员', fee: 2999, commission: 300, time: '03-20', status: '已结算' }
]
const ranking = [
  { name: '王大使', count: 12, amount: 9600, isMe: false },
  { name: '李招商（我）', count: 5, amount: 3200, isMe: true },
  { name: '张推广', count: 4, amount: 2400, isMe: false },
  { name: '赵销售', count: 3, amount: 1800, isMe: false }
]
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
