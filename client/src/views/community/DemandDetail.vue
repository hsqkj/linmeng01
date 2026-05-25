<template>
  <div class="page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <div class="header-actions">
        <el-button text @click="copyLink"><el-icon><Link /></el-icon> 复制链接</el-button>
        <el-button text type="primary" @click="shareMiniProgram"><el-icon><Share /></el-icon> 分享</el-button>
      </div>
    </div>

    <div v-loading="loading" element-loading-text="加载中...">
      <div class="detail-layout" v-if="demand">
        <!-- 主内容 -->
        <div class="main-content">
          <div class="demand-card">
            <!-- 标题区 -->
            <div class="demand-header">
              <div class="demand-meta">
                <el-tag :color="typeColor[demand.demand_type]" effect="dark" size="large" style="border:none;color:#fff">
                  {{ typeLabel[demand.demand_type] || demand.demand_type }}
                </el-tag>
                <el-tag :type="statusTagType[demand.status]" size="small" style="margin-left:6px">{{ statusName[demand.status] }}</el-tag>
              </div>
              <h1 class="demand-title">{{ demand.title }}</h1>
              <div class="demand-community">
                <el-icon><Location /></el-icon>
                {{ demand.community_name }}
                <span v-if="demand.district" style="color:#bbb;margin-left:4px">{{ demand.district }}·{{ demand.street }}</span>
              </div>
            </div>

            <el-divider style="margin:14px 0" />

            <!-- ===== 活动需求 ===== -->
            <template v-if="demand.demand_type === 'activity'">
              <div class="section">
                <div class="section-title">📋 活动基本信息</div>
                <div class="info-grid">
                  <div class="info-item" v-if="demand.activity_type">
                    <span class="info-label">活动类型</span>
                    <span class="info-value">{{ demand.activity_type }}</span>
                  </div>
                  <div class="info-item" v-if="audienceList.length">
                    <span class="info-label">目标对象</span>
                    <span class="info-value tag-row">
                      <el-tag v-for="g in audienceList" :key="g" size="small" type="warning" style="margin:2px">{{ g }}</el-tag>
                    </span>
                  </div>
                  <div class="info-item" v-if="demand.start_time">
                    <span class="info-label">活动时间</span>
                    <span class="info-value">{{ fmt(demand.start_time) }}<br>至 {{ fmt(demand.end_time) }}</span>
                  </div>
                  <div class="info-item" v-if="demand.location_type">
                    <span class="info-label">地点类型</span>
                    <span class="info-value">{{ demand.location_type === 'outdoor' || demand.location_type === '室外' ? '🌳 室外' : '🏠 室内' }}</span>
                  </div>
                  <div class="info-item" v-if="demand.location_name || demand.location">
                    <span class="info-label">活动地点</span>
                    <span class="info-value">{{ demand.location_name || demand.location }}</span>
                  </div>
                  <div class="info-item" v-if="demand.expected_count">
                    <span class="info-label">预计人数</span>
                    <span class="info-value">{{ demand.expected_count }} 人</span>
                  </div>
                  <div class="info-item" v-if="demand.deadline">
                    <span class="info-label">报名截止</span>
                    <span class="info-value" :class="{ 'text-warn': isDeadlineNear }">{{ fmtDate(demand.deadline) }}</span>
                  </div>
                </div>
              </div>

              <div class="section" v-if="demand.content">
                <div class="section-title">📝 活动简介</div>
                <p class="description">{{ demand.content }}</p>
              </div>

              <!-- 赞助需求 -->
              <div class="section" v-if="sponsorTypes.length">
                <div class="section-title">🤝 赞助需求</div>
                <div class="sponsor-chips">
                  <div v-for="s in sponsorTypes" :key="s" class="sponsor-chip" :class="s">
                    {{ sponsorLabel[s] || s }}
                  </div>
                </div>

                <!-- 资金详情 -->
                <div v-if="sponsorTypes.includes('fund') && fundDetails" class="sponsor-detail">
                  <div class="detail-sub-title">💰 资金赞助详情</div>
                  <div class="info-grid">
                    <div class="info-item" v-if="fundDetails.min || fundDetails.max">
                      <span class="info-label">金额范围</span>
                      <span class="info-value">{{ fundDetails.min ? fundDetails.min + '元' : '' }}{{ (fundDetails.min && fundDetails.max) ? ' ~ ' : '' }}{{ fundDetails.max ? fundDetails.max + '元' : '' }}</span>
                    </div>
                    <div class="info-item" v-if="fundDetails.usage">
                      <span class="info-label">资金用途</span>
                      <span class="info-value">{{ fundDetails.usage }}</span>
                    </div>
                  </div>
                </div>

                <!-- 物资详情 -->
                <div v-if="sponsorTypes.includes('goods') && goodsDetails" class="sponsor-detail">
                  <div class="detail-sub-title">📦 物资赞助详情</div>
                  <div class="info-item" v-if="goodsDetails.list">
                    <span class="info-label">物资清单</span>
                    <span class="info-value pre-wrap">{{ goodsDetails.list }}</span>
                  </div>
                  <div class="info-item" v-if="goodsDetails.delivery">
                    <span class="info-label">配送方式</span>
                    <span class="info-value">{{ goodsDetails.delivery === 'self' ? '商家自行配送' : '社区自取' }}</span>
                  </div>
                </div>

                <!-- 人力支持 -->
                <div v-if="sponsorTypes.includes('manpower') && manpowerDetails" class="sponsor-detail">
                  <div class="detail-sub-title">👥 人力支持详情</div>
                  <div class="info-grid">
                    <div class="info-item" v-if="manpowerDetails.count">
                      <span class="info-label">所需人数</span>
                      <span class="info-value">{{ manpowerDetails.count }} 人</span>
                    </div>
                    <div class="info-item" v-if="manpowerDetails.hours">
                      <span class="info-label">服务时长</span>
                      <span class="info-value">{{ manpowerDetails.hours }} 小时</span>
                    </div>
                    <div class="info-item" v-if="manpowerDetails.content" style="grid-column:1/-1">
                      <span class="info-label">工作内容</span>
                      <span class="info-value pre-wrap">{{ manpowerDetails.content }}</span>
                    </div>
                    <div class="info-item" v-if="manpowerDetails.skills">
                      <span class="info-label">技能要求</span>
                      <span class="info-value">{{ manpowerDetails.skills }}</span>
                    </div>
                  </div>
                </div>

                <!-- 技术支持 -->
                <div v-if="sponsorTypes.includes('tech') && techDetails" class="sponsor-detail">
                  <div class="detail-sub-title">💻 技术支持详情</div>
                  <div class="info-item" v-if="techDetails.types && techDetails.types.length">
                    <span class="info-label">技术类型</span>
                    <span class="info-value">{{ techDetails.types.map(t => techTypeLabel[t] || t).join('、') }}</span>
                  </div>
                  <div class="info-item" v-if="techDetails.desc">
                    <span class="info-label">具体需求</span>
                    <span class="info-value pre-wrap">{{ techDetails.desc }}</span>
                  </div>
                </div>

                <!-- 媒体报道 -->
                <div v-if="sponsorTypes.includes('media') && mediaDetails" class="sponsor-detail">
                  <div class="detail-sub-title">📰 媒体报道详情</div>
                  <div class="info-grid">
                    <div class="info-item" v-if="mediaDetails.types && mediaDetails.types.length">
                      <span class="info-label">媒体类型</span>
                      <span class="info-value">{{ mediaDetails.types.map(t => mediaTypeLabel[t] || t).join('、') }}</span>
                    </div>
                    <div class="info-item" v-if="mediaDetails.publishTime">
                      <span class="info-label">预期发布</span>
                      <span class="info-value">{{ mediaDetails.publishTime }}</span>
                    </div>
                    <div class="info-item" v-if="mediaDetails.desc" style="grid-column:1/-1">
                      <span class="info-label">报道说明</span>
                      <span class="info-value pre-wrap">{{ mediaDetails.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 期望回报 -->
              <div class="section" v-if="demand.return_ways || demand.return_value || demand.expected_return">
                <div class="section-title">🎁 期望回报</div>
                <p class="description">{{ demand.return_ways || demand.expected_return || demand.return_value }}</p>
              </div>

              <!-- 志愿服务积分 -->
              <div class="section" v-if="demand.volunteer_points > 0">
                <div class="section-title">🏅 志愿服务积分</div>
                <div class="volunteer-box">
                  <div class="volunteer-score">{{ demand.volunteer_points }}<small> 积分</small></div>
                  <div class="volunteer-meta">
                    <span v-if="demand.volunteer_max_points">每人上限 {{ demand.volunteer_max_points }} 分</span>
                    <span v-if="demand.volunteer_count">· 招募 {{ demand.volunteer_count }} 名志愿者</span>
                  </div>
                  <p v-if="demand.volunteer_desc" class="volunteer-desc">{{ demand.volunteer_desc }}</p>
                </div>
              </div>
            </template>

            <!-- ===== 专家服务需求 ===== -->
            <template v-if="demand.demand_type === 'expert'">
              <div class="section">
                <div class="section-title">🎓 专家服务信息</div>
                <div class="info-grid">
                  <div class="info-item" v-if="demand.expert_type || demand.activity_type">
                    <span class="info-label">专家类型</span>
                    <span class="info-value">{{ demand.expert_type || demand.activity_type }}</span>
                  </div>
                  <div class="info-item" v-if="audienceList.length">
                    <span class="info-label">服务对象</span>
                    <span class="info-value tag-row">
                      <el-tag v-for="g in audienceList" :key="g" size="small" type="warning" style="margin:2px">{{ g }}</el-tag>
                    </span>
                  </div>
                  <div class="info-item" v-if="demand.start_time">
                    <span class="info-label">服务时间</span>
                    <span class="info-value">{{ fmt(demand.start_time) }}<br>至 {{ fmt(demand.end_time) }}</span>
                  </div>
                  <div class="info-item" v-if="demand.location_name || demand.location">
                    <span class="info-label">服务地点</span>
                    <span class="info-value">{{ demand.location_name || demand.location }}</span>
                  </div>
                  <div class="info-item" v-if="demand.expected_count">
                    <span class="info-label">预计人数</span>
                    <span class="info-value">{{ demand.expected_count }} 人</span>
                  </div>
                  <div class="info-item" v-if="demand.deadline">
                    <span class="info-label">报名截止</span>
                    <span class="info-value">{{ fmtDate(demand.deadline) }}</span>
                  </div>
                </div>
              </div>

              <div class="section" v-if="demand.content">
                <div class="section-title">📝 服务需求说明</div>
                <p class="description">{{ demand.content }}</p>
              </div>

              <div class="section" v-if="demand.return_ways || demand.return_value">
                <div class="section-title">🎁 回报方式</div>
                <p class="description">{{ demand.return_ways || demand.return_value }}</p>
              </div>
            </template>

            <!-- ===== 空间运营需求 ===== -->
            <template v-if="demand.demand_type === 'space'">
              <div class="section">
                <div class="section-title">🏢 空间运营信息</div>
                <div class="info-grid">
                  <div class="info-item" v-if="demand.space_type || demand.activity_type">
                    <span class="info-label">空间类型</span>
                    <span class="info-value">{{ demand.space_type || demand.activity_type }}</span>
                  </div>
                  <div class="info-item" v-if="demand.location_name || demand.location">
                    <span class="info-label">空间位置</span>
                    <span class="info-value">{{ demand.location_name || demand.location }}</span>
                  </div>
                  <div class="info-item" v-if="demand.expected_count">
                    <span class="info-label">可容纳人数</span>
                    <span class="info-value">{{ demand.expected_count }} 人</span>
                  </div>
                  <div class="info-item" v-if="demand.start_time">
                    <span class="info-label">合作时间</span>
                    <span class="info-value">{{ fmt(demand.start_time) }}<br>至 {{ fmt(demand.end_time) }}</span>
                  </div>
                  <div class="info-item" v-if="demand.deadline">
                    <span class="info-label">报名截止</span>
                    <span class="info-value">{{ fmtDate(demand.deadline) }}</span>
                  </div>
                </div>
              </div>

              <div class="section" v-if="demand.content">
                <div class="section-title">📝 空间说明</div>
                <p class="description">{{ demand.content }}</p>
              </div>

              <div class="section" v-if="demand.return_ways || demand.return_value">
                <div class="section-title">🎁 合作回报</div>
                <p class="description">{{ demand.return_ways || demand.return_value }}</p>
              </div>
            </template>

            <!-- ===== 通用：标签 ===== -->
            <div class="section" v-if="tagList.length">
              <div class="section-title">🏷️ 标签</div>
              <div class="tag-row">
                <el-tag v-for="t in tagList" :key="t" size="small" type="info" style="margin:3px">{{ t }}</el-tag>
              </div>
            </div>

            <!-- ===== 统计 ===== -->
            <div class="stat-bar">
              <span>👁 {{ demand.view_count || 0 }} 浏览</span>
              <span>📬 {{ intentions.length }} 条合作意向</span>
              <span>🕒 {{ fmtDate(demand.created_at) }} 发布</span>
            </div>
          </div>

          <!-- 合作意向 -->
          <div class="demand-card">
            <div class="section-title" style="margin-bottom:14px">📬 合作意向（{{ intentions.length }}）</div>
            <el-empty v-if="intentions.length === 0" description="暂无商家提交合作意向" :image-size="60" />
            <div v-else class="intention-list">
              <el-card v-for="item in intentions" :key="item.id" class="intention-card">
                <div class="intention-header">
                  <div style="display:flex;align-items:center;gap:10px">
                    <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(item.company_name || '商家')}&background=FF9800&color=fff&size=40`" style="width:40px;height:40px;border-radius:8px" />
                    <div>
                      <div style="font-weight:600">{{ item.company_name }}</div>
                      <div style="font-size:12px;color:#909399">{{ item.industry || '' }}</div>
                    </div>
                  </div>
                  <el-tag :type="intentionTagType[item.status]" size="small">{{ intentionStatusName[item.status] }}</el-tag>
                </div>
                <div style="margin-top:10px;font-size:14px;color:#606266">{{ item.intro || '暂无说明' }}</div>
                <div style="margin-top:8px;font-size:12px;color:#909399">{{ fmt(item.created_at) }}</div>
                <div class="intention-actions" v-if="item.status === 0">
                  <el-button type="success" size="small" @click="acceptIntention(item)">接受合作</el-button>
                  <el-button type="info" size="small" plain @click="rejectIntention(item)">婉拒</el-button>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <!-- 侧边栏 / 底部操作区 -->
        <div class="side-content">
          <el-card class="action-card">
            <div class="action-title">⚡ 操作</div>
            <div class="action-btns">
              <el-button type="success" style="width:100%" @click="shareMiniProgram">
                <el-icon><Share /></el-icon> 分享给朋友
              </el-button>
              <el-button type="info" plain style="width:100%" @click="copyLink">
                <el-icon><Link /></el-icon> 复制链接
              </el-button>
              <el-button type="warning" style="width:100%" @click="$router.push(`/community/demands/edit/${demand.id}`)" v-if="isOwner">
                <el-icon><Edit /></el-icon> 编辑需求
              </el-button>
              <el-button type="danger" plain style="width:100%" @click="deleteDemand" v-if="isOwner">
                <el-icon><Delete /></el-icon> 删除需求
              </el-button>
            </div>
          </el-card>

          <el-card>
            <div class="action-title">📊 数据</div>
            <div class="stat-row"><span class="stat-label">浏览量</span><span class="stat-val">{{ demand.view_count || 0 }}</span></div>
            <div class="stat-row"><span class="stat-label">合作意向</span><span class="stat-val">{{ intentions.length }}</span></div>
            <div class="stat-row"><span class="stat-label">发布时间</span><span class="stat-val">{{ fmtDate(demand.created_at) }}</span></div>
            <div class="stat-row" v-if="demand.deadline"><span class="stat-label">截止日期</span><span class="stat-val" :class="{ 'text-warn': isDeadlineNear }">{{ fmtDate(demand.deadline) }}</span></div>
          </el-card>
        </div>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="!loading" class="empty-wrap">
        <el-empty description="需求不存在或已下架" />
        <el-button @click="$router.push('/community/demands')">返回需求列表</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Share, Link, Edit, Delete, Location } from '@element-plus/icons-vue'
import { getDemandDetail, deleteDemand as apiDelete, getMyIntentions, acceptIntention as apiAccept, rejectIntention as apiReject } from '@/api/community'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const demand = ref(null)
const intentions = ref([])

// ===== 标签映射 =====
const typeLabel = { activity: '活动赞助', expert: '专家服务', space: '空间运营' }
const typeColor = { activity: '#07c160', expert: '#1677ff', space: '#ff9800' }
const statusName = { 0: '待审核', 1: '已发布', 2: '已下架' }
const statusTagType = { 0: 'warning', 1: 'success', 2: 'info' }
const intentionStatusName = { 0: '待处理', 1: '已接受', 2: '已拒绝', 3: '已完成' }
const intentionTagType = { 0: 'warning', 1: 'success', 2: 'info', 3: 'primary' }
const sponsorLabel = { fund: '💰 资金赞助', goods: '📦 物资赞助', manpower: '👥 人力支持', tech: '💻 技术支持', media: '📰 媒体报道', service: '🎯 服务赞助' }
const techTypeLabel = { equipment: '设备器材', software: '软件系统', internet: '网络接入', broadcast: '广播音响', lighting: '灯光舞台' }
const mediaTypeLabel = { news: '新闻网站', wechat: '微信公众号', weibo: '微博', video: '短视频', newspaper: '报纸/杂志' }

// ===== 工具函数 =====
function parseJ(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { return JSON.parse(val) } catch {} }
  return []
}

function fmt(time) {
  if (!time) return ''
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${d.getHours()}:${pad(d.getMinutes())}`
}

function fmtDate(time) {
  if (!time) return ''
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

// ===== 计算属性 =====
const audienceList = computed(() => {
  if (!demand.value) return []
  return parseJ(demand.value.target_audience)
})

const tagList = computed(() => {
  if (!demand.value) return []
  return parseJ(demand.value.tags)
})

const sponsorTypes = computed(() => {
  if (!demand.value?.sponsor_types) return []
  return parseJ(demand.value.sponsor_types)
})

const fundDetails = computed(() => {
  if (!demand.value?.fund_details) return null
  const v = demand.value.fund_details
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return null }
})

const goodsDetails = computed(() => {
  if (!demand.value?.goods_details) return null
  const v = demand.value.goods_details
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return null }
})

const manpowerDetails = computed(() => {
  if (!demand.value?.manpower_details) return null
  const v = demand.value.manpower_details
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return null }
})

const techDetails = computed(() => {
  if (!demand.value?.tech_details) return null
  const v = demand.value.tech_details
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return null }
})

const mediaDetails = computed(() => {
  if (!demand.value?.media_details) return null
  const v = demand.value.media_details
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return null }
})

const isOwner = computed(() => !!localStorage.getItem('community_token'))

const isDeadlineNear = computed(() => {
  if (!demand.value?.deadline) return false
  const diff = Math.ceil((new Date(demand.value.deadline) - new Date()) / 86400000)
  return diff > 0 && diff <= 7
})

// ===== 加载数据 =====
async function loadDemand() {
  loading.value = true
  try {
    const res = await getDemandDetail(route.params.id)
    demand.value = res.data
    await loadIntentions()
  } catch {
    demand.value = null
  } finally {
    loading.value = false
  }
}

async function loadIntentions() {
  try {
    const res = await getMyIntentions({ demand_id: route.params.id })
    intentions.value = res.data?.list || res.data || []
  } catch {
    intentions.value = []
  }
}

// ===== 操作 =====
async function acceptIntention(item) {
  try {
    await ElMessageBox.confirm(`确定接受「${item.company_name}」的合作意向吗？`, '确认接受', { type: 'success' })
    await apiAccept(item.id)
    ElMessage.success('已接受合作')
    loadDemand()
  } catch {}
}

async function rejectIntention(item) {
  try {
    await ElMessageBox.confirm(`确定婉拒「${item.company_name}」的合作意向吗？`, '确认婉拒', { type: 'info' })
    await apiReject(item.id, { reason: '暂无合作意向' })
    ElMessage.success('已婉拒')
    loadDemand()
  } catch {}
}

async function deleteDemand() {
  try {
    await ElMessageBox.confirm('确定要删除该需求吗？删除后无法恢复。', '确认删除', { type: 'warning' })
    await apiDelete(route.params.id)
    ElMessage.success('已删除')
    router.replace('/community/demands')
  } catch {}
}

// ===== 分享 =====
const pageUrl = computed(() => `${window.location.origin}/community/demands/${route.params.id}`)
const shareTitle = computed(() => demand.value ? `邻盟社区需求：${demand.value.title}` : '邻盟社区需求')

// 复制链接
async function copyLink() {
  try {
    await navigator.clipboard.writeText(pageUrl.value)
    ElMessage.success('链接已复制，可粘贴分享')
  } catch {
    ElMessage({ message: '复制链接：' + pageUrl.value, type: 'info', duration: 6000 })
  }
}

// 小程序内分享 / H5 分享
function shareMiniProgram() {
  // 尝试微信小程序 WebView 分享
  if (window.__wxjs_environment === 'miniprogram' || (window.wx && window.wx.miniProgram)) {
    try {
      // 通知小程序 app.js / webview 页面触发分享
      window.wx.miniProgram.postMessage({
        data: {
          type: 'share',
          title: shareTitle.value,
          path: `/pages/webview/webview?url=${encodeURIComponent(pageUrl.value)}`,
          imageUrl: ''
        }
      })
      ElMessage.success('点击右上角"···"即可分享给朋友')
    } catch {
      fallbackShare()
    }
    return
  }
  fallbackShare()
}

async function fallbackShare() {
  if (navigator.share) {
    try {
      await navigator.share({ title: shareTitle.value, text: shareTitle.value, url: pageUrl.value })
      return
    } catch {}
  }
  copyLink()
}

onMounted(() => {
  loadDemand()
})
</script>

<style scoped>
/* ===== 公共 ===== */
.page { min-height: 100vh; background: #f5f5f5; }
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; background: #fff; border-bottom: 1px solid #f0f0f0;
  position: sticky; top: 0; z-index: 10;
}
.header-actions { display: flex; gap: 4px; }
.demand-header { margin-bottom: 6px; }
.demand-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.demand-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px; line-height: 1.4; }
.demand-community { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 4px; }

.section { margin-top: 18px; }
.section-title { font-size: 15px; font-weight: 700; color: #303133; margin-bottom: 12px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.tag-row { display: flex; flex-wrap: wrap; }
.pre-wrap { white-space: pre-wrap; }
.description { font-size: 14px; color: #606266; line-height: 1.8; white-space: pre-wrap; margin: 0; }
.text-warn { color: #E6A23C !important; font-weight: 600; }

/* 赞助块 */
.sponsor-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.sponsor-chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
.sponsor-chip.fund { background: #FFF3E0; color: #E65100; }
.sponsor-chip.goods { background: #E8F5E9; color: #2E7D32; }
.sponsor-chip.manpower { background: #E3F2FD; color: #1565C0; }
.sponsor-chip.tech { background: #F3E5F5; color: #7B1FA2; }
.sponsor-chip.media { background: #FFF8E1; color: #F57F17; }
.sponsor-chip.service { background: #E0F7FA; color: #00838F; }
.sponsor-detail { background: #fafafa; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.detail-sub-title { font-size: 13px; font-weight: 600; color: #606266; margin-bottom: 10px; }

/* 志愿积分 */
.volunteer-box { background: #f0f9eb; border-radius: 8px; padding: 12px; }
.volunteer-score { font-size: 28px; font-weight: 700; color: #07C160; }
.volunteer-score small { font-size: 12px; color: #909399; }
.volunteer-meta { font-size: 13px; color: #606266; margin-top: 4px; }
.volunteer-desc { margin: 8px 0 0; font-size: 13px; color: #606266; }

/* 统计条 */
.stat-bar { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 18px; padding-top: 14px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #909399; }

/* 合作意向 */
.intention-list { display: flex; flex-direction: column; gap: 12px; }
.intention-card :deep(.el-card__body) { padding: 14px; }
.intention-header { display: flex; justify-content: space-between; align-items: center; }
.intention-actions { margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; }

/* 侧边栏 */
.action-card { margin-bottom: 0; }
.action-title { font-size: 15px; font-weight: 700; color: #303133; margin-bottom: 12px; }
.action-btns { display: flex; flex-direction: column; gap: 8px; }
.stat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.stat-row:last-child { border-bottom: none; }
.stat-label { font-size: 13px; color: #909399; }
.stat-val { font-size: 14px; color: #303133; font-weight: 600; }

.empty-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; }

/* ===== PC ===== */
@media (min-width: 769px) {
  .page { padding: 20px 20px 60px; background: #f0f2f5; }
  .page-header { border-radius: 0; }
  .detail-layout { max-width: 1100px; margin: 16px auto 0; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
  .main-content, .side-content { display: flex; flex-direction: column; gap: 16px; }
  .demand-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .action-card :deep(.el-card__body), .side-content :deep(.el-card__body) { padding: 18px; }
}

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .page-header { padding: 8px 12px; }
  .detail-layout { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
  .main-content, .side-content { display: flex; flex-direction: column; gap: 10px; }
  .demand-card { background: #fff; border-radius: 10px; padding: 14px; }
  .demand-title { font-size: 16px; }
  .info-grid { grid-template-columns: 1fr; gap: 10px; }
  .side-content { order: -1; }
  .action-card { margin-bottom: 0; }
}
</style>
