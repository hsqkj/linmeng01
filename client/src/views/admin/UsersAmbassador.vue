<template>
  <div class="users-page">
    <h2>招商大使管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索大使姓名/手机号" style="width:240px" clearable @input="loadAmbassadors" />
      <el-select v-model="filterStatus" placeholder="状态" style="width:120px" clearable @change="loadAmbassadors">
        <el-option label="全部" value="" />
        <el-option label="待审核" :value="0" />
        <el-option label="正常" :value="1" />
        <el-option label="已禁用" :value="2" />
      </el-select>
    </div>
    <el-table v-loading="loading" :data="ambassadors" stripe border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="real_name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="total_merchants" label="发展商家数" width="110" align="center" />
      <el-table-column prop="total_commission" label="累计提成" width="110">
        <template #default="{ row }"><span style="color:#E6A23C;font-weight:600">¥{{ Number(row.total_commission || 0).toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="pending_commission" label="待结算" width="100">
        <template #default="{ row }"><span style="color:#F56C6C">¥{{ Number(row.pending_commission || 0).toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusTagType[row.status]" size="small">{{ statusName[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewAmbassador(row)">详情</el-button>
          <el-button text type="info" size="small" @click="viewCommission(row)">提成明细</el-button>
          <el-button v-if="row.status === 0" text type="success" size="small" @click="approveAmbassador(row)">通过</el-button>
          <el-button v-if="row.status === 1" text type="danger" size="small" @click="disableAmbassador(row)">禁用</el-button>
          <el-button v-if="row.status === 2" text type="success" size="small" @click="enableAmbassador(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        background layout="prev,pager,next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>

    <!-- 大使详情对话框 -->
    <el-dialog v-model="showDetail" title="招商大使详细信息" width="700px" v-if="currentAmbassador">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ currentAmbassador.real_name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentAmbassador.phone }}</el-descriptions-item>
            <el-descriptions-item label="渠道码">{{ 'AMB' + String(currentAmbassador.id).padStart(6, '0') }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatTime(currentAmbassador.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="statusTagType[currentAmbassador.status]" size="small">{{ statusName[currentAmbassador.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ currentAmbassador.id_card_no || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="收款账户" :span="2">{{ currentAmbassador.bank_account || '未绑定' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="业绩数据" name="performance" v-loading="detailLoading">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="发展商家总数">{{ ambassadorMerchants.length }}家</el-descriptions-item>
            <el-descriptions-item label="累计提成">¥{{ Number(currentAmbassador.total_commission || 0).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="待结算金额">¥{{ Number(currentAmbassador.pending_commission || 0).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="已结算金额">¥{{ (Number(currentAmbassador.total_commission || 0) - Number(currentAmbassador.pending_commission || 0)).toLocaleString() }}</el-descriptions-item>
          </el-descriptions>
          <el-table v-if="ambassadorMerchants.length" :data="ambassadorMerchants" stripe border style="margin-top:12px" size="small">
            <el-table-column type="index" width="40" />
            <el-table-column prop="company_name" label="商家名称" min-width="140" />
            <el-table-column prop="member_level" label="等级" width="80">
              <template #default="{ row }">{{ memberLevelName[row.member_level] || 'Lv'+row.member_level }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="入驻时间" width="150">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="info" @click="viewCommission(currentAmbassador)">查看提成明细</el-button>
        <el-button v-if="currentAmbassador.status === 1" type="danger" @click="disableAmbassador(currentAmbassador); showDetail=false">禁用账号</el-button>
      </template>
    </el-dialog>

    <!-- 提成明细对话框 -->
    <el-dialog v-model="showCommission" :title="currentAmbassador?.real_name + ' · 提成明细'" width="800px" v-if="currentAmbassador" v-loading="detailLoading">
      <div class="commission-summary">
        <div class="cs-item"><div class="cs-val" style="color:#E6A23C">¥{{ Number(currentAmbassador.total_commission || 0).toLocaleString() }}</div><div class="cs-label">累计提成</div></div>
        <div class="cs-item"><div class="cs-val" style="color:#F56C6C">¥{{ Number(currentAmbassador.pending_commission || 0).toLocaleString() }}</div><div class="cs-label">待结算</div></div>
        <div class="cs-item"><div class="cs-val" style="color:#67C23A">¥{{ (Number(currentAmbassador.total_commission || 0) - Number(currentAmbassador.pending_commission || 0)).toLocaleString() }}</div><div class="cs-label">已结算</div></div>
      </div>
      <el-table :data="commissionRecords" stripe border style="margin-top:16px" size="small">
        <el-table-column type="index" width="50" />
        <el-table-column prop="company_name" label="商家名称" min-width="140" />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'warning' : 'info'" size="small">{{ row.type === 1 ? '首次' : '续费' }}提成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_amount" label="年费金额" width="100"><template #default="{ row }">¥{{ Number(row.payment_amount || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column prop="commission_rate" label="提成比例" width="90" align="center">
          <template #default="{ row }">{{ row.commission_rate }}%</template>
        </el-table-column>
        <el-table-column prop="commission_amount" label="提成金额" width="100">
          <template #default="{ row }"><span style="color:#E6A23C;font-weight:600">¥{{ Number(row.commission_amount || 0).toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="created_at" label="结算时间" width="150">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">{{ row.status === 1 ? '已结算' : '待结算' }}</el-tag></template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!detailLoading && commissionRecords.length === 0" description="暂无提成记录" :image-size="60" />
      <template #footer>
        <el-button @click="showCommission = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAmbassadors, getAmbassadorDetail, updateAmbassadorStatus } from '@/api/admin'

const ambassadors = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const filterStatus = ref('')

const showDetail = ref(false)
const showCommission = ref(false)
const currentAmbassador = ref(null)
const detailTab = ref('basic')
const detailLoading = ref(false)
const ambassadorMerchants = ref([])
const commissionRecords = ref([])

const statusName = { 0: '待审核', 1: '正常', 2: '已禁用' }
const statusTagType = { 0: 'warning', 1: 'success', 2: 'danger' }
const memberLevelName = { 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadAmbassadors() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (search.value.trim()) params.keyword = search.value.trim()
    const res = await getAmbassadors(params)
    ambassadors.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    ambassadors.value = []
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  page.value = p
  loadAmbassadors()
}

async function viewAmbassador(row) {
  currentAmbassador.value = row
  detailTab.value = 'basic'
  showDetail.value = true
  ambassadorMerchants.value = []
  commissionRecords.value = []
}

async function viewCommission(row) {
  currentAmbassador.value = row
  showCommission.value = true
  detailLoading.value = true
  try {
    const res = await getAmbassadorDetail(row.id)
    ambassadorMerchants.value = res.data?.merchants || []
    commissionRecords.value = res.data?.commissions || []
  } catch {
    ambassadorMerchants.value = []
    commissionRecords.value = []
  } finally {
    detailLoading.value = false
  }
}

async function approveAmbassador(row) {
  try {
    await ElMessageBox.confirm('确认通过该招商大使的申请？通过后系统将自动生成渠道码。', '审核确认', { type: 'success' })
    await updateAmbassadorStatus(row.id, { status: 1 })
    row.status = 1
    ElMessage.success('审核已通过')
    loadAmbassadors()
  } catch {
    // 用户取消或请求失败
  }
}

async function disableAmbassador(row) {
  try {
    await ElMessageBox.confirm(`确认禁用"${row.real_name}"的账号？禁用后其渠道码将失效。`, '禁用确认', {
      type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消'
    })
    await updateAmbassadorStatus(row.id, { status: 2 })
    row.status = 2
    ElMessage.success('账号已禁用')
    loadAmbassadors()
  } catch {
    // 用户取消
  }
}

async function enableAmbassador(row) {
  try {
    await ElMessageBox.confirm(`确认恢复"${row.real_name}"的大使账号？`, '恢复确认', { type: 'info' })
    await updateAmbassadorStatus(row.id, { status: 1 })
    row.status = 1
    ElMessage.success('账号已恢复')
    loadAmbassadors()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadAmbassadors()
})
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
