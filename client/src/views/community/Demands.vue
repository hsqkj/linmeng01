<template>
  <div class="page">
    <div class="page-header">
      <h2>我的需求</h2>
      <el-button type="primary" @click="$router.push('/community/demands/publish')">
        <el-icon><Plus /></el-icon>
        发布需求
      </el-button>
    </div>

    <el-card v-loading="loading" element-loading-text="加载中...">
      <el-table :data="demands" stripe style="width: 100%">
        <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="demand_type" label="类型" width="120">
          <template #default="{ row }">
            {{ demandTypeName[row.demand_type] || row.demand_type }}
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" width="120" />
        <el-table-column prop="view_count" label="浏览" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusName[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="$router.push(`/community/demands/${row.id}`)">查看</el-button>
            <el-button text type="warning" size="small" @click="editDemand(row)" v-if="row.status !== 1">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteDemand(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          background layout="prev, pager, next"
          :total="total" :page-size="pageSize"
          v-model:current-page="currentPage"
          @current-change="loadDemands" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMyDemands, deleteDemand as apiDelete } from '@/api/community'

const router = useRouter()
const loading = ref(false)
const demands = ref([])
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

const statusName = { 0: '待审核', 1: '已发布', 2: '已下架' }
const statusType = { 0: 'warning', 1: 'success', 2: 'info' }
const demandTypeName = {
  '活动赞助': '活动赞助', '专家服务': '专家服务', '空间运营': '空间运营',
  '物资赞助': '物资赞助', '健康服务': '健康服务', '教育培训': '教育培训'
}

async function loadDemands() {
  loading.value = true
  try {
    const res = await getMyDemands({ page: currentPage.value, pageSize })
    demands.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    demands.value = []
  } finally {
    loading.value = false
  }
}

function editDemand(row) {
  router.push(`/community/demands/${row.id}`)
}

async function deleteDemand(row) {
  try {
    await ElMessageBox.confirm(`确定要删除需求「${row.title}」吗？`, '确认删除', { type: 'warning' })
    await apiDelete(row.id)
    ElMessage.success('已删除')
    loadDemands()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadDemands()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }
</style>
