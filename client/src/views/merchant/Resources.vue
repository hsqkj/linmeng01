<template>
  <div class="page">
    <div class="page-header">
      <h2>我的资源</h2>
      <el-button type="primary" @click="$router.push('/merchant/resources/publish')">
        <el-icon><Plus /></el-icon> 发布资源
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索资源名称" style="width:220px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.status" placeholder="状态" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option label="已发布" value="1" />
        <el-option label="待审核" value="0" />
        <el-option label="已下架" value="2" />
      </el-select>
      <el-select v-model="filters.type" placeholder="资源类型" style="width:150px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in resourceTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 资源列表 -->
    <el-table :data="myResources" stripe v-loading="loading">
      <el-table-column prop="title" label="资源标题" min-width="200" />
      <el-table-column prop="resource_type" label="资源类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ row.resource_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType[row.status]">{{ statusLabel[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="浏览量" width="80" align="center" />
      <el-table-column prop="created_at" label="发布时间" width="110">
        <template #default="{ row }">
          {{ row.created_at ? row.created_at.split('T')[0] : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row)">查看</el-button>
          <el-button type="success" size="small" text @click="editResource(row)">编辑</el-button>
          <el-button v-if="row.status === 1" type="warning" size="small" text @click="toggleStatus(row, 2)">下架</el-button>
          <el-button v-else-if="row.status === 2" type="success" size="small" text @click="toggleStatus(row, 1)">上架</el-button>
          <el-button type="danger" size="small" text @click="deleteResource(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        layout="prev,pager,next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="onPageChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEdit" title="编辑资源" width="700px">
      <el-form :model="editForm" label-width="110px">
        <el-form-item label="资源标题" required>
          <el-input v-model="editForm.title" placeholder="如：星巴克活动赞助计划" />
        </el-form-item>
        <el-form-item label="资源类型" required>
          <el-select v-model="editForm.resource_type" style="width:100%">
            <el-option v-for="t in resourceTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源说明">
          <el-input v-model="editForm.content" type="textarea" :rows="3" placeholder="简要描述资源内容..." />
        </el-form-item>
        <el-form-item label="可提供内容">
          <el-input v-model="editForm.provide_content" type="textarea" :rows="2" placeholder="如：活动资金1万~5万元，物资支持等" />
        </el-form-item>
        <el-form-item label="期望回报">
          <el-input v-model="editForm.expected_return" type="textarea" :rows="2" placeholder="如：冠名权、展台位置、公众号推文等" />
        </el-form-item>
        <el-form-item label="标签">
          <div class="tag-selector">
            <el-check-tag v-for="t in allTags" :key="t" :checked="editForm.tags.includes(t)" @change="toggleTag(t)" style="margin:4px">{{ t }}</el-check-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { getMyResources, updateResource, deleteResource as delResource } from '@/api/merchant'

const router = useRouter()

const showEdit = ref(false)
const filters = reactive({ keyword: '', status: '', type: '' })
const resourceTypes = ['专业服务', '教育培训', '场地资源', '物资捐赠', '志愿服务', '资金赞助', '技术支持', '健康医疗', '活动赞助', '媒体宣传', '技能培训', '养老服务']
const statusType = { 0: 'info', 1: 'success', 2: 'warning' }
const statusLabel = { 0: '待审核', 1: '已发布', 2: '已下架' }
const allTags = ['亲子活动', '老年服务', '文化活动', '体育赛事', '教育培训', '健康医疗', '科技科普', '节庆活动', '环保公益', '商业推广', '社区建设', '志愿服务']

const myResources = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const loading = ref(false)

const editForm = reactive({ id: null, title: '', resource_type: '', content: '', provide_content: '', expected_return: '', tags: [] })

async function fetchMyResources() {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize }
    if (filters.status) params.status = filters.status
    if (filters.type) params.type = filters.type
    if (filters.keyword) params.keyword = filters.keyword
    const res = await getMyResources(params)
    myResources.value = res.data?.list || res.data || []
    total.value = res.data?.total || 0
  } catch {
    myResources.value = []
  } finally {
    loading.value = false
  }
}

function viewDetail(row) {
  router.push(`/merchant/resources/${row.id}`)
}

function editResource(row) {
  Object.assign(editForm, {
    id: row.id,
    title: row.title,
    resource_type: row.resource_type,
    content: row.content,
    provide_content: row.provide_content,
    expected_return: row.expected_return,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
  })
  showEdit.value = true
}

async function saveEdit() {
  try {
    await updateResource(editForm.id, editForm)
    ElMessage.success('资源已更新')
    showEdit.value = false
    fetchMyResources()
  } catch {
    // handled by interceptor
  }
}

async function toggleStatus(row, newStatus) {
  const action = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定要${action}「${row.title}」吗？`, `${action}确认`, { type: 'warning' })
    await updateResource(row.id, { status: newStatus })
    ElMessage.success(`资源已${action}`)
    fetchMyResources()
  } catch {
    // user cancelled
  }
}

async function deleteResource(row) {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.title}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
    await delResource(row.id)
    ElMessage.success('资源已删除')
    fetchMyResources()
  } catch {
    // user cancelled
  }
}

function toggleTag(tag) {
  const idx = editForm.tags.indexOf(tag)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(tag)
}

function doSearch() {
  currentPage.value = 1
  fetchMyResources()
}
function resetFilters() {
  Object.assign(filters, { keyword: '', status: '', type: '' })
  doSearch()
}
function onPageChange(page) {
  currentPage.value = page
  fetchMyResources()
}

onMounted(() => {
  fetchMyResources()
})
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.tag-selector { display: flex; flex-wrap: wrap; }

@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
  }
  .page-header h2 { font-size: 18px; }
  .page-header .el-button { width: 100%; }
  .filter-bar { gap: 8px; margin-bottom: 12px; }
  .filter-bar .el-input,
  .filter-bar .el-select {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  .filter-bar .el-button {
    width: calc(50% - 4px);
    font-size: 13px;
  }
  .pagination { justify-content: center; }
  :deep(.el-table) {
    font-size: 13px;
  }
  :deep(.el-table__header th) {
    font-size: 12px;
  }
}
</style>
