<template>
  <div class="records-page">
    <h2>发展记录</h2>
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="会员状态" style="width:130px">
        <el-option label="全部" value="" />
        <el-option label="已缴费" value="paid" />
        <el-option label="待缴费" value="pending" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
      <el-input v-model="searchKey" placeholder="搜索商家名称" prefix-icon="Search" style="width:200px" clearable />
    </div>
    <el-table :data="records" stripe border>
      <el-table-column type="index" width="50" label="#" />
      <el-table-column prop="name" label="商家名称" min-width="150" />
      <el-table-column prop="type" label="企业类型" width="100" />
      <el-table-column prop="registerTime" label="注册时间" width="150" />
      <el-table-column prop="level" label="会员等级" width="100">
        <template #default="{ row }">
          <el-tag :type="levelColors[row.level] || ''" size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fee" label="缴费金额" width="120">
        <template #default="{ row }">
          <span :class="row.paid ? 'paid-text' : 'unpaid-text'">{{ row.paid ? '¥'+row.fee.toLocaleString() : '未缴费' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="commission" label="我的提成" width="110">
        <template #default="{ row }">
          <span class="comm-text" v-if="row.paid">¥{{ row.commission.toLocaleString() }}</span>
          <span class="gray-text" v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="settlementStatus" label="结算状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.settlementStatus === '已结算' ? 'success' : row.settlementStatus === '待结算' ? 'warning' : 'info'" size="small">{{ row.settlementStatus }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="38" :page-size="10" /></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const filterStatus = ref(''), dateRange = ref(''), searchKey = ref('')
const levelColors = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': '', '钻石会员': 'danger' }
const records = [
  { name: '华润万家超市', type: '零售', registerTime: '2026-04-01 10:30', level: '金牌会员', fee: 2999, commission: 600, paid: true, settlementStatus: '待结算' },
  { name: '锦江酒店', type: '餐饮', registerTime: '2026-03-28 14:20', level: '铂金会员', fee: 5999, commission: 1200, paid: true, settlementStatus: '待结算' },
  { name: '好利来蛋糕', type: '餐饮', registerTime: '2026-03-25 09:15', level: '银牌会员', fee: 999, commission: 100, paid: true, settlementStatus: '已结算' },
  { name: '滴滴出行', type: '科技', registerTime: '2026-03-20 16:40', level: '金牌会员', fee: 2999, commission: 300, paid: true, settlementStatus: '已结算' },
  { name: '某健身房', type: '体育', registerTime: '2026-03-18 11:00', level: '普通会员', fee: 0, commission: 0, paid: false, settlementStatus: '未缴费' }
]
</script>

<style scoped>
.records-page { max-width: 1100px; margin: 0 auto; }
.records-page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.paid-text { color: #67C23A; font-weight: 600; }
.unpaid-text { color: #F56C6C; }
.comm-text { color: #E6A23C; font-weight: 600; }
.gray-text { color: #C0C4CC; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
