<template>
  <div class="dashboard">
    <h2>数据大屏</h2>
    
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-number" style="color:#409EFF">1,234</div>
        <div class="stat-label">总注册数</div>
        <div class="stat-trend up">↑ 12%</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#67C23A">328</div>
        <div class="stat-label">活跃用户</div>
        <div class="stat-trend up">↑ 8%</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#E6A23C">156</div>
        <div class="stat-label">已发布需求</div>
        <div class="stat-trend up">↑ 15%</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#36cfc9">89</div>
        <div class="stat-label">已发布资源</div>
        <div class="stat-trend up">↑ 10%</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#f56c6c">67</div>
        <div class="stat-label">撮合成功</div>
        <div class="stat-trend up">↑ 22%</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-number" style="color:#909399">12</div>
        <div class="stat-label">待审核</div>
        <el-button type="warning" size="small" style="margin-top:8px">去审核</el-button>
      </el-card>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header><span>待审核列表</span></template>
          <el-table :data="pendingReviews" size="small">
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="time" label="提交时间" width="120" />
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button type="success" size="small">通过</el-button>
                <el-button type="danger" size="small">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header><span>最近撮合</span></template>
          <el-table :data="recentMatches" size="small">
            <el-table-column prop="community" label="社区" />
            <el-table-column prop="merchant" label="商家" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const pendingReviews = ref([
  { type: '社区', name: '朝阳公园社区', time: '03-31 20:00' },
  { type: '需求', name: '端午节龙舟赛赞助', time: '03-31 19:30' },
  { type: '商家', name: '全家便利店', time: '03-31 18:45' },
  { type: '资源', name: '少儿编程课程', time: '03-31 17:20' },
  { type: '需求', name: '社区书画展览', time: '03-31 16:00' }
])

const recentMatches = ref([
  { community: '阳光花园', merchant: '星巴克', status: '已完成' },
  { community: '幸福里', merchant: '京东健康', status: '对接中' },
  { community: '翠竹苑', merchant: '平安保险', status: '已完成' },
  { community: '阳光花园', merchant: '新东方', status: '对接中' },
  { community: '幸福里', merchant: '华润万家', status: '已完成' }
])
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
</style>
