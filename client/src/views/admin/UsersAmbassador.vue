<template>
  <div class="users-page">
    <h2>招商大使管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索大使姓名/渠道码" style="width:240px" clearable />
      <el-select v-model="filterStatus" placeholder="状态" style="width:110px">
        <el-option label="全部" value="" /><el-option label="待审核" value="待审核" /><el-option label="正常" value="正常" /><el-option label="已禁用" value="已禁用" />
      </el-select>
    </div>
    <el-table :data="filteredAmbassadors" stripe border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="code" label="渠道码" width="130" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="developed" label="发展商家数" width="110" align="center" />
      <el-table-column prop="totalCommission" label="累计提成" width="110">
        <template #default="{ row }"><span style="color:#E6A23C;font-weight:600">¥{{ row.totalCommission.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="pendingCommission" label="待结算" width="100">
        <template #default="{ row }"><span style="color:#F56C6C">¥{{ row.pendingCommission.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="registerTime" label="注册时间" width="150" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="row.status==='正常'?'success':row.status==='已禁用'?'danger':'warning'" size="small">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewAmbassador(row)">详情</el-button>
          <el-button text type="info" size="small" @click="viewCommission(row)">提成明细</el-button>
          <el-button v-if="row.status==='待审核'" text type="success" size="small" @click="approveAmbassador(row)">通过</el-button>
          <el-button v-if="row.status!=='已禁用'" text type="danger" size="small" @click="disableAmbassador(row)">禁用</el-button>
          <el-button v-else text type="success" size="small" @click="enableAmbassador(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="18" :page-size="10" /></div>

    <!-- 大使详情对话框 -->
    <el-dialog v-model="showDetail" title="招商大使详细信息" width="700px" v-if="currentAmbassador">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ currentAmbassador.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentAmbassador.phone }}</el-descriptions-item>
            <el-descriptions-item label="渠道码">{{ currentAmbassador.code }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentAmbassador.registerTime }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="currentAmbassador.status==='正常'?'success':'warning'" size="small">{{ currentAmbassador.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ currentAmbassador.detail?.idCard || '310115****1234' }}</el-descriptions-item>
            <el-descriptions-item label="收款账户" :span="2">{{ currentAmbassador.detail?.bankAccount || '招商银行 尾号****8888' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="业绩数据" name="performance">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="发展商家总数">{{ currentAmbassador.developed }}家</el-descriptions-item>
            <el-descriptions-item label="本月新增">3家</el-descriptions-item>
            <el-descriptions-item label="累计提成">¥{{ currentAmbassador.totalCommission.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="待结算金额">¥{{ currentAmbassador.pendingCommission.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="已提现金额">¥{{ (currentAmbassador.totalCommission - currentAmbassador.pendingCommission).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="首次提成收入">¥{{ Math.round(currentAmbassador.totalCommission * 0.7).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="续费提成收入">¥{{ Math.round(currentAmbassador.totalCommission * 0.3).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="业绩排名">第 {{ currentAmbassador.rank || 3 }} 名</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="info" @click="viewCommission(currentAmbassador)">查看提成明细</el-button>
        <el-button v-if="currentAmbassador.status!=='已禁用'" type="danger" @click="disableAmbassador(currentAmbassador); showDetail=false">禁用账号</el-button>
      </template>
    </el-dialog>

    <!-- 提成明细对话框 -->
    <el-dialog v-model="showCommission" :title="currentAmbassador?.name + ' · 提成明细'" width="800px" v-if="currentAmbassador">
      <div class="commission-summary">
        <div class="cs-item"><div class="cs-val" style="color:#E6A23C">¥{{ currentAmbassador.totalCommission.toLocaleString() }}</div><div class="cs-label">累计提成</div></div>
        <div class="cs-item"><div class="cs-val" style="color:#F56C6C">¥{{ currentAmbassador.pendingCommission.toLocaleString() }}</div><div class="cs-label">待结算</div></div>
        <div class="cs-item"><div class="cs-val" style="color:#67C23A">¥{{ (currentAmbassador.totalCommission - currentAmbassador.pendingCommission).toLocaleString() }}</div><div class="cs-label">已结算</div></div>
      </div>
      <el-table :data="commissionRecords" stripe border style="margin-top:16px">
        <el-table-column type="index" width="50" />
        <el-table-column prop="merchant" label="商家名称" min-width="140" />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type==='首次'?'warning':'info'" size="small">{{ row.type }}提成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="年费金额" width="100"><template #default="{ row }">¥{{ row.fee.toLocaleString() }}</template></el-table-column>
        <el-table-column prop="rate" label="提成比例" width="90" align="center" />
        <el-table-column prop="amount" label="提成金额" width="100">
          <template #default="{ row }"><span style="color:#E6A23C;font-weight:600">¥{{ row.amount.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="time" label="结算时间" width="150" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.status==='已结算'?'success':'warning'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showCommission = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const search = ref(''), filterStatus = ref('')
const showDetail = ref(false), showCommission = ref(false)
const currentAmbassador = ref(null), detailTab = ref('basic')

const ambassadors = reactive([
  {
    name: '王大使', code: 'AMB2024003', phone: '137****0001', developed: 12, totalCommission: 9600, pendingCommission: 1200, registerTime: '2024-02-01 09:00', status: '正常', rank: 2,
    detail: { idCard: '310115****2233', bankAccount: '招商银行 尾号****8888' }
  },
  {
    name: '李招商', code: 'AMB2024001', phone: '139****0002', developed: 38, totalCommission: 24680, pendingCommission: 3200, registerTime: '2024-01-15 10:00', status: '正常', rank: 1,
    detail: { idCard: '310115****3344', bankAccount: '工商银行 尾号****6666' }
  },
  {
    name: '张推广', code: 'AMB2024005', phone: '136****0003', developed: 4, totalCommission: 2400, pendingCommission: 600, registerTime: '2024-03-10 11:00', status: '正常', rank: 3,
    detail: { idCard: '310115****4455', bankAccount: '建设银行 尾号****9999' }
  },
  {
    name: '新申请人', code: '待分配', phone: '135****0004', developed: 0, totalCommission: 0, pendingCommission: 0, registerTime: '2026-04-01 15:00', status: '待审核', rank: '-',
    detail: { idCard: '310115****5566', bankAccount: '未绑定' }
  }
])

const commissionRecords = [
  { merchant: '星巴克咖啡', type: '首次', fee: 2999, rate: '20%', amount: 599, time: '2026-01-10 14:00', status: '已结算' },
  { merchant: '华润万家', type: '首次', fee: 2999, rate: '20%', amount: 599, time: '2026-02-05 10:00', status: '已结算' },
  { merchant: '星巴克咖啡', type: '续费', fee: 2999, rate: '10%', amount: 299, time: '2027-01-10 00:00', status: '待结算' },
  { merchant: '平安保险', type: '首次', fee: 5999, rate: '20%', amount: 1199, time: '2026-03-15 16:00', status: '已结算' }
]

const filteredAmbassadors = computed(() => {
  return ambassadors.filter(a => {
    const matchSearch = !search.value || a.name.includes(search.value) || a.code.includes(search.value)
    const matchStatus = !filterStatus.value || a.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

function viewAmbassador(row) { currentAmbassador.value = row; detailTab.value = 'basic'; showDetail.value = true }
function viewCommission(row) { currentAmbassador.value = row; showCommission.value = true }

function approveAmbassador(row) {
  ElMessageBox.confirm('确认通过该招商大使的申请？通过后系统将自动生成渠道码。', '审核确认', { type: 'success' })
    .then(() => {
      row.status = '正常'
      row.code = 'AMB' + Date.now().toString().slice(-7)
      ElMessage.success('审核已通过，渠道码已生成：' + row.code)
    }).catch(() => {})
}

function disableAmbassador(row) {
  ElMessageBox.confirm(`确认禁用"${row.name}"（${row.code}）的账号？禁用后其渠道码将失效。`, '禁用确认', {
    type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消'
  }).then(() => { row.status = '已禁用'; ElMessage.success('账号已禁用') }).catch(() => {})
}

function enableAmbassador(row) {
  ElMessageBox.confirm(`确认恢复"${row.name}"的大使账号？`, '恢复确认', { type: 'info' })
    .then(() => { row.status = '正常'; ElMessage.success('账号已恢复') }).catch(() => {})
}
</script>
<style scoped>
.users-page { max-width: 1200px; margin: 0 auto; }
.users-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.commission-summary { display: flex; gap: 24px; background: #f8f9fa; border-radius: 10px; padding: 16px; }
.cs-item { flex: 1; text-align: center; }
.cs-val { font-size: 26px; font-weight: 700; }
.cs-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
