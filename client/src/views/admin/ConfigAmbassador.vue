<template>
  <div class="page">
    <h2>招商大使提成配置</h2>
    <div class="tip-box">💡 提成比例调整后仅对新订单生效，历史已结算订单不受影响</div>

    <!-- 提成比例配置 -->
    <div class="section-card">
      <div class="section-title">提成比例设置</div>
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

    <!-- 不同会员等级的提成差异配置 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">各会员等级提成说明</div>
      <p style="color:#909399;font-size:13px;margin:0 0 12px">可针对不同会员等级设置不同的大使提成率（如高等级商家奖励更高提成）</p>
      <el-table :data="levelCommissions" stripe border>
        <el-table-column prop="level" label="等级" width="60" align="center" />
        <el-table-column prop="name" label="会员名称" width="120" />
        <el-table-column prop="fee" label="年费" width="100">
          <template #default="{ row }">¥{{ row.fee.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="首次提成" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.firstRate" :min="0" :max="50" :precision="1" size="small" style="width:100px" />
            <span style="font-size:12px">%</span>
          </template>
        </el-table-column>
        <el-table-column label="首次金额（预估）" width="140" align="center">
          <template #default="{ row }">
            <span style="color:#E6A23C;font-weight:600">¥{{ Math.round(row.fee * row.firstRate / 100).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="续费提成" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.renewRate" :min="0" :max="30" :precision="1" size="small" style="width:100px" />
            <span style="font-size:12px">%</span>
          </template>
        </el-table-column>
        <el-table-column label="续费金额（预估）" width="140" align="center">
          <template #default="{ row }">
            <span style="color:#67C23A;font-weight:600">¥{{ Math.round(row.fee * row.renewRate / 100).toLocaleString() }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 结算规则 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">结算规则说明</div>
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { saveAmbassadorConfig } from '@/api/admin'

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

const levelCommissions = reactive([
  { level: 1, name: '普通会员', fee: 0, firstRate: 0, renewRate: 0 },
  { level: 2, name: '银牌会员', fee: 999, firstRate: 20, renewRate: 10 },
  { level: 3, name: '金牌会员', fee: 2999, firstRate: 20, renewRate: 10 },
  { level: 4, name: '铂金会员', fee: 5999, firstRate: 20, renewRate: 10 },
  { level: 5, name: '钻石会员', fee: 12000, firstRate: 20, renewRate: 10 }
])

async function saveConfig() {
  try {
    await saveAmbassadorConfig({
      ambassador_commission: {
        ...config,
        level_commissions: levelCommissions.map(l => ({ level: l.level, name: l.name, fee: l.fee, first_rate: l.firstRate, renew_rate: l.renewRate }))
      }
    })
    ElMessage.success('提成配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}
function resetConfig() {
  config.firstRate = 20; config.renewRate = 10; config.minWithdraw = 100; config.settlePeriod = 'monthly'; config.arrivalDays = '3'; config.maxPerOrder = 0; config.expirePolicy = 'keep_first'
  ElMessage.success('已重置为默认值')
}
</script>
<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #fff8e1; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #E6A23C; font-size: 14px; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: block; }
.unit { margin: 0 8px; color: #606266; }
.hint { font-size: 12px; color: #909399; margin-left: 8px; }
</style>
