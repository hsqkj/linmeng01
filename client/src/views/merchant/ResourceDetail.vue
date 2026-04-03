<template>
  <div class="resource-detail">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回资源列表</el-button>
    </div>

    <div class="detail-layout">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <div class="resource-card">
          <div class="resource-header">
            <div class="resource-meta">
              <el-tag :type="resourceTypeTag[currentResource.resource_type]" size="large" effect="dark">
                {{ resourceTypeName[currentResource.resource_type] }}
              </el-tag>
              <el-tag :type="statusTypeTag[currentResource.status]" size="small" style="margin-left:8px">
                {{ statusName[currentResource.status] }}
              </el-tag>
              <span class="match-hearts">{{ '❤️'.repeat(currentResource.match_hearts || 0) }}{{ '🤍'.repeat(5 - (currentResource.match_hearts || 0)) }}</span>
            </div>
            <h1 class="resource-title">{{ currentResource.title }}</h1>
          </div>

          <el-divider />

          <!-- 资源基本信息 -->
          <div class="section">
            <h3>📋 资源基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">资源类型</span>
                <span class="info-value"><el-tag size="small">{{ resourceTypeName[currentResource.resource_type] }}</el-tag></span>
              </div>
              <div class="info-item" v-if="currentResource.min_amount || currentResource.max_amount">
                <span class="info-label">价值范围</span>
                <span class="info-value">{{ currentResource.min_amount }} ~ {{ currentResource.max_amount }}元</span>
              </div>
              <div class="info-item" v-if="currentResource.quantity">
                <span class="info-label">物资数量</span>
                <span class="info-value">{{ currentResource.quantity }}</span>
              </div>
              <div class="info-item" v-if="currentResource.staff_count">
                <span class="info-label">人员数量</span>
                <span class="info-value">{{ currentResource.staff_count }}人</span>
              </div>
            </div>
          </div>

          <!-- 资源详情 -->
          <div class="section">
            <h3>📝 资源详情</h3>
            <p class="description">{{ currentResource.content || '暂无详情' }}</p>
          </div>

          <!-- 服务/规格说明 -->
          <div class="section" v-if="currentResource.service_scope || currentResource.specs">
            <h3>🎯 服务说明</h3>
            <div class="provide-block">
              <div v-if="currentResource.service_scope">服务范围：{{ currentResource.service_scope }}</div>
              <div v-if="currentResource.specs">规格要求：{{ currentResource.specs }}</div>
              <div v-if="currentResource.certification">资质证明：{{ currentResource.certification }}</div>
              <div v-if="currentResource.price_range">收费标准：{{ currentResource.price_range }}</div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="section" v-if="currentResource.tags && currentResource.tags.length">
            <h3>🏷️ 资源标签</h3>
            <el-tag v-for="tag in currentResource.tags" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
          </div>

          <!-- 留言区 -->
          <div class="section">
            <h3>💬 社区留言咨询（{{ comments.length }}条）</h3>
            <div class="comment-input" id="comment-area">
              <el-input v-model="commentText" placeholder="有社区留言咨询时，您可以在这里回复..." type="textarea" :rows="3" />
              <el-button type="success" :loading="commentLoading" @click="submitReply" style="margin-top:8px">回复留言</el-button>
            </div>
            <div class="comment-list" v-if="comments.length">
              <div class="comment-item" v-for="c in comments" :key="c.id">
                <img :src="c.avatar" class="comment-avatar" />
                <div class="comment-content">
                  <div class="comment-meta">
                    <span class="commenter-name">{{ c.name }}</span>
                    <el-tag size="small" type="primary" style="margin-left:8px">社区</el-tag>
                    <span class="comment-time">{{ c.time }}</span>
                  </div>
                  <div class="comment-text">{{ c.text }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无社区留言" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 右侧：数据统计 -->
      <div class="side-content">
        <div class="action-card">
          <h4>📊 资源数据</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-val">{{ currentResource.view_count || 0 }}</span>
              <span class="stat-lab">浏览量</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">{{ comments.length }}</span>
              <span class="stat-lab">留言数</span>
            </div>
          </div>
        </div>

        <div class="action-card">
          <h4>⚡ 快速操作</h4>
          <el-button type="primary" style="width:100%;margin-bottom:8px" @click="$router.push('/merchant/resources')">
            返回资源列表
          </el-button>
          <el-button style="width:100%" @click="$router.push('/merchant/profile')">
            编辑资源信息
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getResourceComments, getMyResources } from '@/api/merchant'
import { replyComment } from '@/api/merchant'

const route = useRoute()
const currentResource = ref({})
const comments = ref([])
const commentText = ref('')
const commentLoading = ref(false)

const resourceTypeName = {
  1: '资金', 2: '物资', 3: '人力', 4: '技术', 5: '服务', 6: '媒体'
}
const resourceTypeTag = {
  1: 'danger', 2: 'warning', 3: 'success', 4: 'info', 5: '', 6: 'primary'
}
const statusTypeTag = { 1: 'success', 0: 'warning', 2: 'info', 3: 'danger' }
const statusName = { 1: '已通过', 0: '待审核', 2: '已拒绝', 3: '已下架' }

async function loadResource() {
  try {
    const res = await getMyResources()
    const resourceId = parseInt(route.params.id)
    const found = (res.data || []).find(r => r.id === resourceId)
    if (found) {
      // 如果API返回的数据不够完整，补充本地字段
      currentResource.value = {
        ...found,
        resource_type: found.resource_type || 1,
        status: found.status || 1,
        title: found.title || '资源详情',
        tags: found.tags || []
      }
    }
  } catch (e) {
    console.error('加载资源失败', e)
  }
}

async function loadComments() {
  try {
    const res = await getResourceComments(route.params.id)
    comments.value = (res.data || []).map(c => ({
      id: c.id,
      name: c.user_name || '社区用户',
      avatar: c.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || '社区')}&background=409EFF&color=fff`,
      time: new Date(c.created_at).toLocaleString('zh-CN'),
      text: c.content
    }))
  } catch (e) {
    console.error('加载留言失败', e)
  }
}

function submitReply() {
  if (!commentText.value.trim()) return
  if (!comments.value.length) {
    ElMessage.warning('暂无留言可回复')
    return
  }
  commentLoading.value = true
  // 回复最新一条留言
  const lastComment = comments.value[comments.value.length - 1]
  replyComment(lastComment.id, { content: commentText.value })
    .then(() => {
      ElMessage.success('回复成功')
      commentText.value = ''
      loadComments()
    })
    .catch(() => {
      ElMessage.error('回复失败')
    })
    .finally(() => {
      commentLoading.value = false
    })
}

onMounted(() => {
  loadResource()
  loadComments()
})
</script>

<style scoped>
.resource-detail { max-width: 1200px; margin: 0 auto; padding: 20px; }
.page-header { margin-bottom: 20px; }
.detail-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
.main-content, .side-content { display: flex; flex-direction: column; gap: 16px; }
.resource-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.resource-header { margin-bottom: 8px; }
.resource-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.match-hearts { margin-left: auto; font-size: 18px; }
.resource-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0; }
.section { margin-top: 24px; }
.section h3 { font-size: 16px; font-weight: 700; color: #303133; margin-bottom: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.description { color: #606266; line-height: 1.8; font-size: 14px; }
.provide-block { background: #f0f9ff; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #303133; }
.comment-input { margin-bottom: 20px; }
.comment-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.comment-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.commenter-name { font-weight: 600; font-size: 14px; }
.comment-time { font-size: 12px; color: #909399; }
.comment-text { font-size: 14px; color: #303133; }
.action-card, .info-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
.stat-item { text-align: center; }
.stat-val { display: block; font-size: 24px; font-weight: 700; color: #409EFF; }
.stat-lab { font-size: 12px; color: #909399; }

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>
