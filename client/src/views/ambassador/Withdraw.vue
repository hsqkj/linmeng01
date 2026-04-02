<template>
  <div class="withdraw-page" v-loading="loading">
    <h2>提现管理</h2>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="balance-card">
          <div class="balance-label">账户余额</div>
          <div class="balance-val">¥ {{ Number(balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
          <div class="balance-tip">待结算金额 ¥{{ Number(summary.pending_commission || 0).toLocaleString() }}（下次结算日：每月1日）</div>
          <el-button type="warning" size="large" style="margin-top:16px" @click="showWithdraw = true" :disabled="balance < 100">申请提现</el-button>
          <div v-if="balance < 100" style="color:#F56C6C;font-size:12px;margin-top:4px">余额不足100元，暂不可提现</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="account-card">
          <h3>绑定收款账户</h3>
          <div class="account-list">
            <div class="account-item" :class="{ active: accountInfo.account_number }">
              <el-icon><CreditCard /></el-icon>
              <div>
                <div class="acc-name">{{ accountInfo.account_type === 'bank' ? (accountInfo.account_name || '银行卡') : accountInfo.account_type === 'alipay' ? '支付宝' : '微信钱包' }} {{ accountInfo.account_name ? `(${accountInfo.account_name})` : '' }}</div>
                <div class="acc-num">{{ accountInfo.account_number ? `尾号 ${accountInfo.account_number.slice(-4)}` : '未设置' }}</div>
              </div>
              <el-tag v-if="accountInfo.account_number" type="success" size="small">已绑定</el-tag>
            </div>
            <div class="account-item" @click="openAddAccount">
              <el-icon><Plus /></el-icon>
              <span>{{ accountInfo.account_number ? '更换收款账户' : '添加收款账户' }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <div class="section-card" style="margin-top:20px">
      <h3>提现记录</h3>
      <el-table :data="withdrawRecords" stripe>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="提现金额" width="120">
          <template #default="{ row }"><span class="amount-text">¥{{ Number(row.amount || 0).toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="account_number" label="到账账户">
          <template #default="{ row }">{{ row.account_type === 'bank' ? '银行卡' : row.account_type === 'alipay' ? '支付宝' : '微信' }} {{ row.account_number ? `尾号${row.account_number.slice(-4)}` : '' }}</template>
        </el-table-column>
        <el-table-column prop="processed_at" label="到账时间" width="180">
          <template #default="{ row }">{{ row.processed_at ? fmtTime(row.processed_at) : '处理中' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
              {{ row.status === 0 ? '处理中' : row.status === 1 ? '已到账' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && withdrawRecords.length === 0" description="暂无提现记录" :image-size="60" />
    </div>

    <el-dialog v-model="showWithdraw" title="申请提现" width="400px">
      <div class="withdraw-form">
        <div class="withdraw-balance">可提现余额：<strong>¥ {{ Number(balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</strong></div>
        <el-form label-position="top" style="margin-top:16px">
          <el-form-item label="提现金额">
            <el-input-number v-model="withdrawAmount" :min="100" :max="balance" style="width:100%" />
            <div style="font-size:12px;color:#909399;margin-top:4px">最低提现100元</div>
          </el-form-item>
          <el-form-item label="到账账户">
            <el-select v-model="withdrawAccount" style="width:100%">
              <el-option v-if="accountInfo.account_number" :label="`${accountInfo.account_type === 'bank' ? '银行卡' : accountInfo.account_type === 'alipay' ? '支付宝' : '微信'} 尾号${accountInfo.account_number.slice(-4)}`" :value="accountInfo.account_number" />
              <el-option v-else label="请先设置收款账户" value="" disabled />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showWithdraw = false">取消</el-button>
        <el-button type="warning" @click="submitWithdraw">确认提现</el-button>
      </template>
    </el-dialog>

    <!-- 添加收款账户对话框 -->
    <el-dialog v-model="showAddAccount" title="添加收款账户" width="480px">
      <el-form :model="accountForm" label-width="100px">
        <el-form-item label="账户类型" required>
          <el-radio-group v-model="accountForm.type">
            <el-radio label="bank">银行卡</el-radio>
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="wechat">微信钱包</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="accountForm.type === 'bank'">
          <el-form-item label="持卡人姓名" required>
            <el-input v-model="accountForm.name" placeholder="请输入银行卡持卡人真实姓名" />
          </el-form-item>
          <el-form-item label="银行名称" required>
            <el-select v-model="accountForm.bankName" style="width:100%">
              <el-option v-for="b in bankList" :key="b" :label="b" :value="b" />
            </el-select>
          </el-form-item>
          <el-form-item label="卡号" required>
            <el-input v-model="accountForm.cardNo" placeholder="请输入银行卡号" maxlength="19" />
          </el-form-item>
          <el-form-item label="确认卡号" required>
            <el-input v-model="accountForm.cardNoConfirm" placeholder="请再次输入银行卡号" maxlength="19" />
          </el-form-item>
        </template>
        <template v-else-if="accountForm.type === 'alipay'">
          <el-form-item label="支付宝账号" required>
            <el-input v-model="accountForm.account" placeholder="手机号或邮箱" />
          </el-form-item>
          <el-form-item label="真实姓名" required>
            <el-input v-model="accountForm.name" placeholder="与支付宝实名一致" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="微信昵称" required>
            <el-input v-model="accountForm.name" placeholder="微信实名认证姓名" />
          </el-form-item>
          <el-form-item label="微信手机号" required>
            <el-input v-model="accountForm.account" placeholder="绑定微信的手机号" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showAddAccount = false">取消</el-button>
        <el-button type="primary" @click="submitAccount">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CreditCard, Plus } from '@element-plus/icons-vue'
import { getWithdrawAccount, setWithdrawAccount, applyWithdraw, getWithdrawHistory } from '@/api/ambassador'
import { getCommissionSummary } from '@/api/ambassador'

const summary = ref({})
const accountInfo = ref({})
const withdrawRecords = ref([])
const loading = ref(false)
const showWithdraw = ref(false), showAddAccount = ref(false)
const withdrawAmount = ref(0)
const withdrawAccount = ref('')

const balance = computed(() => {
  const total = Number(summary.value.total_commission || 0)
  const withdrawn = Number(summary.value.withdraw_amount || 0)
  return Math.max(0, total - withdrawn)
})

const bankList = ['招商银行', '工商银行', '建设银行', '农业银行', '中国银行', '交通银行', '邮政储蓄银行', '兴业银行', '浦发银行', '民生银行', '平安银行']
const accountForm = reactive({ type: 'bank', name: '', bankName: '', cardNo: '', cardNoConfirm: '', account: '', isDefault: false })

async function loadData() {
  loading.value = true
  try {
    const [sumRes, accRes, histRes] = await Promise.allSettled([
      getCommissionSummary(),
      getWithdrawAccount(),
      getWithdrawHistory()
    ])
    if (sumRes.status === 'fulfilled') summary.value = sumRes.value.data || {}
    if (accRes.status === 'fulfilled') {
      const acc = accRes.value.data || {}
      accountInfo.value = acc
      withdrawAccount.value = acc.account_number || ''
      accountForm.type = acc.account_type || 'bank'
      accountForm.name = acc.account_name || ''
    }
    if (histRes.status === 'fulfilled') withdrawRecords.value = histRes.value.data || []
  } catch {
    ElMessage.error('加载提现信息失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })

function openAddAccount() {
  Object.assign(accountForm, { type: 'bank', name: '', bankName: '', cardNo: '', cardNoConfirm: '', account: '', isDefault: false })
  showAddAccount.value = true
}

async function submitAccount() {
  try {
    const data = {
      account_type: accountForm.type,
      account_name: accountForm.name,
      account_number: accountForm.type === 'bank' ? accountForm.cardNo : accountForm.account
    }
    if (accountForm.type === 'bank') {
      if (!accountForm.name || !accountForm.bankName || !accountForm.cardNo) { ElMessage.warning('请填写完整的银行卡信息'); return }
      if (accountForm.cardNo !== accountForm.cardNoConfirm) { ElMessage.error('两次输入的卡号不一致'); return }
      data.account_number = accountForm.cardNo
    } else {
      if (!accountForm.name || !accountForm.account) { ElMessage.warning('请填写完整信息'); return }
      data.account_number = accountForm.account
    }
    await setWithdrawAccount(data)
    ElMessage.success('收款账户设置成功')
    accountInfo.value = { ...accountInfo.value, ...data }
    showAddAccount.value = false
  } catch {
    ElMessage.error('设置失败，请重试')
  }
}

async function submitWithdraw() {
  try {
    await applyWithdraw({ amount: withdrawAmount.value })
    ElMessage.success(`提现申请已提交！¥${withdrawAmount.value} 将在1-3个工作日内到账`)
    showWithdraw.value = false
    withdrawAmount.value = 0
    loadData() // 刷新数据
  } catch (e) {
    ElMessage.error(e.message || '申请失败，请重试')
  }
}

function fmtTime(t) {
  if (!t) return ''
  return String(t).slice(0, 16).replace('T', ' ')
}
</script>
<style scoped>
.withdraw-page { max-width: 900px; margin: 0 auto; }
.withdraw-page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.balance-card, .account-card, .section-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.balance-label { font-size: 14px; color: #909399; }
.balance-val { font-size: 40px; font-weight: 700; color: #F59E0B; margin: 8px 0; }
.balance-tip { font-size: 13px; color: #909399; }
.account-card h3, .section-card h3 { margin: 0 0 16px; font-size: 16px; font-weight: 700; }
.account-list { display: flex; flex-direction: column; gap: 10px; }
.account-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; }
.account-item.active { border-color: #F59E0B; background: #fff8e1; }
.acc-name { font-weight: 500; font-size: 14px; }
.acc-num { font-size: 12px; color: #909399; }
.amount-text { color: #67C23A; font-weight: 600; }
.withdraw-balance { font-size: 15px; color: #606266; }
</style>
