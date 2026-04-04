<template>
  <div class="rewards-page">
    <div class="page-header">
      <h2>我的奖励</h2>
      <span style="color:#909399;font-size:13px">查看撮合成功获得的物资奖励记录</span>
    </div>

    <!-- 奖励统计 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value" style="color:#67C23A">{{ stats.totalCount }}</div>
        <div class="stat-label">累计获得奖励</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#409EFF">{{ stats.pendingCount }}</div>
        <div class="stat-label">待领取</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#67C23A">{{ stats.claimedCount }}</div>
        <div class="stat-label">已领取</div>
      </div>
    </div>

    <!-- 奖励记录列表 -->
    <div class="rewards-list" v-loading="loading">
      <el-empty v-if="!loading && rewards.length === 0" description="暂无奖励记录" />
      <el-card v-for="item in rewards" :key="item.id" class="reward-card" shadow="hover">
        <div class="reward-header">
          <div class="reward-status">
            <el-tag :type="statusType[item.status]" size="small">
              {{ statusName[item.status] }}
            </el-tag>
          </div>
          <div class="reward-time">{{ formatTime(item.create_time) }}</div>
        </div>
        <div class="reward-content">
          <div class="reward-icon">🎁</div>
          <div class="reward-info">
            <h4>撮合成功奖励</h4>
            <p class="reward-desc">{{ item.reward_content || '撮合成功物资奖励（价值约200元）' }}</p>
            <div class="reward-meta">
              <span v-if="item.demand_title">关联需求：{{ item.demand_title }}</span>
              <span v-if="item.resource_title">关联资源：{{ item.resource_title }}</span>
            </div>
          </div>
        </div>
        <div class="reward-footer" v-if="item.status === 1">
          <el-button type="success" size="small" @click="claimReward(item)">确认领取</el-button>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        layout="prev,pager,next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getRewards } from '@/api/community'
import { claimReward as claimRewardApi } from '@/api/community'

const loading = ref(false)
const rewards = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

const statusName = { 0: '待发放', 1: '待领取', 2: '已领取', 3: '已失效' }
const statusType = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }

const stats = computed(() => ({
  totalCount: rewards.value.length,
  pendingCount: rewards.value.filter(r => r.status === 1).length,
  claimedCount: rewards.value.filter(r => r.status === 2).length
}))

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadRewards() {
  loading.value = true
  try {
    const res = await getRewards({ page: currentPage.value, pageSize })
    rewards.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || rewards.value.length
  } catch {
    rewards.value = []
  } finally {
    loading.value = false
  }
}

async function claimReward(item) {
  try {
    await claimRewardApi({ id: item.id })
    ElMessage.success('已确认领取奖励')
    loadRewards()
  } catch {
    ElMessage.error('领取失败，请重试')
  }
}

function onPageChange(page) {
  currentPage.value = page
  loadRewards()
}

onMounted(() => {
  loadRewards()
})
</script>

<style scoped>
.rewards-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reward-card {
  border-radius: 10px;
}
.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.reward-time {
  font-size: 12px;
  color: #909399;
}
.reward-content {
  display: flex;
  gap: 12px;
}
.reward-icon {
  font-size: 32px;
  line-height: 1;
}
.reward-info {
  flex: 1;
}
.reward-info h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}
.reward-desc {
  margin: 0 0 8px;
  font-size: 13px;
  color: #606266;
}
.reward-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.reward-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  text-align: right;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 768px) {
  .rewards-page { padding: 16px; }
  .stats-row { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: 4px; }
}
</style>
