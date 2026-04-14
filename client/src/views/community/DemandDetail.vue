<template>
  <div class="page">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回需求列表</el-button>
    </div>

    <div v-loading="loading" element-loading-text="加载中...">
      <div class="detail-layout" v-if="demand">
        <!-- 主内容 -->
        <div class="main-content">
          <div class="demand-card">
            <div class="demand-header">
              <div class="demand-meta">
                <el-tag type="primary" size="large" effect="dark">{{ demandTypeName[demand.demand_type] || demand.demand_type }}</el-tag>
                <el-tag type="info" size="small" style="margin-left:8px">{{ demand.location_type === '室外' ? '🌳' : '🏠' }} {{ demand.location_type }}活动</el-tag>
                <el-tag :type="statusType[demand.status]" size="small" style="margin-left:8px">{{ statusName[demand.status] }}</el-tag>
              </div>
              <h1 class="demand-title">{{ demand.title }}</h1>
            </div>

            <el-divider />

            <!-- 基本信息 -->
            <div class="section">
              <h3>📋 活动基本信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">活动类型</span>
                  <span class="info-value">{{ demandTypeName[demand.demand_type] || demand.demand_type }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">目标对象</span>
                  <span class="info-value">
                    <el-tag v-for="g in (demand.target_audience ? (Array.isArray(demand.target_audience) ? demand.target_audience : demand.target_audience.split(',')) : [])" :key="g" size="small" type="warning" style="margin:2px">{{ getAudienceName(g) }}</el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">活动时间</span>
                  <span class="info-value">{{ formatDateTime(demand.start_time) || formatDateTime(demand.end_time) ? (formatDateTime(demand.start_time) + ' ~ ' + formatDateTime(demand.end_time)) : '待定' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">活动地点</span>
                  <span class="info-value">{{ demand.location_type === '室外' ? '🌳' : '🏠' }} {{ demand.location || '待定' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">截止日期</span>
                  <span class="info-value" :class="{ deadline: isDeadlineNear }">{{ formatDateTime(demand.deadline) || '长期有效' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">预算范围</span>
                  <span class="info-value">{{ demand.budget || '面议' }}</span>
                </div>
              </div>
            </div>

            <!-- 活动详情 -->
            <div class="section">
              <h3>📝 活动详情</h3>
              <p class="description">{{ demand.content || '暂无详情' }}</p>
            </div>

            <!-- 赞助意向 -->
            <div class="section" v-if="demand.sponsor_types">
              <h3>🤝 赞助意向</h3>
              <div class="sponsor-blocks">
                <div v-for="s in sponsorBlocks" :key="s.type" class="sponsor-block" :class="s.type">
                  <div class="sblock-title">{{ s.icon }} {{ s.name }}</div>
                  <div class="sblock-desc">{{ s.desc || '详见下方回报说明' }}</div>
                </div>
              </div>
            </div>

            <!-- 回报说明 -->
            <div class="section" v-if="demand.expected_return">
              <h3>🎁 期望回报</h3>
              <p class="description">{{ demand.expected_return }}</p>
            </div>

            <!-- 志愿服务积分 -->
            <div class="section" v-if="demand.volunteer_points > 0">
              <h3>🏅 志愿服务积分</h3>
              <div class="volunteer-info">
                <div class="volunteer-card">
                  <div class="volunteer-score">{{ demand.volunteer_points }}<small> 积分</small></div>
                  <div class="volunteer-detail">
                    <span v-if="demand.volunteer_max_points">每人上限 {{ demand.volunteer_max_points }} 分</span>
                    <span v-if="demand.volunteer_count">· 招募 {{ demand.volunteer_count }} 名志愿者</span>
                  </div>
                </div>
                <p class="volunteer-desc" v-if="demand.volunteer_desc">{{ demand.volunteer_desc }}</p>
              </div>
            </div>

            <!-- 合作意向列表 -->
            <div class="section">
              <h3>📬 合作意向（{{ intentions.length }}条）</h3>
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
                    <el-tag :type="intentionStatusType[item.status]" size="small">{{ intentionStatusName[item.status] }}</el-tag>
                  </div>
                  <div style="margin-top:10px;font-size:14px;color:#606266">{{ item.intro || '暂无说明' }}</div>
                  <div style="margin-top:8px;font-size:12px;color:#909399">{{ formatTime(item.created_at) }}</div>
                  <div class="intention-actions" v-if="item.status === 0">
                    <el-button type="success" size="small" @click="acceptIntention(item)">接受合作</el-button>
                    <el-button type="info" size="small" plain @click="rejectIntention(item)">婉拒</el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="side-content">
          <el-card>
            <h4>📊 数据统计</h4>
            <div class="stat-row">
              <span class="stat-label">浏览量</span>
              <span class="stat-val">{{ demand.view_count || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">合作意向</span>
              <span class="stat-val">{{ intentions.length }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">发布日期</span>
              <span class="stat-val">{{ demand.created_at ? demand.created_at.split('T')[0] : '-' }}</span>
            </div>
          </el-card>

          <el-card>
            <h4>⚡ 快速操作</h4>
            <div style="display:flex;flex-direction:column;gap:8px">
              <el-button type="primary" style="width:100%" @click="$router.push('/community/demands')">返回列表</el-button>
              <el-button type="success" style="width:100%" @click="shareDemand">
                <el-icon><Share /></el-icon> 分享转发
              </el-button>
              <el-button type="warning" style="width:100%" @click="$router.push(`/community/demands/${demand.id}/edit`)" v-if="isOwner">编辑需求</el-button>
              <el-button type="danger" style="width:100%" @click="deleteDemand">删除需求</el-button>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 加载失败 -->
      <el-empty v-else-if="!loading" description="需求不存在或已下架" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Share } from '@element-plus/icons-vue'
import { getDemandDetail, deleteDemand as apiDelete, getMyIntentions, acceptIntention as apiAccept, rejectIntention as apiReject } from '@/api/community'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const demand = ref(null)
const intentions = ref([])

const demandTypeName = {
  // 数字键（API返回）
  0: '活动赞助', 1: '专家服务', 2: '空间运营',
  3: '物资赞助', 4: '健康服务', 5: '教育培训',
  // 中文键（兼容）
  '活动赞助': '活动赞助', '专家服务': '专家服务', '空间运营': '空间运营',
  '物资赞助': '物资赞助', '健康服务': '健康服务', '教育培训': '教育培训'
}

// 目标对象数字→中文映射
const audienceMap = {
  0: '老年人', 1: '儿童', 2: '青少年', 3: '家庭', 4: '退役军人',
  5: '残障人士', 6: '新业态从业者', 7: '社区居民', 8: '其他'
}

function getAudienceName(val) {
  const n = parseInt(val)
  if (!isNaN(n) && audienceMap[n] !== undefined) return audienceMap[n]
  return val
}

const statusName = { 0: '待审核', 1: '已发布', 2: '已下架' }
const statusType = { 0: 'warning', 1: 'success', 2: 'info' }
const intentionStatusName = { 0: '待处理', 1: '已接受', 2: '已拒绝', 3: '已完成' }
const intentionStatusType = { 0: 'warning', 1: 'success', 2: 'info', 3: 'primary' }

// 判断是否是当前用户的需求（根据是否有 community_token）
const isOwner = computed(() => !!localStorage.getItem('community_token'))

const isDeadlineNear = computed(() => {
  if (!demand.value?.deadline) return false
  const diff = Math.ceil((new Date(demand.value.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  return diff > 0 && diff <= 7
})

const sponsorBlocks = computed(() => {
  if (!demand.value?.sponsor_types) return []
  const types = Array.isArray(demand.value.sponsor_types) ? demand.value.sponsor_types : demand.value.sponsor_types.split(',')
  return types.map(s => {
    const map = {
      '资金': { type: 'fund', icon: '💰', name: '资金赞助', desc: '' },
      '物资': { type: 'goods', icon: '📦', name: '物资赞助', desc: '' },
      '人力': { type: 'manpower', icon: '👥', name: '人力支持', desc: '' },
      '技术': { type: 'tech', icon: '💻', name: '技术支持', desc: '' },
      '服务': { type: 'service', icon: '🎯', name: '服务赞助', desc: '' }
    }
    return map[s.trim()] || { type: 'service', icon: '🎁', name: s, desc: '' }
  })
})

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 格式化日期时间（去掉小时前导零，如 "2026-05-15 9:00"）
function formatDateTime(time) {
  if (!time) return ''
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

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

async function shareDemand() {
  if (!demand.value) return
  const url = `${window.location.origin}/community/demands/${demand.value.id}`
  const text = `邻盟社区需求：${demand.value.title}`
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

onMounted(() => {
  loadDemand()
})
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 16px; }
.page-header { margin-bottom: 16px; }
.detail-layout { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
.main-content, .side-content { display: flex; flex-direction: column; gap: 12px; }
.demand-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.demand-header { margin-bottom: 6px; }
.demand-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.demand-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
.section { margin-top: 16px; }
.section h3 { font-size: 15px; font-weight: 700; color: #303133; margin-bottom: 12px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-item { display: flex; flex-direction: column; gap: 3px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 13px; color: #303133; }
.deadline { color: #F56C6C; font-weight: 500; }
.description { color: #606266; line-height: 1.6; font-size: 13px; }
.sponsor-blocks { display: flex; flex-direction: column; gap: 10px; }
.sponsor-block { border-radius: 8px; padding: 12px; }
.sponsor-block.fund { background: #fff5f5; border-left: 3px solid #F56C6C; }
.sponsor-block.goods { background: #fffbf0; border-left: 3px solid #E6A23C; }
.sponsor-block.manpower { background: #f0fff4; border-left: 3px solid #67C23A; }
.sblock-title { font-weight: 600; margin-bottom: 4px; font-size: 14px; }
.sblock-desc { font-size: 13px; color: #606266; line-height: 1.6; }
.intention-list { display: flex; flex-direction: column; gap: 10px; }
.intention-card { margin-bottom: 6px; }
.intention-header { display: flex; justify-content: space-between; align-items: center; }
.intention-actions { display: flex; gap: 8px; margin-top: 8px; }
.volunteer-info { background: #f0f9ff; border-radius: 8px; padding: 12px; border: 1px solid #dbeafe; }
.volunteer-card { display: flex; align-items: center; gap: 12px; }
.volunteer-score { font-size: 28px; font-weight: 800; color: #3B82F6; line-height: 1; }
.volunteer-score small { font-size: 13px; font-weight: 500; }
.volunteer-detail { font-size: 13px; color: #6B7280; }
.volunteer-desc { margin: 10px 0 0; font-size: 13px; color: #9CA3AF; }
.stat-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.stat-row:last-child { border-bottom: none; }
.stat-label { color: #909399; font-size: 12px; }
.stat-val { font-weight: 600; font-size: 13px; }
.side-content h4 { margin: 0 0 10px; font-size: 14px; font-weight: 600; }

@media (max-width: 768px) {
  .page { padding: 12px; }
  .page-header { margin-bottom: 12px; }
  .detail-layout { grid-template-columns: 1fr; gap: 12px; }
  .demand-card { padding: 14px; }
  .demand-title { font-size: 16px; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>
