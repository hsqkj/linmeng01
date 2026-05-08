<template>
  <div class="rewards-page">
    <h2>我的奖励</h2>
    <div class="reward-stats">
      <div class="reward-stat-item">
        <div class="reward-stat-value" style="color:#67C23A">{{ stats.totalCount }}</div>
        <div class="reward-stat-label">累计奖励</div>
      </div>
      <div class="reward-stat-item">
        <div class="reward-stat-value" style="color:#409EFF">{{ stats.pendingCount }}</div>
        <div class="reward-stat-label">待领取</div>
      </div>
      <div class="reward-stat-item">
        <div class="reward-stat-value" style="color:#67C23A">{{ stats.claimedCount }}</div>
        <div class="reward-stat-label">已领取</div>
      </div>
    </div>

    <div class="rewards-list" v-loading="loading">
      <el-empty v-if="!loading && rewards.length === 0" description="暂无奖励记录" :image-size="80" />
      <el-card v-for="item in rewards" :key="item.id" class="reward-card" shadow="hover">
        <div class="reward-header">
          <el-tag :type="statusType[item.status]" size="small">{{ statusName[item.status] }}</el-tag>
          <span class="reward-time">{{ formatTime(item.created_at || item.create_time) }}</span>
        </div>
        <div class="reward-body">
          <span class="reward-icon">🎁</span>
          <div class="reward-info">
            <div class="reward-title">撮合成功奖励</div>
            <div class="reward-desc">{{ item.reward_content || '撮合成功物资奖励' }}</div>
            <div class="reward-meta" v-if="item.demand_title || item.resource_title">
              <span v-if="item.demand_title">关联需求：{{ item.demand_title }}</span>
              <span v-if="item.resource_title">关联资源：{{ item.resource_title }}</span>
            </div>
          </div>
        </div>
        <div class="reward-footer" v-if="item.status === 1">
          <el-button type="success" size="small" @click="handleClaim(item)">确认领取</el-button>
        </div>
      </el-card>
    </div>
    <div class="pagination" v-if="total > pageSize">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="loadRewards" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRewards, claimReward } from '@/api/community'

const loading = ref(true)
const rewards = ref([])
const page = ref(1)
const pageSize = 10
const total = ref(0)
const statusName = { 0: '待发放', 1: '待领取', 2: '已领取', 3: '已失效' }
const statusType = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }
const stats = computed(() => ({
  totalCount: rewards.value.length,
  pendingCount: rewards.value.filter(r => r.status === 1).length,
  claimedCount: rewards.value.filter(r => r.status === 2).length
}))

async function loadRewards() {
  loading.value = true
  try {
    const res = await getRewards({ page: page.value, pageSize })
    rewards.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || rewards.value.length
  } catch {
    rewards.value = []
  } finally {
    loading.value = false
  }
}

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleClaim(item) {
  try {
    await claimReward({ id: item.id })
    ElMessage.success('已确认领取奖励')
    loadRewards()
  } catch {
    ElMessage.error('领取失败，请重试')
  }
}

onMounted(() => {
  loadRewards()
})
</script>

<style scoped>

/* ===== 基础样式（移动端默认，PC覆盖）===== */
.rewards-page { background: #f5f5f5; }

/* ===== PC 端样式（≥769px）===== */
@media (min-width: 769px) {
  .rewards-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 20px 40px;
    min-height: 100vh;
    background: #f0f2f5;
  }
  .rewards-page h2 {
    margin-bottom: 20px;
    font-size: 22px;
    font-weight: 700;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .reward-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .reward-stat-item {
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .reward-stat-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .reward-stat-value { font-size: 36px; font-weight: 700; }
  .reward-stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
  .rewards-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .reward-card {
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .reward-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .reward-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding: 16px 16px 0; }
  .reward-time { font-size: 13px; color: #909399; }
  .reward-body { display: flex; gap: 16px; padding: 0 16px 16px; }
  .reward-icon { font-size: 40px; line-height: 1; }
  .reward-info { flex: 1; }
  .reward-title { font-weight: 600; font-size: 17px; margin-bottom: 6px; }
  .reward-desc { font-size: 14px; color: #606266; margin-bottom: 8px; }
  .reward-meta { font-size: 13px; color: #909399; display: flex; gap: 16px; flex-wrap: wrap; }
  .reward-footer { margin-top: 12px; padding: 12px 16px; border-top: 1px solid #eee; text-align: right; }
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    background: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
}

/* ===== 移动端样式（≤768px）===== */
@media (max-width: 768px) {
  .rewards-page {
    padding: 0 0 70px;
    background: #f5f5f5;
  }
  .rewards-page h2 {
    font-size: 18px;
    margin-bottom: 14px;
    padding: 12px 14px;
    background: white;
    border-radius: 0;
    border-bottom: 1px solid #eee;
  }
  .reward-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
    padding: 0 14px;
  }
  .reward-stat-item {
    background: #f5f7fa;
    border-radius: 10px;
    padding: 14px 8px;
    text-align: center;
  }
  .reward-stat-value { font-size: 24px; font-weight: 700; }
  .reward-stat-label { font-size: 11px; color: #909399; margin-top: 4px; }
  .rewards-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 14px;
  }
  .reward-card {
    border-radius: 10px;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .reward-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 12px 12px 0; }
  .reward-time { font-size: 11px; color: #909399; }
  .reward-body { display: flex; gap: 12px; padding: 0 12px 12px; }
  .reward-icon { font-size: 28px; line-height: 1; }
  .reward-info { flex: 1; }
  .reward-title { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
  .reward-desc { font-size: 12px; color: #606266; margin-bottom: 5px; }
  .reward-meta { font-size: 11px; color: #909399; display: flex; gap: 10px; flex-wrap: wrap; }
  .reward-footer { margin-top: 10px; padding: 10px 12px; border-top: 1px solid #eee; text-align: right; }
  .pagination {
    justify-content: center;
    padding: 14px;
    margin-top: 0;
  }
}
</style>
