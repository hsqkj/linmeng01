<template>
  <div class="dashboard" v-loading="loading">
    <div class="dashboard-header">
      <h2>数据大屏</h2>
      <div class="period-filter">
        <el-radio-group v-model="period" size="default" @change="loadDashboard">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="day">今日</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="year">本年</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-number" style="color:#409EFF">{{ stats.total?.communities || 0 }}</div>
        <div class="stat-label">社区用户</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#67C23A">{{ stats.total?.merchants || 0 }}</div>
        <div class="stat-label">商家用户</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#E6A23C">{{ stats.total?.ambassadors || 0 }}</div>
        <div class="stat-label">招商大使</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#f56c6c">{{ stats.total?.demands || 0 }}</div>
        <div class="stat-label">已发布需求</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#36cfc9">{{ stats.total?.resources || 0 }}</div>
        <div class="stat-label">已发布资源</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#b37feb">{{ stats.total?.totalViews || 0 }}</div>
        <div class="stat-label">总浏览量</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#73d13d">{{ stats.total?.completedMatches || 0 }}</div>
        <div class="stat-label">撮合成功</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#909399">{{ pendingTotal }}</div>
        <div class="stat-label">待审核</div>
        <el-button type="warning" size="small" style="margin-top:8px" @click="router.push('/admin/audit/demands')">去审核</el-button>
      </el-card>
    </div>

    <el-card>
      <template #header><span>待审核统计</span></template>
      <div class="pending-items">
        <div class="pending-item">
          <span>待审核社区</span><strong>{{ stats.pending?.communities || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/users/community')">查看</el-button>
        </div>
        <div class="pending-item">
          <span>待审核商家</span><strong>{{ stats.pending?.merchants || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/users/merchant')">查看</el-button>
        </div>
        <div class="pending-item">
          <span>待审核需求</span><strong>{{ stats.pending?.demands || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/audit/demands')">查看</el-button>
        </div>
        <div class="pending-item">
          <span>待审核资源</span><strong>{{ stats.pending?.resources || 0 }}</strong>
          <el-button text type="primary" size="small" @click="router.push('/admin/audit/resources')">查看</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboard } from '@/api/admin'

const router = useRouter()
const loading = ref(false)
const stats = ref({})
const pendingTotal = ref(0)
const period = ref('all')

async function loadDashboard() {
  loading.value = true
  try {
    const res = await getDashboard({ period: period.value })
    stats.value = res.data || {}
    pendingTotal.value = res.data?.pending?.total || 0
  } catch { /* 静默失败 */ }
  finally { loading.value = false }
}

onMounted(() => { loadDashboard() })
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card { text-align: center; }

.stat-number {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  color: #909399;
  margin: 6px 0 0;
  font-size: 13px;
}

.pending-items { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.pending-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
.pending-item span { flex: 1; color: #606266; }
.pending-item strong { font-size: 22px; color: #F56C6C; font-weight: 700; min-width: 50px; text-align: right; }

@media (max-width: 768px) {
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .dashboard-header h2 { font-size: 18px; }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .stat-number { font-size: 22px; }
  .stat-label { font-size: 12px; }
  .pending-items { grid-template-columns: 1fr; }
}
</style>
