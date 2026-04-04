<template>
  <div class="page" v-loading="loading">
    <h2>财务管理</h2>

    <!-- 核心指标 -->
    <div class="stats-row">
      <div class="sc" v-for="s in stats" :key="s.label">
        <div class="sv" :style="{color:s.color}">{{ s.value }}</div>
        <div class="sl">{{ s.label }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 平台概览 -->
      <el-tab-pane label="平台概览" name="overview">
        <el-card>
          <template #header><span>财务总览</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="累计会费收入">
              <span style="color:#67C23A;font-weight:700">¥{{ Number(finance.memberIncome||0).toLocaleString() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="撮合成功次数">
              <span style="color:#409EFF;font-weight:700">{{ finance.matchCount||0 }}次</span>
            </el-descriptions-item>
            <el-descriptions-item label="累计大使提成支出">
              <span style="color:#E6A23C;font-weight:700">¥{{ Number(finance.commissionPay||0).toLocaleString() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="累计撮合奖励发放">
              <span style="color:#F56C6C;font-weight:700">¥{{ Number(finance.rewardPay||0).toLocaleString() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="平台收益估算" :span="2">
              <span style="font-size:18px;font-weight:700;color:#303133">
                ¥{{ Number(finance.profit||0).toLocaleString() }}
              </span>
              <span style="font-size:12px;color:#909399;margin-left:8px">（会费收入 - 大使提成 - 奖励发放）</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-tab-pane>

      <!-- 撮合奖励记录 -->
      <el-tab-pane label="撮合奖励" name="rewards">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>撮合奖励发放记录</span>
              <el-button type="primary" size="small" @click="showConfigDialog">配置奖励规则</el-button>
            </div>
          </template>

          <el-table :data="rewardList" stripe>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="社区" min-width="120">
              <template #default="{row}">
                {{ row.community_name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="关联撮合" min-width="150">
              <template #default="{row}">
                <span v-if="row.demand_title">需求：{{ row.demand_title }}</span>
                <span v-if="row.resource_title"> | 资源：{{ row.resource_title }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="reward_content" label="奖励内容" min-width="150" />
            <el-table-column label="状态" width="100">
              <template #default="{row}">
                <el-tag :type="rewardStatusType[row.status]" size="small">
                  {{ rewardStatusName[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="发放时间" width="160">
              <template #default="{row}">
                {{ formatTime(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column label="领取时间" width="160">
              <template #default="{row}">
                {{ row.claimed_at ? formatTime(row.claimed_at) : '-' }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              layout="prev,pager,next,total"
              :total="rewardTotal"
              :page-size="rewardPageSize"
              :current-page="rewardPage"
              @current-change="loadRewards"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 大使结算 -->
      <el-tab-pane label="大使结算" name="commission">
        <el-card>
          <template #header><span>招商大使提成结算记录</span></template>
          <el-alert
            title="提成自动结算规则"
            type="info"
            :closable="false"
            style="margin-bottom:16px"
          >
            <template #default>
              <ul style="margin:8px 0 0;padding-left:20px">
                <li>大使首次提成：20%（商家首次缴费金额的20%）</li>
                <li>大使续费提成：10%（商家续费金额的10%）</li>
                <li>系统每月1日自动结算上月待结算提成</li>
              </ul>
            </template>
          </el-alert>

          <el-table :data="commissionList" stripe>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="大使" min-width="100">
              <template #default="{row}">
                {{ row.ambassador_name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column label="商家" min-width="120">
              <template #default="{row}">
                {{ row.merchant_name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="缴费类型" width="100">
              <template #default="{row}">
                <el-tag :type="row.type === 1 ? 'success' : 'warning'" size="small">
                  {{ row.type === 1 ? '首次' : '续费' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="缴费金额" width="100">
              <template #default="{row}">
                ¥{{ Number(row.amount||0).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="提成金额" width="100">
              <template #default="{row}">
                <span style="color:#67C23A;font-weight:600">
                  ¥{{ Number(row.commission||0).toLocaleString() }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{row}">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '已结算' : '待结算' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="生成时间" width="160">
              <template #default="{row}">
                {{ formatTime(row.create_time) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 奖励配置弹窗 -->
    <el-dialog v-model="showConfig" title="撮合奖励配置" width="500px">
      <el-form :model="rewardConfig" label-width="100px">
        <el-form-item label="每笔奖励价值">
          <el-input-number v-model="rewardConfig.matchReward" :min="0" :step="50" />
          <span style="margin-left:8px;color:#909399">元/笔</span>
        </el-form-item>
        <el-form-item label="奖励说明">
          <el-input v-model="rewardConfig.rewardDesc" type="textarea" :rows="3" placeholder="如：撮合成功奖励物资（价值约200元）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfig=false">取消</el-button>
        <el-button type="primary" @click="handleSaveRewardConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getFinance, getRewardConfig, saveRewardConfig, getRewardRecords, getCommissionRecords } from '@/api/admin'

const activeTab = ref('overview')
const loading = ref(false)
const finance = ref({})
const showConfig = ref(false)

const rewardConfig = reactive({ matchReward: 200, rewardDesc: '撮合成功奖励物资（价值约200元）' })
const rewardList = ref([])
const rewardTotal = ref(0)
const rewardPage = ref(1)
const rewardPageSize = 10
const commissionList = ref([])

const rewardStatusName = { 0: '待发放', 1: '待领取', 2: '已领取', 3: '已失效' }
const rewardStatusType = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }

const stats = computed(() => [
  { label: '累计会费收入', value: '¥' + Number(finance.value.memberIncome||0).toLocaleString(), color: '#67C23A' },
  { label: '撮合次数', value: (finance.value.matchCount||0) + '次', color: '#409EFF' },
  { label: '累计大使提成', value: '¥' + Number(finance.value.commissionPay||0).toLocaleString(), color: '#E6A23C' },
  { label: '累计奖励发放', value: '¥' + Number(finance.value.rewardPay||0).toLocaleString(), color: '#F56C6C' }
])

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadFinance() {
  try {
    const res = await getFinance()
    finance.value = res.data || {}
  } catch {}
}

async function loadRewards(page = 1) {
  rewardPage.value = page
  try {
    const res = await getRewardRecords({ page, pageSize: rewardPageSize })
    rewardList.value = res.data?.list || res.data || []
    rewardTotal.value = res.data?.total || rewardList.value.length
  } catch {}
}

async function loadCommission() {
  try {
    const res = await getCommissionRecords()
    commissionList.value = res.data || []
  } catch {}
}

async function loadRewardConfig() {
  try {
    const res = await getRewardConfig()
    if (res.data?.match_reward) {
      rewardConfig.matchReward = res.data.match_reward.value || 200
      rewardConfig.rewardDesc = res.data.match_reward.desc || ''
    }
  } catch {}
}

function showConfigDialog() {
  loadRewardConfig()
  showConfig.value = true
}

async function handleSaveRewardConfig() {
  try {
    await saveRewardConfig({ match_reward: rewardConfig })
    ElMessage.success('配置已保存')
    showConfig.value = false
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadFinance()
  loadRewards()
  loadCommission()
})
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 24px; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.sc { background: #fff; border-radius: 10px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.sv { font-size: 24px; font-weight: 700; }
.sl { font-size: 13px; color: #909399; margin-top: 4px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
