<template>
  <div class="page">
      <div class="page-header">
      <h2>我的需求</h2>
      <div class="header-actions">
        <el-button type="info" plain @click="showDraftDrawer = true">
          <el-icon><Document /></el-icon> 草稿箱
          <el-badge v-if="draftCount > 0" :value="draftCount" class="draft-badge" />
        </el-button>
        <el-button type="primary" @click="$router.push('/community/demands/publish')">
          <el-icon><Plus /></el-icon>
          发布需求
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" element-loading-text="加载中...">
      <!-- 空状态提示 -->
      <el-empty v-if="!loading && demands.length === 0" description="暂无需求">
        <el-button type="primary" @click="$router.push('/community/demands/publish')">
          <el-icon><Plus /></el-icon>
          发布新需求
        </el-button>
      </el-empty>
      <el-table v-else :data="demands" stripe style="width: 100%">
        <el-table-column prop="title" label="需求标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="demand_type" label="类型" width="120">
          <template #default="{ row }">
            {{ demandTypeName[row.demand_type] || row.demand_type }}
          </template>
        </el-table-column>
        <el-table-column label="截止日期" width="120">
          <template #default="{ row }">
            {{ fmtDeadline(row.deadline) }}
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusName[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="$router.push(`/community/demands/${row.id}`)">查看</el-button>
            <el-button text type="warning" size="small" @click="editDemand(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteDemand(row)">删除</el-button>
            <el-button text size="small" @click="shareDemand(row)" title="分享">
              <el-icon><Share /></el-icon>
            </el-button>
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

    <!-- 草稿箱抽屉 -->
    <el-drawer v-model="showDraftDrawer" title="📋 我的草稿箱" direction="rtl" size="400px">
      <div v-loading="loadingDrafts">
        <el-empty v-if="drafts.length === 0 && !loadingDrafts" description="暂无草稿" />
        <div class="draft-list" v-else>
          <div class="draft-item" v-for="draft in drafts" :key="draft.id">
            <div class="draft-info">
              <div class="draft-title">{{ draft.title }}</div>
              <div class="draft-meta">
                <el-tag size="small" type="info">步骤 {{ (draft.current_step || 0) + 1 }}/4</el-tag>
                <span class="draft-time">{{ formatDraftTime(draft.updated_at) }}</span>
              </div>
            </div>
            <div class="draft-actions">
              <el-button type="primary" text size="small" @click="editDraft(draft)">继续编辑</el-button>
              <el-button type="danger" text size="small" @click="removeDraft(draft)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Share, Document } from '@element-plus/icons-vue'
import { getMyDemands, deleteDemand as apiDelete, getMyDrafts, deleteDraft as apiDeleteDraft } from '@/api/community'

const router = useRouter()
const loading = ref(false)
const demands = ref([])
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

// 草稿箱
const showDraftDrawer = ref(false)
const drafts = ref([])
const draftCount = ref(0)
const loadingDrafts = ref(false)

const statusName = { 0: '待审核', 1: '已发布', 2: '已下架' }
const statusType = { 0: 'warning', 1: 'success', 2: 'info' }

// 格式化截止日期（2026-05-15 9:00）
function fmtDeadline(t) {
  if (!t) return '长期有效'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

const demandTypeName = {
  0: '活动赞助', 1: '专家服务', 2: '空间运营',
  3: '物资赞助', 4: '健康服务', 5: '教育培训'
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
  router.push(`/community/demands/${row.id}/edit`)
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

async function shareDemand(row) {
  const url = `${window.location.origin}/community/demands/${row.id}`
  const text = `邻盟社区需求：${row.title}`
  if (navigator.share) {
    try {
      await navigator.share({ title: text, text, url })
    } catch { /* 用户取消 */ }
  } else {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      ElMessage.success('链接已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    }
  }
}

// 草稿箱
async function loadDrafts() {
  loadingDrafts.value = true
  try {
    const res = await getMyDrafts()
    drafts.value = res.data || []
    draftCount.value = drafts.value.length
  } catch {
    drafts.value = []
    draftCount.value = 0
  } finally {
    loadingDrafts.value = false
  }
}

async function removeDraft(draft) {
  try {
    await ElMessageBox.confirm('确定要删除该草稿吗？', '确认删除', { type: 'warning' })
    await apiDeleteDraft(draft.id)
    drafts.value = drafts.value.filter(d => d.id !== draft.id)
    draftCount.value = drafts.value.length
    ElMessage.success('草稿已删除')
  } catch { /* 用户取消 */ }
}

function openDraftDrawer() {
  showDraftDrawer.value = true
  loadDrafts()
}

function editDraft(draft) {
  showDraftDrawer.value = false
  router.push('/community/demands/publish')
  localStorage.setItem('demand_draft_id', String(draft.id))
}

function formatDraftTime(str) {
  if (!str) return ''
  try {
    const d = new Date(str)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  } catch { return str }
}

onMounted(() => {
  loadDemands()
  loadDrafts()
})
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.draft-badge { margin-left: 4px; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }

/* 草稿箱 */
.draft-list { }
.draft-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
.draft-item:last-child { border-bottom: none; }
.draft-title { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
.draft-meta { display: flex; align-items: center; gap: 8px; }
.draft-time { font-size: 12px; color: #909399; }
.draft-actions { display: flex; gap: 4px; }

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
  .pagination-wrap { justify-content: center; }
}
</style>
