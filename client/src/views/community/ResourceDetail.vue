<template>
  <div class="page">
    <!-- 返回 -->
    <el-button @click="$router.back()" style="margin-bottom:16px">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div v-loading="loading">
      <!-- 资源详情 -->
      <el-card v-if="resource" class="detail-card">
        <div class="detail-header">
          <div>
            <h2>{{ resource.title }}</h2>
            <div class="meta-row">
              <el-tag size="small">{{ resource.resource_type }}</el-tag>
              <span class="merchant-name">{{ resource.company_name }}</span>
              <el-rate v-model="resource.star_rating" disabled show-score text-color="#f5a623" disabled-hallow-color="#f5a623" />
            </div>
          </div>
          <div class="match-display">
            <div class="hearts">
              <span v-for="n in 5" :key="n" class="heart" :class="{ filled: n <= (resource.matchHearts || resource.star_rating || 0) }">♥</span>
            </div>
            <span class="match-label">匹配度 {{ ((resource.matchScore || resource.star_rating || 0) * 20) }}%</span>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin: 20px 0">
          <el-descriptions-item label="商家名称">{{ resource.company_name }}</el-descriptions-item>
          <el-descriptions-item label="行业分类">{{ resource.industry }}</el-descriptions-item>
          <el-descriptions-item label="会员等级">
            <el-tag :type="memberLevelType[resource.member_level]" size="small">
              {{ memberLevelName[resource.member_level] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ resource.created_at }}</el-descriptions-item>
          <el-descriptions-item label="资源说明" :span="2">{{ resource.content }}</el-descriptions-item>
          <el-descriptions-item label="可提供内容" :span="2">{{ resource.provide_content || '详见资源说明' }}</el-descriptions-item>
          <el-descriptions-item label="期望回报" :span="2">{{ resource.expected_return || '面议' }}</el-descriptions-item>
          <el-descriptions-item label="有效期限">{{ resource.valid_until || '长期有效' }}</el-descriptions-item>
          <el-descriptions-item label="浏览次数">{{ resource.view_count || 0 }} 次</el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <el-tag v-for="tag in (resource.tags || [])" :key="tag" size="small" style="margin:2px">{{ tag }}</el-tag>
            <span v-if="!resource.tags?.length">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商家信息 -->
        <div class="merchant-section">
          <h4>商家基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商家名称">{{ resource.company_name }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">
              <el-tag :type="memberLevelType[resource.member_level]" size="small">{{ memberLevelName[resource.member_level] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="联系人">
              <el-link type="primary" @click="contactService">请联系平台客服</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              <el-link type="primary" @click="contactService">请联系平台客服</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="商家简介" :span="2">{{ resource.merchant_description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 留言咨询 -->
        <div class="comment-section">
          <h4>
            <el-icon><ChatDotRound /></el-icon>
            留言咨询 ({{ comments.length }})
          </h4>

          <!-- 留言列表 -->
          <div class="comment-list">
            <div v-if="comments.length === 0 && !commentLoading" class="empty-comments">
              暂无留言，成为第一个留言的吧！
            </div>
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <el-avatar :size="32">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="comment-meta">
                  <span class="comment-name">{{ comment.user_name || '某社区' }}</span>
                  <span class="comment-time">{{ comment.created_at }}</span>
                </div>
              </div>
              <p class="comment-content">{{ comment.content }}</p>

              <!-- 回复列表 -->
              <div class="reply-list" v-if="comment.replies && comment.replies.length">
                <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                  <div class="reply-header">
                    <el-avatar :size="24"><el-icon><User /></el-icon></el-avatar>
                    <span class="reply-name">{{ reply.name || '某用户' }}</span>
                    <span class="reply-time">{{ reply.time }}</span>
                  </div>
                  <p class="reply-text">{{ reply.text }}</p>
                </div>
              </div>

              <!-- 回复按钮 -->
              <el-button type="primary" text size="small" @click="showReplyInput(comment)">回复</el-button>

              <!-- 回复输入框 -->
              <div v-if="replyingTo === comment.id" class="reply-input">
                <el-input v-model="replyContent" type="textarea" :rows="2" :maxlength="200" placeholder="请输入回复内容..." />
                <div style="margin-top:8px">
                  <el-button size="small" @click="replyingTo = null">取消</el-button>
                  <el-button type="primary" size="small" @click="submitReply(comment)">发送</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 留言输入 -->
          <div class="comment-input">
            <h5>我要留言</h5>
            <el-input v-model="newComment" type="textarea" :rows="3" :maxlength="300" show-word-limit placeholder="请输入留言内容..." />
            <el-button type="primary" style="margin-top:10px" @click="submitComment" :loading="submitting">提交留言</el-button>
          </div>
        </div>
      </el-card>

      <!-- 资源不存在 -->
      <el-empty v-else description="资源不存在或已下架" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ChatDotRound, User } from '@element-plus/icons-vue'
import { getResourceDetail, getResourceComments, createResourceComment, replyComment } from '@/api/community'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const resource = ref(null)
const comments = ref([])
const commentLoading = ref(false)
const newComment = ref('')
const submitting = ref(false)
const replyingTo = ref(null)
const replyContent = ref('')

const memberLevelType = { 0: 'info', 1: '', 2: 'warning', 3: 'danger', 4: 'danger' }
const memberLevelName = { 0: '普通会员', 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }

async function loadData() {
  const id = route.params.id
  loading.value = true
  try {
    const res = await getResourceDetail(id)
    resource.value = res.data
    await loadComments()
  } catch {
    ElMessage.error('加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  const id = route.params.id
  commentLoading.value = true
  try {
    const res = await getResourceComments(id)
    // 获取每个留言的回复
    const commentList = res.data || []
    // 暂时只显示顶级留言
    comments.value = commentList
  } catch {
    comments.value = []
  } finally {
    commentLoading.value = false
  }
}

async function submitComment() {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入留言内容')
    return
  }
  submitting.value = true
  try {
    await createResourceComment(route.params.id, { content: newComment.value })
    ElMessage.success('留言成功')
    newComment.value = ''
    await loadComments()
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}

function showReplyInput(comment) {
  replyingTo.value = comment.id
  replyContent.value = ''
}

async function submitReply(comment) {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  try {
    await replyComment(comment.id, { content: replyContent.value })
    ElMessage.success('回复成功')
    replyingTo.value = null
    replyContent.value = ''
    await loadComments()
  } catch {
    // error handled by interceptor
  }
}

// 联系平台客服 - 跳转到留言咨询页
function contactService() {
  router.push('/community/messages')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
.detail-header h2 { margin: 0 0 8px; }
.meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.merchant-name { font-weight: 600; color: #409EFF; }
.match-display { text-align: right; }
.hearts { display: flex; gap: 2px; justify-content: flex-end; }
.heart { font-size: 16px; color: #dcdfe6; }
.heart.filled { color: #f56c6c; }
.match-label { font-size: 12px; color: #f56c6c; }
.merchant-section { margin: 24px 0; }
.merchant-section h4, .comment-section h4 { margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
.comment-section { margin-top: 24px; border-top: 1px solid #ebeef5; padding-top: 20px; }
.empty-comments { color: #909399; text-align: center; padding: 20px; }
.comment-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.comment-item { border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; background: #fafafa; }
.comment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.comment-meta { display: flex; flex-direction: column; }
.comment-name { font-weight: 600; font-size: 14px; }
.comment-time { font-size: 12px; color: #909399; }
.comment-content { font-size: 14px; color: #606266; margin: 0; line-height: 1.6; }
.reply-list { margin: 12px 0; padding: 10px; background: white; border-radius: 6px; border-left: 3px solid #409EFF; }
.reply-item { margin-bottom: 10px; }
.reply-item:last-child { margin-bottom: 0; }
.reply-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.reply-name { font-weight: 600; font-size: 13px; }
.reply-time { font-size: 11px; color: #909399; margin-left: auto; }
.reply-text { font-size: 13px; color: #606266; margin: 0; padding-left: 30px; }
.reply-input { margin-top: 10px; }
.comment-input h5 { margin: 0 0 8px; }
</style>
