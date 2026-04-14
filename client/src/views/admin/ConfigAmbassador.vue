<template>
  <div class="page" v-loading="loading">
    <h2>招商大使配置</h2>
    <div class="tip-box">💡 提成比例调整后仅对新订单生效，历史已结算订单不受影响</div>

    <!-- 大使等级设置 -->
    <div class="section-card" style="margin-bottom:16px">
      <div class="section-title">🏆 大使等级设置</div>
      <p style="color:#909399;font-size:13px;margin:0 0 12px">设置不同等级的大使及其提成比例。注册即为最低级，缴费升级后可获得更高提成。</p>
      <el-table :data="ambassadorLevels" stripe border>
        <el-table-column label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type" size="small">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="升级费用" width="130">
          <template #default="{ row }">
            <span v-if="row.fee === 0" style="color:#67C23A;font-weight:600">免费注册</span>
            <template v-else>
              <el-input-number v-model="row.fee" :min="0" :step="100" size="small" style="width:100px" />
              <span style="font-size:12px">元</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="提成比例" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.commissionRate" :min="0" :max="100" :precision="1" size="small" style="width:100px" />
            <span style="font-size:12px">%</span>
          </template>
        </el-table-column>
        <el-table-column label="可发展下级" width="120" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.canDevelopSub" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="下级提成比例" width="140" align="center">
          <template #default="{ row }">
            <template v-if="row.canDevelopSub">
              <el-input-number v-model="row.subCommissionRate" :min="0" :max="50" :precision="1" size="small" style="width:90px" />
              <span style="font-size:12px">%</span>
            </template>
            <span v-else style="color:#c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="权益说明">
          <template #default="{ row }">
            <el-input v-model="row.benefits" placeholder="如：专属培训、优先推广资源" size="small" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 提成比例配置 -->
    <div class="section-card">
      <div class="section-title">💰 提成比例配置</div>
      <el-form label-width="180px" style="max-width:600px">
        <el-form-item label="首次入会提成比例">
          <el-input-number v-model="config.firstRate" :min="0" :max="50" :precision="1" style="width:130px" />
          <span class="unit">%</span>
          <span class="hint">商家首次缴纳会费时，大使获得的提成比例</span>
        </el-form-item>
        <el-form-item label="续费提成比例">
          <el-input-number v-model="config.renewRate" :min="0" :max="30" :precision="1" style="width:130px" />
          <span class="unit">%</span>
          <span class="hint">商家每年续费时，大使获得的提成比例</span>
        </el-form-item>
        <el-form-item label="最低提现金额">
          <el-input-number v-model="config.minWithdraw" :min="0" :step="100" style="width:130px" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="结算周期">
          <el-select v-model="config.settlePeriod" style="width:180px">
            <el-option label="每月1日结算" value="monthly" />
            <el-option label="每季度结算" value="quarterly" />
            <el-option label="手动结算" value="manual" />
          </el-select>
        </el-form-item>
        <el-form-item label="提现到账时间">
          <el-select v-model="config.arrivalDays" style="width:180px">
            <el-option label="1个工作日" value="1" />
            <el-option label="3个工作日" value="3" />
            <el-option label="7个工作日" value="7" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 结算规则 -->
    <div class="section-card" style="margin-top:16px">
      <div class="section-title">📋 结算规则说明</div>
      <el-form label-width="160px" style="max-width:700px">
        <el-form-item label="单笔最高提成上限">
          <el-input-number v-model="config.maxPerOrder" :min="0" :step="500" style="width:130px" />
          <span class="unit">元</span>
          <span class="hint">0=不限制</span>
        </el-form-item>
        <el-form-item label="大使资格到期处理">
          <el-select v-model="config.expirePolicy" style="width:200px">
            <el-option label="停止续费提成，首次提成保留" value="keep_first" />
            <el-option label="全部停止提成" value="stop_all" />
            <el-option label="按月递减（每月减5%）" value="decay" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="config.remark" type="textarea" :rows="3" placeholder="可填写对大使展示的提成政策说明..." style="width:100%" />
        </el-form-item>
      </el-form>
    </div>

    <div style="margin-top:16px;text-align:right">
      <el-button @click="resetConfig">重置默认</el-button>
      <el-button type="primary" size="large" @click="saveConfig">保存配置</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAmbassadorConfig, saveAmbassadorConfig } from '@/api/admin'

const loading = ref(false)

// 大使等级配置
const ambassadorLevels = reactive([
  { level: 1, name: '主管级', type: 'info', fee: 0, commissionRate: 25, canDevelopSub: false, subCommissionRate: 0, benefits: '注册即为大使，获得基础提成' },
  { level: 2, name: '经理级', type: 'warning', fee: 399, commissionRate: 30, canDevelopSub: true, subCommissionRate: 10, benefits: '可发展下级大使，获得下级提成' },
  { level: 3, name: '总监级', type: 'danger', fee: 1999, commissionRate: 40, canDevelopSub: true, subCommissionRate: 10, benefits: '最高等级，全额提成+下级提成' }
])

const config = reactive({
  firstRate: 20,
  renewRate: 10,
  minWithdraw: 100,
  settlePeriod: 'monthly',
  arrivalDays: '3',
  maxPerOrder: 0,
  expirePolicy: 'keep_first',
  remark: '招商大使提成政策：成功邀请商家入驻并完成付费后，首次入会按年费的20%结算提成；商家每年续费后，按续费金额的10%追加提成。提成每月1日统一结算，最低提现100元，3个工作日内到账。'
})

async function loadConfig() {
  loading.value = true
  try {
    const res = await getAmbassadorConfig()
    const data = res.data || {}
    const ac = data.ambassador_commission || {}
    if (ac.firstRate !== undefined) config.firstRate = ac.firstRate
    if (ac.renewRate !== undefined) config.renewRate = ac.renewRate
    if (ac.minWithdraw !== undefined) config.minWithdraw = ac.minWithdraw
    if (ac.settlePeriod) config.settlePeriod = ac.settlePeriod
    if (ac.arrivalDays) config.arrivalDays = String(ac.arrivalDays)
    if (ac.maxPerOrder !== undefined) config.maxPerOrder = ac.maxPerOrder
    if (ac.expirePolicy) config.expirePolicy = ac.expirePolicy
    if (ac.remark) config.remark = ac.remark
    // 加载大使等级配置
    if (ac.ambassador_levels && ac.ambassador_levels.length > 0) {
      ambassadorLevels.splice(0, ambassadorLevels.length, ...ac.ambassador_levels.map(l => ({
        level: l.level, name: l.name, type: ['info', 'warning', 'danger'][l.level - 1] || 'info',
        fee: l.fee, commissionRate: l.commissionRate, canDevelopSub: l.canDevelopSub,
        subCommissionRate: l.subCommissionRate || 0, benefits: l.benefits || ''
      })))
    }
  } catch {}
  finally { loading.value = false }
}

async function saveConfig() {
  try {
    loading.value = true
    await saveAmbassadorConfig({
      ambassador_commission: {
        ...config,
        arrivalDays: Number(config.arrivalDays),
        ambassador_levels: ambassadorLevels.map(l => ({
          level: l.level, name: l.name, fee: l.fee,
          commissionRate: l.commissionRate, canDevelopSub: l.canDevelopSub,
          subCommissionRate: l.subCommissionRate, benefits: l.benefits
        }))
      }
    })
    ElMessage.success('招商配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally { loading.value = false }
}

function resetConfig() {
  config.firstRate = 20; config.renewRate = 10; config.minWithdraw = 100; config.settlePeriod = 'monthly'; config.arrivalDays = '3'; config.maxPerOrder = 0; config.expirePolicy = 'keep_first'
  config.remark = '招商大使提成政策：成功邀请商家入驻并完成付费后，首次入会按年费的20%结算提成；商家每年续费后，按续费金额的10%追加提成。提成每月1日统一结算，最低提现100元，3个工作日内到账。'
  ambassadorLevels.splice(0, ambassadorLevels.length,
    { level: 1, name: '主管级', type: 'info', fee: 0, commissionRate: 25, canDevelopSub: false, subCommissionRate: 0, benefits: '注册即为大使，获得基础提成' },
    { level: 2, name: '经理级', type: 'warning', fee: 399, commissionRate: 30, canDevelopSub: true, subCommissionRate: 10, benefits: '可发展下级大使，获得下级提成' },
    { level: 3, name: '总监级', type: 'danger', fee: 1999, commissionRate: 40, canDevelopSub: true, subCommissionRate: 10, benefits: '最高等级，全额提成+下级提成' }
  )
  ElMessage.success('已重置为默认值')
}

onMounted(() => { loadConfig() })
</script>
<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #fff8e1; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #E6A23C; font-size: 14px; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: block; }
.unit { margin: 0 8px; color: #606266; }
.hint { font-size: 12px; color: #909399; margin-left: 8px; }

@media (max-width: 768px) {
  .page {
    padding: 12px;
    padding-bottom: 70px;
  }
  .page h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  .tip-box {
    padding: 8px 12px;
    font-size: 12px;
    margin-bottom: 12px;
  }
  .section-card {
    padding: 14px;
    border-radius: 8px;
  }
  .section-title {
    font-size: 14px;
  }
  :deep(.el-form) {
    max-width: 100% !important;
  }
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  :deep(.el-form-item__label) {
    font-size: 12px;
    width: 100px !important;
  }
  :deep(.el-form-item__content) {
    font-size: 12px;
    margin-left: 100px !important;
  }
  :deep(.el-table) {
    font-size: 10px;
  }
  :deep(.el-table__header th) {
    font-size: 9px;
    padding: 4px 2px;
  }
  :deep(.el-table__body td) {
    padding: 4px 2px;
  }
  div[style*="text-align:right"] {
    text-align: center !important;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  div[style*="text-align:right"] .el-button {
    width: 100%;
  }
}
</style>
