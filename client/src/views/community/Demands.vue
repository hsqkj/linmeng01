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
        <el-table-column prop="title" label="需求标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.demand_type]" size="small">
              {{ row.demand_type_name || row.demand_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="活动类型" width="100">
          <template #default="{ row }">
            {{ row.activity_type_name || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="目标对象" min-width="120">
          <template #default="{ row }">
            <span v-if="row.target_audience && row.target_audience.length">
              {{ row.target_audience.join('、') }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="120">
          <template #default="{ row }">
            {{ fmtDate(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column label="地点" width="120">
          <template #default="{ row }">
            {{ row.location_name || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="回报标签" width="120">
          <template #default="{ row }">
            <div class="tags-cell">
              <el-tag v-for="tag in (row.tags || []).slice(0, 2)" :key="tag" size="small" type="info" class="tag-item">{{ tag }}</el-tag>
              <span v-if="(row.tags || []).length > 2" class="more-tag">+{{ row.tags.length - 2 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="回报内容" min-width="120">
          <template #default="{ row }">
            <span class="text-ellipsis" :title="row.return_value">{{ row.return_value || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="意向" width="70" align="center">
          <template #default="{ row }">
            <span class="clickable" :class="{ 'has-data': row.intention_count > 0 }" @click="openIntentionDialog(row)">
              {{ row.intention_count || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="留言" width="70" align="center">
          <template #default="{ row }">
            <span class="clickable" :class="{ 'has-data': row.comment_count > 0 }" @click="openCommentDialog(row)">
              {{ row.comment_count || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="浏览" width="70" align="center">
          <template #default="{ row }">
            {{ row.view_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusName[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="$router.push(`/community/demands/${row.id}`)">查看</el-button>
            <el-button text type="warning" size="small" @click="editDemand(row)">编辑</el-button>
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

    <!-- 留言弹窗 -->
    <el-dialog v-model="showCommentDialog" :title="`留言详情：${currentDemand?.title || ''}`" width="600px" destroy-on-close>
      <div class="comment-list" v-loading="loadingComments">
        <el-empty v-if="!loadingComments && comments.length === 0" description="暂无留言" />
        <div v-else>
          <div class="comment-item" v-for="c in comments" :key="c.id">
            <div class="comment-header">
              <img v-if="c.user_logo" :src="c.user_logo" class="comment-avatar" />
              <span v-else class="comment-avatar-placeholder">{{ c.user_name?.[0] || '商' }}</span>
              <span class="comment-user">{{ c.user_name || '商家' }}</span>
              <span class="comment-time">{{ formatCommentTime(c.created_at) }}</span>
            </div>
            <div class="comment-content">{{ c.content }}</div>
            <!-- 回复列表 -->
            <div class="reply-list" v-if="c.replies && c.replies.length">
              <div class="reply-item" v-for="r in c.replies" :key="r.id">
                <span class="reply-user">{{ r.user_type === 1 ? '社区回复' : '商家回复' }}：</span>
                <span class="reply-content">{{ r.content }}</span>
                <span class="reply-time">{{ formatCommentTime(r.created_at) }}</span>
              </div>
            </div>
            <!-- 回复输入 -->
            <div class="reply-input-wrap">
              <el-input v-model="replyContent" placeholder="输入回复内容..." size="small" style="flex:1" />
              <el-button type="primary" size="small" @click="submitReply(c.id)">回复</el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 发送留言 -->
      <div class="send-comment">
        <el-input v-model="newComment" type="textarea" :rows="2" placeholder="输入留言内容..." />
        <el-button type="primary" @click="submitComment" style="margin-top:8px">发送留言</el-button>
      </div>
    </el-dialog>

    <!-- 合作意向弹窗 -->
    <el-dialog v-model="showIntentionDialog" :title="`合作意向：${currentDemand?.title || ''}`" width="600px" destroy-on-close>
      <div v-loading="loadingIntentions">
        <el-empty v-if="!loadingIntentions && intentions.length === 0" description="暂无合作意向" />
        <div v-else class="intention-list">
          <div class="intention-item" v-for="item in intentions" :key="item.id">
            <div class="intention-header">
              <img v-if="item.merchant_logo" :src="item.merchant_logo" class="intention-avatar" />
              <span v-else class="intention-avatar-placeholder">{{ item.company_name?.[0] || '商' }}</span>
              <div class="intention-info">
                <div class="intention-name">{{ item.company_name }}</div>
                <div class="intention-intro">{{ item.intro || '暂无说明' }}</div>
              </div>
              <el-tag :type="intentionStatusType[item.status]" size="small">{{ intentionStatusName[item.status] }}</el-tag>
            </div>
            <div class="intention-footer">
              <span class="intention-time">申请时间：{{ formatCommentTime(item.created_at) }}</span>
              <div class="intention-actions" v-if="item.status === 0">
                <el-button type="success" size="small" @click="handleIntention(item, 1)">接受</el-button>
                <el-button type="danger" size="small" @click="handleIntention(item, 2)">拒绝</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Share, Document } from '@element-plus/icons-vue'
import { getMyDemands, deleteDemand as apiDelete, getMyDrafts, deleteDraft as apiDeleteDraft,
         getDemandComments, createDemandComment, replyComment,
         getMyIntentions, acceptIntention, rejectIntention } from '@/api/community'

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

// 留言弹窗
const showCommentDialog = ref(false)
const currentDemand = ref(null)
const comments = ref([])
const loadingComments = ref(false)
const newComment = ref('')
const replyContent = ref('')

// 意向弹窗
const showIntentionDialog = ref(false)
const intentions = ref([])
const loadingIntentions = ref(false)

const statusName = { 0: '待审核', 1: '已发布', 2: '已下架' }
const statusType = { 0: 'warning', 1: 'success', 2: 'info' }
const typeTagMap = { 0: '', 1: 'success', 2: 'warning' }

const intentionStatusName = { 0: '待处理', 1: '已接受', 2: '已拒绝', 3: '已完成', 4: '已取消' }
const intentionStatusType = { 0: 'warning', 1: 'success', 2: 'info', 3: 'success', 4: 'info' }

// 需求类型名称（使用后端返回的 demand_type_name）

// 格式化日期
function fmtDate(t) {
  if (!t) return '—'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
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

// 留言功能
async function openCommentDialog(row) {
  currentDemand.value = row
  showCommentDialog.value = true
  loadingComments.value = true
  try {
    const res = await getDemandComments(row.id)
    comments.value = res.data || []
    // 加载回复
    for (const c of comments.value) {
      try {
        const r = await getDemandComments(row.id)
        const all = r.data || []
        c.replies = all.filter(x => x.parent_id === c.id)
      } catch { c.replies = [] }
    }
  } catch {
    comments.value = []
  } finally {
    loadingComments.value = false
  }
}

async function submitComment() {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入留言内容')
    return
  }
  try {
    await createDemandComment(currentDemand.value.id, { content: newComment.value })
    ElMessage.success('留言成功')
    newComment.value = ''
    openCommentDialog(currentDemand.value)
  } catch { }
}

async function submitReply(parentId) {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  try {
    await replyComment(parentId, { content: replyContent.value })
    ElMessage.success('回复成功')
    replyContent.value = ''
    openCommentDialog(currentDemand.value)
  } catch { }
}

// 意向功能
async function openIntentionDialog(row) {
  currentDemand.value = row
  showIntentionDialog.value = true
  loadingIntentions.value = true
  try {
    const res = await getMyIntentions({ demand_id: row.id })
    intentions.value = res.data?.list || res.data || []
  } catch {
    intentions.value = []
  } finally {
    loadingIntentions.value = false
  }
}

async function handleIntention(item, status) {
  try {
    if (status === 1) {
      await acceptIntention(item.id)
      ElMessage.success('已接受')
    } else {
      await rejectIntention(item.id, {})
      ElMessage.success('已拒绝')
    }
    openIntentionDialog(currentDemand.value)
  } catch { }
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

function formatCommentTime(str) {
  if (!str) return ''
  try {
    const d = new Date(str)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } catch { return str }
}

onMounted(() => {
  loadDemands()
  loadDrafts()
})
</script>

<style scoped>

/* ===== 基础样式（移动端默认，PC覆盖）===== */
.page { background: #f5f5f5; }
.text-muted { color: #909399; }
.text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.clickable { cursor: pointer; color: #409EFF; }
.clickable:hover { text-decoration: underline; }
.clickable.has-data { font-weight: 600; }
.tags-cell { display: flex; flex-wrap: wrap; gap: 2px; }
.tag-item { max-width: 60px; overflow: hidden; text-overflow: ellipsis; }
.more-tag { font-size: 12px; color: #909399; margin-left: 4px; }

/* ===== PC 端样式（≥769px）===== */
@media (min-width: 769px) {
  .page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px 20px 40px;
    min-height: 100vh;
    background: #f0f2f5;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
  .draft-badge { margin-left: 4px; }
  .pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }

  /* 表格内样式 */
  .text-muted { color: #909399; }
  .text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  .clickable { cursor: pointer; color: #409EFF; }
  .clickable:hover { text-decoration: underline; }
  .clickable.has-data { font-weight: 600; }
  .tags-cell { display: flex; flex-wrap: wrap; gap: 2px; }
  .tag-item { max-width: 60px; overflow: hidden; text-overflow: ellipsis; }

  /* 草稿箱 */
  .draft-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
  .draft-item:last-child { border-bottom: none; }
  .draft-title { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
  .draft-meta { display: flex; align-items: center; gap: 8px; }
  .draft-time { font-size: 12px; color: #909399; }
  .draft-actions { display: flex; gap: 4px; }

  /* 留言弹窗 */
  .comment-list { max-height: 400px; overflow-y: auto; margin-bottom: 16px; }
  .comment-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .comment-item:last-child { border-bottom: none; }
  .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .comment-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
  .comment-avatar-placeholder { width: 28px; height: 28px; border-radius: 50%; background: #409EFF; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .comment-user { font-weight: 500; }
  .comment-time { color: #909399; font-size: 12px; margin-left: auto; }
  .comment-content { color: #333; line-height: 1.6; padding-left: 36px; }
  .reply-list { margin: 8px 0 8px 36px; padding: 8px; background: #f5f7fa; border-radius: 4px; }
  .reply-item { margin-bottom: 4px; font-size: 13px; }
  .reply-user { font-weight: 500; color: #409EFF; }
  .reply-content { color: #666; }
  .reply-time { color: #909399; font-size: 11px; margin-left: 8px; }
  .reply-input-wrap { display: flex; gap: 8px; margin-top: 8px; padding-left: 36px; }
  .send-comment { border-top: 1px solid #f0f0f0; padding-top: 16px; }

  /* 意向弹窗 */
  .intention-list { max-height: 400px; overflow-y: auto; }
  .intention-item { padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 12px; }
  .intention-header { display: flex; align-items: flex-start; gap: 12px; }
  .intention-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .intention-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background: #409EFF; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .intention-info { flex: 1; }
  .intention-name { font-weight: 600; margin-bottom: 4px; }
  .intention-intro { color: #666; font-size: 13px; }
  .intention-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ebeef5; }
  .intention-time { color: #909399; font-size: 12px; }
  .intention-actions { display: flex; gap: 8px; }
}

/* ===== 移动端样式（≤768px）===== */
@media (max-width: 768px) {
  .page { padding-bottom: 70px; background: #f5f5f5; }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
    padding: 12px 14px;
    background: white;
    border-radius: 0;
    border-bottom: 1px solid #eee;
  }
  .page-header h2 { font-size: 18px; }
  .page-header .el-button { width: 100%; }
  .pagination-wrap { justify-content: center; }

  /* 草稿箱 */
  .draft-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
  .draft-item:last-child { border-bottom: none; }
  .draft-title { font-weight: 500; font-size: 14px; margin-bottom: 4px; }
  .draft-meta { display: flex; align-items: center; gap: 8px; }
  .draft-time { font-size: 12px; color: #909399; }
  .draft-actions { display: flex; gap: 4px; }

  /* 表格内样式 */
  .text-muted { color: #909399; }
  .text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  .clickable { cursor: pointer; color: #409EFF; }
  .clickable:hover { text-decoration: underline; }
  .clickable.has-data { font-weight: 600; }
  .tags-cell { display: flex; flex-wrap: wrap; gap: 2px; }
  .tag-item { max-width: 60px; overflow: hidden; text-overflow: ellipsis; }

  /* 留言弹窗 */
  .comment-list { max-height: 400px; overflow-y: auto; margin-bottom: 16px; }
  .comment-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .comment-item:last-child { border-bottom: none; }
  .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .comment-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
  .comment-avatar-placeholder { width: 28px; height: 28px; border-radius: 50%; background: #409EFF; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .comment-user { font-weight: 500; }
  .comment-time { color: #909399; font-size: 12px; margin-left: auto; }
  .comment-content { color: #333; line-height: 1.6; padding-left: 36px; }
  .reply-list { margin: 8px 0 8px 36px; padding: 8px; background: #f5f7fa; border-radius: 4px; }
  .reply-item { margin-bottom: 4px; font-size: 13px; }
  .reply-user { font-weight: 500; color: #409EFF; }
  .reply-content { color: #666; }
  .reply-time { color: #909399; font-size: 11px; margin-left: 8px; }
  .reply-input-wrap { display: flex; gap: 8px; margin-top: 8px; padding-left: 36px; }
  .send-comment { border-top: 1px solid #f0f0f0; padding-top: 16px; }

  /* 意向弹窗 */
  .intention-list { max-height: 400px; overflow-y: auto; }
  .intention-item { padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 12px; }
  .intention-header { display: flex; align-items: flex-start; gap: 12px; }
  .intention-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .intention-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background: #409EFF; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .intention-info { flex: 1; }
  .intention-name { font-weight: 600; margin-bottom: 4px; }
  .intention-intro { color: #666; font-size: 13px; }
  .intention-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ebeef5; }
  .intention-time { color: #909399; font-size: 12px; }
  .intention-actions { display: flex; gap: 8px; }
}
</style>
