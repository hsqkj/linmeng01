<template>
  <div class="page"><h2>财务管理</h2>
    <div class="stats-row">
      <div class="sc" v-for="s in stats" :key="s.label"><div class="sv" :style="{color:s.color}">{{ s.value }}</div><div class="sl">{{ s.label }}</div></div>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="会费收入" name="fee">
        <el-table :data="feeRecords" stripe border>
          <el-table-column prop="merchant" label="商家" min-width="140" />
          <el-table-column prop="level" label="等级" width="100"><template #default="{ row }"><el-tag size="small">{{ row.level }}</el-tag></template></el-table-column>
          <el-table-column prop="fee" label="金额" width="100"><template #default="{ row }"><span style="color:#67C23A;font-weight:600">¥{{ row.fee.toLocaleString() }}</span></template></el-table-column>
          <el-table-column prop="ambassador" label="招商大使" width="100" />
          <el-table-column prop="commission" label="大使提成" width="100"><template #default="{ row }"><span style="color:#E6A23C">¥{{ row.commission }}</span></template></el-table-column>
          <el-table-column prop="time" label="缴费时间" width="150" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="大使结算" name="commission">
        <el-table :data="commissions" stripe border>
          <el-table-column prop="ambassador" label="招商大使" width="120" />
          <el-table-column prop="month" label="结算月份" width="100" />
          <el-table-column prop="amount" label="结算金额" width="110"><template #default="{ row }"><span style="color:#E6A23C;font-weight:600">¥{{ row.amount.toLocaleString() }}</span></template></el-table-column>
          <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status==='已结算'?'success':'warning'" size="small">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button text type="success" size="small" v-if="row.status==='待结算'" @click="row.status='已结算'">确认结算</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
const activeTab = ref('fee')
const stats = [
  { label: '累计会费收入', value: '¥ 128,400', color: '#67C23A' },
  { label: '本月会费', value: '¥ 23,990', color: '#409EFF' },
  { label: '累计大使提成', value: '¥ 18,960', color: '#E6A23C' },
  { label: '待结算提成', value: '¥ 6,200', color: '#F56C6C' }
]
const feeRecords = reactive([
  { merchant: '中国移动', level: '钻石会员', fee: 12000, ambassador: '李招商', commission: 2400, time: '2026-02-10 15:00' },
  { merchant: '锦江酒店', level: '铂金会员', fee: 5999, ambassador: '王大使', commission: 1200, time: '2026-03-28 14:22' },
  { merchant: '华润万家', level: '金牌会员', fee: 2999, ambassador: '李招商', commission: 600, time: '2026-04-01 10:31' }
])
const commissions = reactive([
  { ambassador: '李招商', month: '2026-03', amount: 3200, status: '待结算' },
  { ambassador: '王大使', month: '2026-03', amount: 1800, status: '待结算' },
  { ambassador: '李招商', month: '2026-02', amount: 2400, status: '已结算' }
])
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.sc { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.sv { font-size: 24px; font-weight: 700; }
.sl { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
