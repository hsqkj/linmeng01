<template>
  <div class="commission-page">
    <h2>提成明细</h2>
    <div class="summary-row">
      <div class="sum-card" v-for="s in summaryCards" :key="s.label">
        <div class="sum-val" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="sum-label">{{ s.label }}</div>
      </div>
    </div>
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="提成类型" style="width:130px">
        <el-option label="全部" value="" />
        <el-option label="首次提成" value="first" />
        <el-option label="续费提成" value="renew" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="结算状态" style="width:130px">
        <el-option label="全部" value="" />
        <el-option label="待结算" value="pending" />
        <el-option label="已结算" value="settled" />
      </el-select>
    </div>
    <el-table :data="commissions" stripe border v-loading="loading">
      <el-table-column type="index" width="50" label="#" />
      <el-table-column prop="company_name" label="商家名称" min-width="140" />
      <el-table-column prop="type" label="提成类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'success' : 'primary'" size="small">{{ row.type === 1 ? '首次提成' : '续费提成' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payment_amount" label="缴费金额" width="110">
        <template #default="{ row }"><span>¥{{ Number(row.payment_amount || 0).toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="commission_rate" label="提成比例" width="90">
        <template #default="{ row }"><span class="rate-text">{{ row.commission_rate }}%</span></template>
      </el-table-column>
      <el-table-column prop="commission_amount" label="提成金额" width="110">
        <template #default="{ row }"><span class="amount-text">¥{{ Number(row.commission_amount || 0).toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="created_at" label="产生时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'" size="small">
            {{ row.status === 0 ? '待结算' : row.status === 1 ? '已结算' : '已提现' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        layout="prev,pager,next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getCommission, getCommissionSummary } from '@/api/ambassador'

const filterType = ref(''), filterStatus = ref('')
const loading = ref(false)
const commissions = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const summaryData = ref({})

const summaryCards = [
  { label: '累计提成', value: '¥ 0', color: '#F59E0B' },
  { label: '待结算', value: '¥ 0', color: '#E6A23C' },
  { label: '本月提成', value: '¥ 0', color: '#67C23A' },
  { label: '已提现', value: '¥ 0', color: '#409EFF' }
]

async function loadSummary() {
  try {
    const res = await getCommissionSummary()
    const d = res.data || {}
    summaryData.value = d
    summaryCards[0].value = '¥ ' + Number(d.total_commission || 0).toLocaleString()
    summaryCards[1].value = '¥ ' + Number(d.pending_commission || 0).toLocaleString()
    summaryCards[2].value = '¥ ' + Number(d.monthCommission || 0).toLocaleString()
    summaryCards[3].value = '¥ ' + Number(d.withdraw_amount || 0).toLocaleString()
  } catch { /* 静默失败 */ }
}

async function loadCommissions() {
  loading.value = true
  try {
    const res = await getCommission({ page: page.value, pageSize: pageSize.value })
    commissions.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    commissions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadSummary(); loadCommissions() })

function onPageChange(p) {
  page.value = p
  loadCommissions()
}

function fmtTime(t) {
  if (!t) return ''
  return String(t).slice(0, 16).replace('T', ' ')
}
</script>
<style scoped>
.commission-page { max-width: 1100px; margin: 0 auto; }
.commission-page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.sum-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.sum-val { font-size: 26px; font-weight: 700; }
.sum-label { font-size: 13px; color: #909399; margin-top: 6px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.rate-text { color: #E6A23C; font-weight: 600; }
.amount-text { color: #67C23A; font-weight: 600; font-size: 15px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
