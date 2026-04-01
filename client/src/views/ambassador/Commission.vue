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
    <el-table :data="commissions" stripe border>
      <el-table-column type="index" width="50" label="#" />
      <el-table-column prop="merchant" label="商家名称" min-width="140" />
      <el-table-column prop="type" label="提成类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === '首次' ? 'success' : 'primary'" size="small">{{ row.type }}提成</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fee" label="缴费金额" width="110">
        <template #default="{ row }"><span>¥{{ row.fee.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="rate" label="提成比例" width="90">
        <template #default="{ row }"><span class="rate-text">{{ row.rate }}%</span></template>
      </el-table-column>
      <el-table-column prop="amount" label="提成金额" width="110">
        <template #default="{ row }"><span class="amount-text">¥{{ row.amount.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="time" label="产生时间" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === '已结算' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="56" :page-size="10" /></div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const filterType = ref(''), filterStatus = ref('')
const summaryCards = [
  { label: '累计提成', value: '¥ 24,680', color: '#F59E0B' },
  { label: '待结算', value: '¥ 3,200', color: '#E6A23C' },
  { label: '本月提成', value: '¥ 3,200', color: '#67C23A' },
  { label: '已提现', value: '¥ 18,900', color: '#409EFF' }
]
const commissions = [
  { merchant: '华润万家超市', type: '首次', fee: 2999, rate: 20, amount: 600, time: '2026-04-01 10:31', status: '待结算' },
  { merchant: '锦江酒店', type: '首次', fee: 5999, rate: 20, amount: 1200, time: '2026-03-28 14:22', status: '待结算' },
  { merchant: '好利来蛋糕', type: '续费', fee: 999, rate: 10, amount: 100, time: '2026-03-25 09:16', status: '已结算' },
  { merchant: '滴滴出行', type: '首次', fee: 2999, rate: 10, amount: 300, time: '2026-03-20 16:42', status: '已结算' },
  { merchant: '星巴克咖啡', type: '续费', fee: 2999, rate: 10, amount: 300, time: '2026-03-10 11:00', status: '已结算' }
]
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
