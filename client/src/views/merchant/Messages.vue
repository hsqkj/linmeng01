<template>
  <div class="page">
    <h2>我的消息</h2>

    <el-tabs v-model="activeTab" class="message-tabs" @tab-change="onTabChange">
      <!-- 合作意向 -->
      <el-tab-pane label="合作意向" name="intentions">
        <div class="message-list" v-loading="intentionLoading">
          <el-empty v-if="!intentionLoading && intentionList.length === 0" description="暂无合作意向记录" :image-size="80" />
          <el-card v-for="msg in intentionList" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <div style="display:flex;align-items:center;gap:8px">
                <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.community_name || '社区')}&background=4A90D9&color=fff&size=32`" class="msg-avatar" />
                <div class="sender-info">
                  <span class="sender-name">{{ msg.community_name || '未知社区' }}</span>
                  <span class="sender-type">社区</span>
                </div>
              </div>
              <el-tag size="small" :type="statusType[msg.status]">{{ statusName[msg.status] }}</el-tag>
              <span class="message-time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-body">
              <p class="message-content">{{ msg.intro || '暂无说明' }}</p>
              <div class="demand-ref" v-if="msg.demand_title">
                <el-icon><Link /></el-icon>
                关联需求：{{ msg.demand_title }}
              </div>
            </div>
            <div class="message-actions" v-if="msg.status === 0">
              <el-button type="primary" size="small" @click="viewDemand(msg)">查看需求</el-button>
              <el-button size="small" text type="danger" @click="cancelIntention(msg)">取消意向</el-button>
            </div>
          </el-card>
        </div>
        <div class="pagination-wrap" v-if="intentionTotal > pageSize">
          <el-pagination
            background layout="prev, pager, next"
            :total="intentionTotal" :page-size="pageSize"
            v-model:current-page="intentionPage"
            @current-change="loadIntentions" />
        </div>
      </el-tab-pane>

      <!-- 留言咨询 -->
      <el-tab-pane label="留言咨询" name="comments">
        <div class="message-list" v-loading="commentLoading">
          <el-empty v-if="!commentLoading && commentList.length === 0" description="暂无留言记录" :image-size="80" />
          <el-card v-for="msg in commentList" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <div style="display:flex;align-items:center;gap:8px">
                <img :src="msg.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_name || '用户')}&background=4A90D9&color=fff&size=32`" class="msg-avatar" />
                <div class="sender-info">
                  <span class="sender-name">{{ msg.user_name || '社区用户' }}</span>
                  <span class="sender-type">社区</span>
                </div>
              </div>
              <el-tag size="small" type="warning">资源留言</el-tag>
              <span class="message-time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <p class="message-content">{{ msg.content }}</p>
            <div class="message-actions">
              <el-button type="primary" size="small" @click="replyComment(msg)">回复</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 系统通知 -->
      <el-tab-pane label="系统通知" name="system">
        <div class="message-list">
          <el-empty v-if="systemMessages.length === 0" description="暂无系统通知" :image-size="80" />
          <el-card v-for="msg in systemMessages" :key="msg.id" class="message-card" shadow="hover">
            <div class="message-header">
              <el-tag :type="msg.tagType" size="small">{{ msg.tag }}</el-tag>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <h4 class="message-title">{{ msg.title }}</h4>
            <p class="message-content">{{ msg.content }}</p>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { getMyIntentions, getMyResources, cancelIntention as apiCancelIntention, getResourceComments, replyComment as apiReplyComment } from '@/api/merchant'

const router = useRouter()
const activeTab = ref('intentions')

// 合作意向
const intentionList = ref([])
const intentionLoading = ref(false)
const intentionPage = ref(1)
const intentionTotal = ref(0)
const pageSize = 10

const statusName = { 0: '待回复', 1: '已接受', 2: '已拒绝', 3: '已完成' }
const statusType = { 0: 'warning', 1: 'success', 2: 'info', 3: 'primary' }

async function loadIntentions() {
  intentionLoading.value = true
  try {
    const res = await getMyIntentions({ page: intentionPage.value, pageSize })
    intentionList.value = res.data.list || []
    intentionTotal.value = res.data.total || 0
  } catch {
    intentionList.value = []
  } finally {
    intentionLoading.value = false
  }
}

async function cancelIntention(msg) {
  try {
    await ElMessageBox.confirm(`确定要取消对「${msg.demand_title || '该需求'}」的合作意向吗？`, '确认取消', { type: 'warning' })
    await apiCancelIntention(msg.id)
    ElMessage.success('已取消合作意向')
    loadIntentions()
  } catch {
    // 用户取消
  }
}

function viewDemand(msg) {
  if (msg.demand_id) {
    router.push(`/merchant/demands/${msg.demand_id}`)
  }
}

// 留言咨询
const commentList = ref([])
const commentLoading = ref(false)

async function loadComments() {
  commentLoading.value = true
  try {
    // 先获取商家自己的资源
    const res = await getMyResources({ page: 1, pageSize: 100 })
    const resources = res.data?.list || []
    // 获取每个资源的留言
    const allComments = []
    await Promise.allSettled(resources.map(async (r) => {
      try {
        const cr = await getResourceComments(r.id)
        const comments = Array.isArray(cr.data) ? cr.data : []
        comments.forEach(c => { c.resource_title = r.title })
        allComments.push(...comments)
      } catch {}
    }))
    // 按时间倒序
    allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    commentList.value = allComments
  } catch {
    commentList.value = []
  } finally {
    commentLoading.value = false
  }
}

async function replyComment(msg) {
  try {
    const { value } = await ElMessageBox.prompt(
      `回复「${msg.user_name || '用户'}」：`,
      '填写回复内容',
      { confirmButtonText: '发送回复', cancelButtonText: '取消', inputPattern: /\S+/, inputErrorMessage: '回复内容不能为空' }
    )
    await apiReplyComment(msg.id, { content: value })
    ElMessage.success('回复已发送')
    loadComments()
  } catch {
    // 用户取消
  }
}

// 系统通知（Mock）
const systemMessages = ref([])

function onTabChange(tab) {
  if (tab === 'intentions') loadIntentions()
  else if (tab === 'comments') loadComments()
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

onMounted(() => {
  loadIntentions()
})
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.message-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }
.message-list { display: flex; flex-direction: column; gap: 16px; }
.message-card { transition: transform 0.2s; }
.message-card:hover { transform: translateY(-2px); }
.message-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.sender-info { display: flex; flex-direction: column; gap: 2px; }
.sender-name { font-weight: 600; font-size: 14px; }
.sender-type { font-size: 12px; color: #909399; }
.message-time { margin-left: auto; font-size: 12px; color: #909399; }
.message-title { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
.message-content { color: #606266; font-size: 14px; line-height: 1.6; margin: 0; }
.message-body { margin-bottom: 12px; }
.demand-ref { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 13px; color: #409EFF; }
.message-actions { display: flex; gap: 8px; margin-top: 12px; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }

@media (max-width: 768px) {
  .message-header { flex-wrap: wrap; }
  .message-time { width: 100%; margin-left: 44px; margin-top: 4px; }
}
</style>
