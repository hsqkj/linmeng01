<template>
  <div class="profile-page">
    <!-- 顶部：选择社区 -->
    <div class="page-header">
      <h2>🏘 社区画像</h2>
      <div class="selector-row">
        <el-select
          v-model="selectedId"
          filterable
          placeholder="搜索/选择社区..."
          style="width:320px"
          @change="loadProfile"
          v-loading="loading"
        >
          <el-option
            v-for="c in communityList"
            :key="c.id"
            :label="`${c.realName || c.real_name} - ${c.communityName || c.community_name}`"
            :value="c.id"
          >
            <span>{{ c.realName || c.real_name }}</span>
            <span style="color:#999;font-size:12px;margin-left:8px">
              {{ c.communityName || c.community_name }}
            </span>
            <span v-if="c.overall" style="color:#E6A23C;font-size:12px;margin-left:8px">
              综合{{ c.overall }}分
            </span>
          </el-option>
        </el-select>
      </div>
    </div>

    <!-- 社区信息卡片 -->
    <div v-if="profile" class="info-card">
      <div class="community-avatar">
        <img v-if="profile.community.logo" :src="profile.community.logo" />
        <div v-else class="avatar-placeholder">
          {{ (profile.community.name || '社')[0] }}
        </div>
      </div>
      <div class="community-info">
        <div class="ci-name">{{ profile.community.name }}</div>
        <div class="ci-meta">
          <el-tag size="small">{{ profile.community.communityName || '—' }}</el-tag>
          <span>{{ profile.community.district || '' }} {{ profile.community.street || '' }}</span>
        </div>
      </div>
      <div class="overall-score">
        <div class="score-num" :style="{ color: overallColor }">{{ profile.overall }}</div>
        <div class="score-label">综合评分</div>
        <el-progress
          :percentage="profile.overall"
          :color="overallColor"
          :show-text="false"
          style="width:100px"
        />
      </div>
    </div>

    <!-- 主体：雷达图 + 维度详情 -->
    <div v-if="profile" class="content-grid">
      <!-- 左侧：雷达图 -->
      <el-card class="radar-card">
        <template #header>
          <span>📡 多维能力雷达图</span>
        </template>
        <div class="radar-wrap">
          <!-- SVG 雷达图 -->
          <svg :width="svgSize" :height="svgSize" :viewBox="`0 0 ${svgSize} ${svgSize}`">
            <defs>
              <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#409EFF" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#67C23A" stop-opacity="0.25" />
              </linearGradient>
            </defs>
            <!-- 背景网格（5圈） -->
            <g v-for="level in 5" :key="`grid-${level}`">
              <polygon
                :points="getGridPolygon(level * 20)"
                fill="none"
                stroke="#E4E7ED"
                stroke-width="1"
              />
            </g>
            <!-- 轴线 -->
            <line
              v-for="(dim, i) in profile.dims"
              :key="`axis-${i}`"
              :x1="cx" :y1="cy"
              :x2="axisPoints[i].x"
              :y2="axisPoints[i].y"
              stroke="#DCDFE6"
              stroke-width="1"
            />
            <!-- 数据多边形 -->
            <polygon
              :points="dataPolygon"
              fill="url(#radarFill)"
              stroke="#409EFF"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <!-- 数据点 -->
            <circle
              v-for="(dp, i) in dataPoints"
              :key="`dp-${i}`"
              :cx="dp.x" :cy="dp.y" r="4"
              fill="#409EFF"
              stroke="#fff"
              stroke-width="2"
            />
            <!-- 轴标签 -->
            <text
              v-for="(dim, i) in profile.dims"
              :key="`label-${i}`"
              :x="labelPoints[i].x"
              :y="labelPoints[i].y"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="12"
              font-weight="600"
              :fill="getScoreColor(profile.scores[dim.key])"
            >
              {{ profile.scores[dim.key] }}
            </text>
          </svg>

          <!-- 图例 -->
          <div class="radar-legend">
            <div
              v-for="dim in profile.dims"
              :key="dim.key"
              class="legend-item"
            >
              <span class="legend-icon">{{ dim.icon }}</span>
              <span class="legend-label">{{ dim.label }}</span>
              <span class="legend-score" :style="{ color: getScoreColor(profile.scores[dim.key]) }">
                {{ profile.scores[dim.key] }}
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 右侧：维度详情卡片 -->
      <el-card class="dims-card">
        <template #header>
          <span>📋 指标解读</span>
        </template>
        <div class="dims-grid">
          <div
            v-for="dim in profile.dims"
            :key="dim.key"
            class="dim-item"
            :class="`dim-${getLevel(profile.scores[dim.key])}`"
          >
            <div class="dim-header">
              <span class="dim-icon">{{ dim.icon }}</span>
              <span class="dim-name">{{ dim.label }}</span>
              <span class="dim-score" :style="{ color: getScoreColor(profile.scores[dim.key]) }">
                {{ profile.scores[dim.key] }}
              </span>
              <el-tag size="small" :type="levelTag(getLevel(profile.scores[dim.key]))">
                {{ levelLabel(getLevel(profile.scores[dim.key])) }}
              </el-tag>
            </div>
            <div class="dim-bar-wrap">
              <el-progress
                :percentage="profile.scores[dim.key]"
                :color="getScoreColor(profile.scores[dim.key])"
                :show-text="false"
                :stroke-width="8"
              />
            </div>
            <div class="dim-desc">{{ dim.desc }}</div>
            <div class="dim-raw">
              <span v-if="dim.key === 'scale'">户数：{{ profile.raw.households }} 户</span>
              <span v-else-if="dim.key === 'family'">
                亲子{{ profile.raw.familyRatio }}% + 老年{{ profile.raw.elderlyRatio }}%
              </span>
              <span v-else-if="dim.key === 'facility'">
                {{ profile.raw.facilityCount }}/4 项设施
              </span>
              <span v-else-if="dim.key === 'space'">
                公共空间 {{ profile.raw.publicSpaceArea.toFixed(1) }} m²
              </span>
              <span v-else-if="dim.key === 'activity'">
                发布{{ profile.raw.totalDemands }}条，预算¥{{ (profile.raw.totalBudget / 10000).toFixed(1) }}万
              </span>
              <span v-else-if="dim.key === 'matching'">
                成功撮合{{ profile.raw.successMatches }}次
              </span>
              <span v-else-if="dim.key === 'merchant'">
                商户 {{ profile.raw.merchantCount }} 家
              </span>
              <span v-else-if="dim.key === 'exposure'">
                总浏览{{ profile.raw.totalViews }}次
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!profile && !loading" description="请从上方选择社区，查看其画像">
      <template #image>
        <div style="font-size:64px">🏘️</div>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCommunityProfile, getCommunityScores } from '@/api/admin'

// ============ 常量 ============
const svgSize = 400
const cx = svgSize / 2
const cy = svgSize / 2
const maxR = 130   // 最大半径
const labelR = 185 // 标签半径

// 8个维度对应的角度（从顶部顺时针，SVG y轴向下）
// 角度：0°=顶，45°，90°，135°，180°=底，225°，270°，315°
function axisAngle(i) {
  return (i * 45 - 90) * (Math.PI / 180) // -90°让第一轴朝上
}

// 计算某维度第level圈（1-5）的多边形顶点
function calcPoints(level) {
  const r = maxR * (level / 5)
  return Array.from({ length: 8 }, (_, i) => {
    const a = axisAngle(i)
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
}

// ============ 状态 ============
const communityList = ref([])
const selectedId = ref(null)
const profile = ref(null)
const loading = ref(false)

// ============ 预计算坐标（用于轴线和标签）============
const axisPoints = computed(() => {
  return Array.from({ length: 8 }, (_, i) => {
    const a = axisAngle(i)
    return { x: cx + maxR * Math.cos(a), y: cy + maxR * Math.sin(a) }
  })
})

const labelPoints = computed(() => {
  return Array.from({ length: 8 }, (_, i) => {
    const a = axisAngle(i)
    return { x: cx + labelR * Math.cos(a), y: cy + labelR * Math.sin(a) }
  })
})

// 数据多边形顶点
const dataPolygon = computed(() => {
  if (!profile.value) return ''
  return Array.from({ length: 8 }, (_, i) => {
    const dim = profile.value.dims[i]
    const score = profile.value.scores[dim.key] / 100
    const a = axisAngle(i)
    return `${cx + maxR * score * Math.cos(a)},${cy + maxR * score * Math.sin(a)}`
  }).join(' ')
})

// 数据点坐标（用于圆点）
const dataPoints = computed(() => {
  if (!profile.value) return []
  return Array.from({ length: 8 }, (_, i) => {
    const dim = profile.value.dims[i]
    const score = profile.value.scores[dim.key] / 100
    const a = axisAngle(i)
    return { x: cx + maxR * score * Math.cos(a), y: cy + maxR * score * Math.sin(a) }
  })
})

// ============ 方法 ============
function getGridPolygon(level) {
  const r = maxR * (level / 100)
  return Array.from({ length: 8 }, (_, i) => {
    const a = axisAngle(i)
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
}

function getLevel(score) {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

function levelLabel(level) {
  return { high: '优秀', mid: '一般', low: '薄弱' }[level] || '薄弱'
}

function levelTag(level) {
  return { high: 'success', mid: 'warning', low: 'danger' }[level] || 'info'
}

function getScoreColor(score) {
  if (score >= 80) return '#67C23A'
  if (score >= 50) return '#E6A23C'
  return '#F56C6C'
}

const overallColor = computed(() => {
  if (!profile.value) return '#999'
  return getScoreColor(profile.value.overall)
})

async function loadProfile(id) {
  if (!id) { profile.value = null; return }
  loading.value = true
  try {
    const res = await getCommunityProfile(id)
    profile.value = res.data
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

async function loadCommunityList() {
  try {
    const res = await getCommunityScores()
    communityList.value = res.data || []
    // 如果有数据，默认选中第一个
    if (communityList.value.length > 0) {
      selectedId.value = communityList.value[0].id
      loadProfile(selectedId.value)
    }
  } catch {
    communityList.value = []
  }
}

onMounted(() => {
  loadCommunityList()
})
</script>

<style scoped>
.profile-page { max-width: 1200px; margin: 0 auto; }

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.page-header h2 { margin: 0; font-size: 20px; }
.selector-row { display: flex; gap: 10px; align-items: center; }

/* 社区信息卡 */
.info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #EBEEF5;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.community-avatar img,
.avatar-placeholder {
  width: 60px; height: 60px;
  border-radius: 50%;
  object-fit: cover;
  background: #409EFF;
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-placeholder { background: linear-gradient(135deg, #409EFF, #67C23A); }
.community-info { flex: 1; }
.ci-name { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.ci-meta { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #606266; }
.overall-score { text-align: center; }
.score-num { font-size: 40px; font-weight: 800; line-height: 1; }
.score-label { font-size: 12px; color: #999; margin: 4px 0 6px; }

/* 主体 */
.content-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
}

/* 雷达图 */
.radar-card { }
.radar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.radar-wrap svg {
  overflow: visible;
}
.radar-legend {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 10px;
  background: #F5F7FA;
  border-radius: 6px;
}
.legend-icon { font-size: 14px; }
.legend-label { flex: 1; color: #606266; }
.legend-score { font-weight: 700; }

/* 维度卡片 */
.dims-grid { display: flex; flex-direction: column; gap: 16px; }
.dim-item {
  padding: 14px 16px;
  border-radius: 8px;
  border-left: 4px solid #DCDFE6;
  background: #FAFBFC;
}
.dim-item.dim-high { border-left-color: #67C23A; background: #F0F9EB; }
.dim-item.dim-mid  { border-left-color: #E6A23C; background: #FDF6EC; }
.dim-item.dim-low  { border-left-color: #F56C6C; background: #FEF0F0; }
.dim-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.dim-icon { font-size: 16px; }
.dim-name { font-weight: 600; font-size: 14px; flex: 1; }
.dim-score { font-size: 20px; font-weight: 800; }
.dim-bar-wrap { margin-bottom: 6px; }
.dim-desc { font-size: 12px; color: #909399; margin-bottom: 4px; }
.dim-raw { font-size: 12px; color: #606266; font-weight: 500; }

/* 响应式 */
@media (max-width: 900px) {
  .content-grid { grid-template-columns: 1fr; }
  .radar-legend { grid-template-columns: 1fr 1fr; }
  .radar-wrap svg { width: 300px !important; height: 300px !important; }
}
</style>
