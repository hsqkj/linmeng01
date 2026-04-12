<template>
  <div class="page"><h2>留言与回复管理</h2>
    <div class="tip-banner">
      <el-icon color="#E6A23C"><Warning /></el-icon>
      留言内容自动过滤手机号、微信号等联系方式，避免双方绕开平台直接联系。含违规信息的留言将标记为"待审核"。
    </div>
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="需求留言" name="demand">
        <div class="filter-bar">
          <el-input v-model="demandSearch" placeholder="搜索留言内容" style="width:260px" clearable @input="handleSearch" />
          <el-select v-model="demandStatusFilter" placeholder="留言状态" style="width:130px" @change="handleSearch">
            <el-option label="全部" value="" /><el-option label="正常" value="1" /><el-option label="已删除" value="0" />
          </el-select>
          <el-button @click="handleSearch">搜索</el-button>
        </div>
        <el-table :data="demandComments" stripe border v-loading="loading">
          <el-table-column type="index" width="50" />
          <el-table-column prop="demand_title" label="关联需求" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="goToDemand(row.demand_id)">
                {{ row.demand_title || '未知需求' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="留言者" width="130">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-avatar :size="20" :src="row.community_logo || row.merchant_logo">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span>{{ row.community_name || row.merchant_name || '用户' }}</span>
              </div>
              <el-tag size="small" :type="row.user_type === 1 ? 'primary' : 'success'" style="margin-left:24px">
                {{ row.user_type === 1 ? '社区' : '商家' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="留言内容" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column label="回复" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.reply_count > 0" type="info" size="small">{{ row.reply_count }}条回复</el-tag>
              <span v-else style="color:#909399;font-size:12px">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '已删除' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewComment(row)">查看</el-button>
              <el-button v-if="row.status === 1" text type="danger" size="small" @click="deleteComment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            layout="prev,pager,next"
            :total="demandTotal"
            :page-size="pageSize"
            :current-page="demandPage"
            @current-change="handleDemandPage"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="资源留言" name="resource">
        <div class="filter-bar">
          <el-input v-model="resourceSearch" placeholder="搜索留言内容" style="width:260px" clearable @input="handleSearch" />
          <el-select v-model="resourceStatusFilter" placeholder="留言状态" style="width:130px" @change="handleSearch">
            <el-option label="全部" value="" /><el-option label="正常" value="1" /><el-option label="已删除" value="0" />
          </el-select>
          <el-button @click="handleSearch">搜索</el-button>
        </div>
        <el-table :data="resourceComments" stripe border v-loading="loading">
          <el-table-column type="index" width="50" />
          <el-table-column prop="resource_title" label="关联资源" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="warning" :underline="false" @click="goToResource(row.resource_id)">
                {{ row.resource_title || '未知资源' }}
              </el-link>
              <div v-if="row.resource_merchant_name" style="font-size:11px;color:#909399">
                {{ row.resource_merchant_name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="留言者" width="130">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-avatar :size="20" :src="row.community_logo || row.merchant_logo">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span>{{ row.community_name || row.merchant_name || '用户' }}</span>
              </div>
              <el-tag size="small" :type="row.user_type === 1 ? 'primary' : 'success'" style="margin-left:24px">
                {{ row.user_type === 1 ? '社区' : '商家' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="留言内容" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column label="回复" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.reply_count > 0" type="info" size="small">{{ row.reply_count }}条回复</el-tag>
              <span v-else style="color:#909399;font-size:12px">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '已删除' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewComment(row)">查看</el-button>
              <el-button v-if="row.status === 1" text type="danger" size="small" @click="deleteComment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            layout="prev,pager,next"
            :total="resourceTotal"
            :page-size="pageSize"
            :current-page="resourcePage"
            @current-change="handleResourcePage"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 留言详情对话框 -->
    <el-dialog v-model="showDetail" title="留言详情" width="650px" v-if="currentComment">
      <!-- 关联信息 -->
      <div class="related-info" v-if="currentComment.demand_title || currentComment.resource_title">
        <el-alert :type="currentComment.demand_id ? 'success' : 'warning'" :closable="false" show-icon>
          <template #title>
            <span v-if="currentComment.demand_id">
              <el-icon><Link /></el-icon>
              关联需求：<el-link type="primary" @click="goToDemand(currentComment.demand_id); showDetail = false">{{ currentComment.demand_title }}</el-link>
            </span>
            <span v-else>
              <el-icon><Link /></el-icon>
              关联资源：<el-link type="warning" @click="goToResource(currentComment.resource_id); showDetail = false">{{ currentComment.resource_title }}</el-link>
              <span v-if="currentComment.resource_merchant_name" style="color:#909399;font-size:12px"> ({{ currentComment.resource_merchant_name }})</span>
            </span>
          </template>
        </el-alert>
      </div>

      <el-descriptions :column="2" border style="margin-top:12px">
        <el-descriptions-item label="留言者">
          <div style="display:flex;align-items:center;gap:6px">
            <el-avatar :size="24" :src="currentComment.community_logo || currentComment.merchant_logo">
              <el-icon><User /></el-icon>
            </el-avatar>
            {{ currentComment.community_name || currentComment.merchant_name || '用户' }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="身份">
          <el-tag :type="currentComment.user_type === 1 ? 'primary' : 'success'" size="small">
            {{ currentComment.user_type === 1 ? '社区' : '商家' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="留言时间">
          {{ formatTime(currentComment.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentComment.status === 1 ? 'success' : 'danger'" size="small">
            {{ currentComment.status === 1 ? '正常' : '已删除' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="留言内容" :span="2">
          <div style="white-space:pre-wrap;line-height:1.6;max-height:150px;overflow-y:auto">{{ currentComment.content }}</div>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 多轮回复列表 -->
      <div v-if="currentComment.replies && currentComment.replies.length" class="reply-list">
        <el-divider content-position="left">
          <span style="font-weight:600">对话记录 ({{ currentComment.replies.length }}条回复)</span>
        </el-divider>
        <div class="reply-item" v-for="reply in currentComment.replies" :key="reply.id">
          <div class="reply-header">
            <el-avatar :size="20" :src="reply.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="reply-name">{{ reply.sender }}</span>
            <el-tag size="small" :type="reply.user_type === 1 ? 'primary' : 'success'">
              {{ reply.user_type === 1 ? '社区' : '商家' }}
            </el-tag>
            <span class="reply-time">{{ formatTime(reply.created_at) }}</span>
          </div>
          <div class="reply-content">{{ reply.content }}</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentComment.status === 1" type="danger" @click="deleteComment(currentComment); showDetail = false">删除留言</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, User, Link } from '@element-plus/icons-vue'
import { getComments, deleteComment as deleteCommentApi } from '@/api/admin'

const router = useRouter()

const activeTab = ref('demand')
const loading = ref(false)
const showDetail = ref(false)
const currentComment = ref(null)

// 需求留言
const demandComments = ref([])
const demandTotal = ref(0)
const demandPage = ref(1)
const demandSearch = ref('')
const demandStatusFilter = ref('')

// 资源留言
const resourceComments = ref([])
const resourceTotal = ref(0)
const resourcePage = ref(1)
const resourceSearch = ref('')
const resourceStatusFilter = ref('')

const pageSize = 10

async function loadDemandComments() {
  loading.value = true
  try {
    const params = { type: 'demand', page: demandPage.value, pageSize, keyword: demandSearch.value }
    if (demandStatusFilter.value !== '') params.status = demandStatusFilter.value
    const res = await getComments(params)
    demandComments.value = res.data?.list || res.data || []
    demandTotal.value = res.data?.pagination?.total || demandComments.value.length
  } catch (e) {
    ElMessage.error('加载留言失败')
  } finally {
    loading.value = false
  }
}

async function loadResourceComments() {
  loading.value = true
  try {
    const params = { type: 'resource', page: resourcePage.value, pageSize, keyword: resourceSearch.value }
    if (resourceStatusFilter.value !== '') params.status = resourceStatusFilter.value
    const res = await getComments(params)
    resourceComments.value = res.data?.list || res.data || []
    resourceTotal.value = res.data?.pagination?.total || resourceComments.value.length
  } catch (e) {
    ElMessage.error('加载留言失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  if (activeTab.value === 'demand') {
    loadDemandComments()
  } else {
    loadResourceComments()
  }
}

function handleSearch() {
  demandPage.value = 1
  resourcePage.value = 1
  // 触发当前tab的数据加载（携带新的筛选条件）
  if (activeTab.value === 'demand') {
    loadDemandComments()
  } else {
    loadResourceComments()
  }
}

function handleDemandPage(page) {
  demandPage.value = page
  loadDemandComments()
}

function handleResourcePage(page) {
  resourcePage.value = page
  loadResourceComments()
}

function viewComment(row) {
  currentComment.value = row
  showDetail.value = true
}

function deleteComment(row) {
  ElMessageBox.confirm('确认删除该留言？删除后不可恢复。', '删除确认', { type: 'warning' })
    .then(async () => {
      try {
        await deleteCommentApi(row.id)
        ElMessage.success('已删除')
        row.status = 0
        // 刷新列表
        if (activeTab.value === 'demand') {
          loadDemandComments()
        } else {
          loadResourceComments()
        }
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function goToDemand(id) {
  if (id) router.push(`/admin/demands?highlight=${id}`)
}

function goToResource(id) {
  if (id) router.push(`/admin/resources?highlight=${id}`)
}

onMounted(() => {
  loadDemandComments()
})
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 12px; font-size: 22px; font-weight: 700; }
.tip-banner { background: #fff8e1; border: 1px solid #ffe58f; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #E6A23C; font-size: 13px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

.related-info { margin-bottom: 0; }

.reply-list {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.reply-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.reply-name {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.reply-time {
  font-size: 11px;
  color: #909399;
  margin-left: auto;
}

.reply-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  padding-left: 26px;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
    padding-bottom: 70px;
  }
  .page h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  .tip-banner {
    padding: 8px 12px;
    font-size: 12px;
    margin-bottom: 12px;
  }
  .filter-bar {
    gap: 8px;
    margin-bottom: 10px;
  }
  .filter-bar .el-input {
    width: 100% !important;
    font-size: 13px;
  }
  .filter-bar .el-select {
    width: calc(50% - 4px) !important;
    font-size: 13px;
  }
  .filter-bar .el-button {
    width: calc(50% - 4px);
    font-size: 12px;
    padding: 8px;
  }
  :deep(.el-tabs__nav) {
    font-size: 13px;
  }
  :deep(.el-table) {
    font-size: 11px;
  }
  :deep(.el-table__header th) {
    font-size: 10px;
    padding: 6px 3px;
  }
  :deep(.el-table__body td) {
    padding: 6px 3px;
  }
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 600px;
  }
  :deep(.el-dialog__body) {
    padding: 12px;
  }
  .pagination {
    justify-content: center;
  }
}
</style>
