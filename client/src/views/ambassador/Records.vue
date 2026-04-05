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
    <el-table :data="records" stripe border v-loading="loading">
      <el-table-column type="index" width="50" label="#" />
      <el-table-column prop="company_name" label="商家名称" min-width="150" />
      <el-table-column prop="contact_name" label="联系人" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="created_at" label="入驻时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="member_level" label="会员等级" width="100">
        <template #default="{ row }">
          <el-tag :type="levelColors[levelLabel(row.member_level)] || 'info'" size="small">{{ levelLabel(row.member_level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payment_amount" label="缴费金额" width="120">
        <template #default="{ row }">
          <span :class="row.payment_amount > 0 ? 'paid-text' : 'unpaid-text'">{{ row.payment_amount > 0 ? '¥'+Number(row.payment_amount).toLocaleString() : '未缴费' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'info'" size="small">
            {{ row.status === 1 ? '已通过' : row.status === 0 ? '待审核' : '已禁用' }}
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
import { ref, onMounted, watch } from 'vue'
import { getRecords } from '@/api/ambassador'

const filterStatus = ref(''), dateRange = ref(''), searchKey = ref('')
const records = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const levelLabel = (lvl) => ({ 1:'普通会员', 2:'银牌会员', 3:'金牌会员', 4:'铂金会员', 5:'钻石会员' })[lvl] || '普通会员'
const levelColors = { '普通会员': 'info', '银牌会员': 'info', '金牌会员': 'warning', '铂金会员': 'warning', '钻石会员': 'danger' }

async function loadRecords() {
  loading.value = true
  try {
    const res = await getRecords({ page: page.value, pageSize: pageSize.value })
    records.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadRecords() })

function onPageChange(p) {
  page.value = p
  loadRecords()
}

function fmtTime(t) {
  if (!t) return ''
  return String(t).slice(0, 16).replace('T', ' ')
}
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

@media (max-width: 768px) {
  .records-page {
    padding: 12px;
    padding-bottom: 70px;
  }
  .records-page h2 {
    font-size: 18px;
    margin-bottom: 14px;
  }
  .filter-bar {
    gap: 8px;
    margin-bottom: 12px;
  }
  .filter-bar .el-select {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  .filter-bar .el-date-editor {
    width: 100% !important;
    font-size: 13px;
  }
  .filter-bar .el-input {
    width: 100% !important;
    font-size: 13px;
  }
  :deep(.el-table) {
    font-size: 12px;
  }
  :deep(.el-table__header th) {
    font-size: 11px;
    padding: 8px 4px;
  }
  :deep(.el-table__body td) {
    padding: 8px 4px;
  }
  .pagination {
    justify-content: center;
  }
  :deep(.el-pagination) {
    font-size: 12px;
  }
}
</style>
