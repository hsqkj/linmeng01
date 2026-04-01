<template>
  <div class="page">
    <div class="page-header">
      <h2>我的需求</h2>
      <el-button type="primary" @click="$router.push('/community/demands/publish')">
        <el-icon><Plus /></el-icon>
        发布需求
      </el-button>
    </div>
    
    <el-table :data="demands" stripe style="width: 100%">
      <el-table-column prop="title" label="需求标题" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="deadline" label="截止日期" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'warning'">
            {{ row.status === 'published' ? '已发布' : '待审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default>
          <el-button text type="primary">查看</el-button>
          <el-button text type="warning">编辑</el-button>
          <el-button text type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const demands = ref([])

onMounted(async () => {
  try {
    const res = await fetch('/api/demands')
    const data = await res.json()
    if (data.success) demands.value = data.data
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
