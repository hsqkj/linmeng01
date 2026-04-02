<template>
  <div class="page" v-loading="loading"><h2>财务管理</h2>
    <div class="stats-row">
      <div class="sc" v-for="s in stats" :key="s.label"><div class="sv" :style="{color:s.color}">{{ s.value }}</div><div class="sl">{{ s.label }}</div></div>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="平台概览" name="fee">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="累计会费收入">
            <span style="color:#67C23A;font-weight:700">¥{{ Number(finance.memberIncome || 0).toLocaleString() }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="撮合成功次数">
            <span style="color:#409EFF;font-weight:700">{{ finance.matchCount || 0 }}次</span>
          </el-descriptions-item>
          <el-descriptions-item label="累计大使提成支出">
            <span style="color:#E6A23C;font-weight:700">¥{{ Number(finance.commissionPay || 0).toLocaleString() }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="累计撮合奖励发放">
            <span style="color:#F56C6C;font-weight:700">¥{{ Number(finance.rewardPay || 0).toLocaleString() }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="平台收益估算" :span="2">
            <span style="font-size:18px;font-weight:700;color:#303133">¥{{ Number(finance.profit || 0).toLocaleString() }}</span>
            <span style="font-size:12px;color:#909399;margin-left:8px">（会费收入 - 大使提成 - 奖励发放）</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="大使结算" name="commission">
        <el-alert title="大使提成自动结算：招商大使的提成在商家缴费后自动生成，每月1日系统结算上月待结算提成。" type="info" :closable="false" style="margin-bottom:16px" />
        <el-empty description="请到大使管理查看详细提成记录" :image-size="60" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getFinance } from '@/api/admin'

const activeTab = ref('fee')
const finance = ref({})
const loading = ref(false)

const stats = [
  { label: '累计会费收入', value: '¥ 0', color: '#67C23A' },
  { label: '撮合次数', value: '0次', color: '#409EFF' },
  { label: '累计大使提成', value: '¥ 0', color: '#E6A23C' },
  { label: '累计奖励发放', value: '¥ 0', color: '#F56C6C' }
]

async function loadFinance() {
  loading.value = true
  try {
    const res = await getFinance()
    finance.value = res.data || {}
    stats[0].value = '¥ ' + Number(finance.value.memberIncome || 0).toLocaleString()
    stats[1].value = (finance.value.matchCount || 0) + '次'
    stats[2].value = '¥ ' + Number(finance.value.commissionPay || 0).toLocaleString()
    stats[3].value = '¥ ' + Number(finance.value.rewardPay || 0).toLocaleString()
  } catch {}
  finally { loading.value = false }
}

onMounted(() => { loadFinance() })
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.sc { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.sv { font-size: 24px; font-weight: 700; }
.sl { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
