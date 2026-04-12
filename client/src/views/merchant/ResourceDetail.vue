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
              <el-tag :type="resourceTypeTag.value?.[currentResource.resource_type] || ''" size="large" effect="dark">
                {{ getResourceTypeName(currentResource.resource_type) }}
              </el-tag>
              <el-tag :type="statusTypeTag?.[currentResource.status] || 'info'" size="small" style="margin-left:8px">
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
                <span class="info-value"><el-tag size="small">{{ getResourceTypeName(currentResource.resource_type) }}</el-tag></span>
              </div>
              <!-- 资金赞助字段 -->
              <template v-if="getCurrentResourceType() === '资金赞助'">
                <div class="info-item" v-if="currentResource.min_amount || currentResource.max_amount">
                  <span class="info-label">赞助金额范围</span>
                  <span class="info-value">{{ currentResource.min_amount || 0 }} ~ {{ currentResource.max_amount || 0 }} 元</span>
                </div>
                <div class="info-item" v-if="currentResource.fund_scenes && currentResource.fund_scenes.length > 0">
                  <span class="info-label">适用场景</span>
                  <span class="info-value">
                    <el-tag v-for="s in currentResource.fund_scenes" :key="s" size="small" style="margin-right:4px">
                      {{ {festival:'节庆活动',welfare:'公益活动',sports:'体育赛事',education:'教育活动',culture:'文化活动',any:'不限场景'}[s] || s }}
                    </el-tag>
                  </span>
                </div>
              </template>
              <!-- 物资捐赠字段 -->
              <template v-if="getCurrentResourceType() === '物资捐赠'">
                <div class="info-item" v-if="currentResource.specs">
                  <span class="info-label">物资清单</span>
                  <span class="info-value">{{ currentResource.specs }}</span>
                </div>
                <div class="info-item" v-if="currentResource.quantity">
                  <span class="info-label">物资数量</span>
                  <span class="info-value">{{ currentResource.quantity }}</span>
                </div>
                <div class="info-item" v-if="currentResource.pickup_way">
                  <span class="info-label">领取方式</span>
                  <span class="info-value">{{ {delivery:'可配送',pickup:'自取',both:'均可'}[currentResource.pickup_way] || currentResource.pickup_way }}</span>
                </div>
                <div class="info-item" v-if="currentResource.goods_expiry">
                  <span class="info-label">有效期至</span>
                  <span class="info-value">{{ currentResource.goods_expiry }}</span>
                </div>
              </template>
              <!-- 志愿服务字段 -->
              <template v-if="getCurrentResourceType() === '志愿服务'">
                <div class="info-item" v-if="currentResource.staff_count">
                  <span class="info-label">可派遣人数</span>
                  <span class="info-value">{{ currentResource.staff_count }}人</span>
                </div>
                <div class="info-item" v-if="currentResource.work_duration">
                  <span class="info-label">单次服务时长</span>
                  <span class="info-value">{{ currentResource.work_duration }}小时</span>
                </div>
                <div class="info-item" v-if="currentResource.skill_requirements">
                  <span class="info-label">人员类型描述</span>
                  <span class="info-value">{{ currentResource.skill_requirements }}</span>
                </div>
              </template>
              <!-- 技术支持字段 -->
              <template v-if="getCurrentResourceType() === '技术支持'">
                <div class="info-item" v-if="currentResource.tech_types && currentResource.tech_types.length > 0">
                  <span class="info-label">技术类型</span>
                  <span class="info-value">
                    <el-tag v-for="t in currentResource.tech_types" :key="t" size="small" style="margin-right:4px">
                      {{ {equipment:'设备器材',software:'软件系统',network:'网络通信',av:'专业音视频',lighting:'灯光设备',smart:'智能设备'}[t] || t }}
                    </el-tag>
                  </span>
                </div>
                <div class="info-item" v-if="currentResource.tech_service_type">
                  <span class="info-label">服务方式</span>
                  <span class="info-value">{{ {rent:'设备租借',service:'提供服务团队',both:'均可'}[currentResource.tech_service_type] || currentResource.tech_service_type }}</span>
                </div>
              </template>
              <!-- 专业服务字段 -->
              <template v-if="getCurrentResourceType() === '专业服务'">
                <div class="info-item" v-if="currentResource.professional_type">
                  <span class="info-label">专业服务类型</span>
                  <span class="info-value">{{ currentResource.professional_type }}</span>
                </div>
                <div class="info-item" v-if="currentResource.service_scope">
                  <span class="info-label">服务范围</span>
                  <span class="info-value">{{ {city:'全市',district:'本区',online:'线上'}[currentResource.service_scope] || currentResource.service_scope }}</span>
                </div>
                <div class="info-item" v-if="currentResource.certification">
                  <span class="info-label">资质证明</span>
                  <span class="info-value">{{ currentResource.certification }}</span>
                </div>
                <div class="info-item" v-if="currentResource.price_range">
                  <span class="info-label">收费标准</span>
                  <span class="info-value">{{ {free:'免费',discount:'优惠价',market:'市场价'}[currentResource.price_range] || currentResource.price_range }}</span>
                </div>
              </template>
              <!-- 媒体宣传字段 -->
              <template v-if="getCurrentResourceType() === '媒体宣传'">
                <div class="info-item" v-if="currentResource.media_channels && currentResource.media_channels.length > 0">
                  <span class="info-label">媒体渠道</span>
                  <span class="info-value">
                    <el-tag v-for="c in currentResource.media_channels" :key="c" size="small" style="margin-right:4px">{{ c }}</el-tag>
                  </span>
                </div>
                <div class="info-item" v-if="currentResource.media_type">
                  <span class="info-label">媒体类型</span>
                  <span class="info-value">{{ currentResource.media_type }}</span>
                </div>
                <div class="info-item" v-if="currentResource.coverage">
                  <span class="info-label">覆盖范围</span>
                  <span class="info-value">{{ currentResource.coverage }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- 资源详情 -->
          <div class="section">
            <h3>📝 资源详情</h3>
            <p class="description">{{ currentResource.content || '暂无详情' }}</p>
          </div>

          <!-- 标签 -->
          <div class="section" v-if="currentResource.tags && currentResource.tags.length">
            <h3>🏷️ 资源标签</h3>
            <el-tag v-for="tag in currentResource.tags" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
          </div>

          <!-- 期望回报 -->
          <div class="section" v-if="currentResource.expected_rewards && currentResource.expected_rewards.length">
            <h3>🎁 期望回报</h3>
            <div class="info-grid">
              <div class="info-item" style="grid-column: 1 / -1">
                <span class="info-label">回报类型</span>
                <span class="info-value">
                  <el-tag v-for="r in currentResource.expected_rewards" :key="r" type="warning" style="margin-right:4px">{{ r }}</el-tag>
                </span>
              </div>
              <div class="info-item" v-if="currentResource.expected_reward_desc" style="grid-column: 1 / -1">
                <span class="info-label">回报说明</span>
                <span class="info-value">{{ currentResource.expected_reward_desc }}</span>
              </div>
            </div>
          </div>

          <!-- 有效期 -->
          <div class="section" v-if="currentResource.valid_until">
            <h3>📅 有效期至</h3>
            <p class="description">{{ currentResource.valid_until }}</p>
          </div>

          <!-- 商家位置地图 -->
          <div class="section" v-if="hasLocation">
            <h3>📍 商家位置</h3>
            <MapDisplay
              :lat="merchantLat"
              :lng="merchantLng"
              :height="260"
              empty-text="商家尚未设置位置信息"
            />
          </div>

          <!-- 图片展示 -->
          <div class="section" v-if="currentResource.images && currentResource.images.length">
            <h3>📷 资源图片</h3>
            <div class="image-gallery">
              <el-image 
                v-for="(img, idx) in currentResource.images" 
                :key="idx"
                :src="img" 
                :preview-src-list="currentResource.images"
                fit="cover"
                class="gallery-image"
              />
            </div>
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
          <el-button style="width:100%" @click="$router.push('/merchant/resources/edit/' + route.params.id)">
            编辑资源信息
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getResourceComments, getResourceDetail } from '@/api/merchant'
import { replyComment } from '@/api/merchant'
import MapDisplay from '@/components/MapDisplay.vue'

const route = useRoute()
const currentResource = ref({})
const comments = ref([])
const commentText = ref('')
const commentLoading = ref(false)

// 资源类型映射（从API动态加载）
const resourceTypeName = ref({})
const resourceTypeTag = ref({})
const statusTypeTag = { 1: 'success', 0: 'warning', 2: 'info', 3: 'danger' }
const statusName = { 1: '已通过', 0: '待审核', 2: '已拒绝', 3: '已下架' }

// 获取资源类型中文名称
function getResourceTypeName(type) {
  // 如果是字符串且在映射中存在
  if (typeof type === 'string' && resourceTypeName.value[type] !== undefined) {
    return resourceTypeName.value[type]
  }
  // 如果是数字
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeName.value[num] !== undefined) {
    return resourceTypeName.value[num]
  }
  // 如果是字符串类型名称，直接返回
  if (typeof type === 'string') {
    return type
  }
  return type || '未知'
}

// 获取当前资源的资源类型（中文）
function getCurrentResourceType() {
  return getResourceTypeName(currentResource.value?.resource_type)
}

// 商家坐标（来自关联的商家表）
const merchantLat = computed(() => {
  const v = currentResource.value?.lat
  return (v !== null && v !== undefined) ? parseFloat(v) : null
})
const merchantLng = computed(() => {
  const v = currentResource.value?.lng
  return (v !== null && v !== undefined) ? parseFloat(v) : null
})
const hasLocation = computed(() =>
  merchantLat.value !== null && merchantLng.value !== null &&
  !isNaN(merchantLat.value) && !isNaN(merchantLng.value)
)

// 加载资源类型配置
async function loadResourceTypes() {
  try {
    const { getPublishTypes } = await import('@/api/merchant')
    const res = await getPublishTypes()
    if (res.data?.resource_types?.length) {
      // 构建数字到中文的映射
      const nameMap = {}
      const tagMap = {}
      const colors = ['', 'success', 'warning', 'info', 'danger', 'primary', 'success', 'info', 'warning', 'danger', '']
      res.data.resource_types.forEach((name, idx) => {
        nameMap[idx] = name
        nameMap[name] = name
        tagMap[idx] = colors[idx % colors.length] || ''
        tagMap[name] = colors[idx % colors.length] || ''
      })
      resourceTypeName.value = nameMap
      resourceTypeTag.value = tagMap
    }
  } catch {
    // 使用空映射
  }
}

// 获取标签列表
function getTagsList(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try { return JSON.parse(tags) } catch { return [] }
  }
  return []
}

async function loadResource() {
  try {
    // 使用专门的详情 API 获取完整信息
    const res = await getResourceDetail(route.params.id)
    const data = res.data || {}
    // 后端已返回解析后的数组，直接使用
    currentResource.value = {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : getTagsList(data.tags),
      images: Array.isArray(data.images) ? data.images : getTagsList(data.images)
    }
    console.log('Resource loaded:', currentResource.value)
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
      time: new Date(c.created_at).toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }),
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
  loadResourceTypes()
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
.image-gallery { display: flex; flex-wrap: wrap; gap: 12px; }
.gallery-image { width: 150px; height: 150px; border-radius: 8px; cursor: pointer; }
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
