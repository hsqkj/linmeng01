<template>
  <div class="dashboard" v-loading="loading">
    <h2>数据大屏</h2>
    
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-number" style="color:#409EFF">{{ (stats.total?.communities || 0) + (stats.total?.merchants || 0) }}</div>
        <div class="stat-label">注册用户</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#67C23A">{{ stats.total?.communities || 0 }}</div>
        <div class="stat-label">社区用户</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#E6A23C">{{ stats.total?.demands || 0 }}</div>
        <div class="stat-label">已发布需求</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#36cfc9">{{ stats.total?.resources || 0 }}</div>
        <div class="stat-label">已发布资源</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#f56c6c">{{ stats.total?.completedMatches || 0 }}</div>
        <div class="stat-label">撮合成功</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#909399">{{ pendingTotal }}</div>
        <div class="stat-label">待审核</div>
        <el-button type="warning" size="small" style="margin-top:8px" @click="router.push('/admin/audit-demands')">去审核</el-button>
      </el-card>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header><span>待审核统计</span></template>
          <div class="pending-items">
            <div class="pending-item">
              <span>待审核社区</span><strong>{{ stats.pending?.communities || 0 }}</strong>
              <el-button text type="primary" size="small" @click="router.push('/admin/users-community')">查看</el-button>
            </div>
            <div class="pending-item">
              <span>待审核商家</span><strong>{{ stats.pending?.merchants || 0 }}</strong>
              <el-button text type="primary" size="small" @click="router.push('/admin/users-merchant')">查看</el-button>
            </div>
            <div class="pending-item">
              <span>待审核需求</span><strong>{{ stats.pending?.demands || 0 }}</strong>
              <el-button text type="primary" size="small" @click="router.push('/admin/audit-demands')">查看</el-button>
            </div>
            <div class="pending-item">
              <span>待审核资源</span><strong>{{ stats.pending?.resources || 0 }}</strong>
              <el-button text type="primary" size="small" @click="router.push('/admin/audit-resources')">查看</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header><span>平台概况</span></template>
          <div class="overview-items">
            <div class="overview-item"><span>招商大使</span><strong>{{ stats.total?.ambassadors || 0 }}人</strong></div>
            <div class="overview-item"><span>活跃商家</span><strong>{{ stats.total?.merchants || 0 }}家</strong></div>
            <div class="overview-item"><span>撮合成功</span><strong>{{ stats.total?.completedMatches || 0 }}次</strong></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
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

async function loadDashboard() {
  loading.value = true
  try {
    const res = await getDashboard()
    stats.value = res.data || {}
    pendingTotal.value = res.data?.pending?.total || 0
  } catch { /* 静默失败 */ }
  finally { loading.value = false }
}

onMounted(() => { loadDashboard() })
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card { text-align: center; }

.stat-number {
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  color: #909399;
  margin: 8px 0;
}

.stat-trend {
  font-size: 14px;
}

.stat-trend.up { color: #67C23A; }
.stat-trend.down { color: #f56c6c; }

.dashboard h2 {
  margin-bottom: 20px;
}
.pending-items { display: flex; flex-direction: column; gap: 12px; }
.pending-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
.pending-item span { flex: 1; color: #606266; }
.pending-item strong { font-size: 20px; color: #F56C6C; font-weight: 700; min-width: 50px; }
.overview-items { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.overview-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px; background: #f8f9fa; border-radius: 10px; }
.overview-item span { font-size: 13px; color: #909399; }
.overview-item strong { font-size: 22px; font-weight: 700; color: #303133; }
</style>
