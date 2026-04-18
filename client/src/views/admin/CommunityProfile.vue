<template>
  <div class="profile-page">
    <!-- 顶部：选择社区 -->
    <div class="page-header">
      <h2>🏘 社区画像</h2>
      <div class="selector-row">
        <!-- 区域三级联动 -->
        <el-select
          v-model="selectedDistrict"
          placeholder="选择区"
          clearable
          style="width:150px"
          :loading="regionLoading"
          @change="onDistrictChange"
        >
          <el-option
            v-for="d in districtList"
            :key="d.id"
            :label="d.name || d.region_name"
            :value="d.id"
          />
        </el-select>
        <el-select
          v-model="selectedStreet"
          placeholder="选择街道"
          clearable
          :disabled="!selectedDistrict"
          style="width:180px"
          :loading="regionLoading"
          @change="onStreetChange"
        >
          <el-option
            v-for="s in filteredStreets"
            :key="s.id"
            :label="s.name"
            :value="s.id"
          />
        </el-select>
        <el-select
          v-model="selectedCommunity"
          placeholder="选择社区"
          clearable
          :disabled="!selectedStreet"
          style="width:200px"
          :loading="regionLoading"
        >
          <el-option
            v-for="c in filteredCommunities"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
        </el-select>
        <el-divider direction="vertical" />
        <!-- 关键词搜索社区 -->
        <el-select
          v-model="selectedId"
          filterable
          placeholder="搜索社区..."
          style="width:260px"
          :loading="regionLoading"
          clearable
          @change="loadProfile"
        >
          <el-option
            v-for="c in communityList"
            :key="c.id"
            :label="c.communityName || c.realName || c.name"
            :value="c.id"
          />
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
        <!-- 账号信息 -->
        <div class="ci-baseinfo">
          <span>🔑 账号：{{ profile.community.username || '—' }}</span>
          <span v-if="profile.community.realName">👤 {{ profile.community.realName }}</span>
          <span v-if="profile.community.position">职位：{{ profile.community.position }}</span>
          <span v-if="profile.community.phone">📞 {{ profile.community.phone }}</span>
        </div>
        <!-- 联系地址 -->
        <div class="ci-baseinfo">
          <span v-if="profile.community.address">📍 {{ profile.community.address }}</span>
          <span v-if="profile.community.lat && profile.community.lng">📍 经纬度：{{ profile.community.lat }}, {{ profile.community.lng }}</span>
        </div>
        <!-- 社区画像数据 -->
        <div class="ci-stats">
          <span>🏠 户数：{{ profile.community.households || 0 }}</span>
          <span>👨‍👩‍👧 家庭{{ profile.community.familyRatio || 0 }}%</span>
          <span>👴 老年{{ profile.community.elderlyRatio || 0 }}%</span>
          <span>🏢 商户：{{ profile.community.merchantCount || 0 }}家</span>
          <span>📐 公共空间：{{ profile.community.publicSpaceArea || 0 }}㎡</span>
        </div>
        <!-- 配套设施 -->
        <div class="ci-facilities">
          <span class="facility-tag" :class="{ active: profile.community.hasOutdoorPlaza }">🏟️ 户外广场</span>
          <span class="facility-tag" :class="{ active: profile.community.hasCommercial }">🏪 商业配套</span>
          <span class="facility-tag" :class="{ active: profile.community.hasSchool }">🏫 学校</span>
          <span class="facility-tag" :class="{ active: profile.community.hasPark }">🏞️ 公园</span>
        </div>
        <!-- 社区标签 -->
        <div v-if="profile.community.tags && profile.community.tags.length > 0" class="ci-tags">
          <span style="font-size:12px;color:#909399;margin-right:4px;">标签：</span>
          <el-tag v-for="tag in profile.community.tags" :key="tag" size="small" type="info" style="margin:2px">
            {{ tag }}
          </el-tag>
        </div>
        <!-- 社区简介 -->
        <div v-if="profile.community.description" class="ci-desc">
          简介：{{ profile.community.description }}
        </div>
        <!-- 证明材料图片 -->
        <div v-if="profile.community.proofImages && profile.community.proofImages.length > 0" style="margin-top:8px;">
          <span style="font-size:12px;color:#909399;">证明材料：</span>
          <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">
            <img v-for="(img,idx) in profile.community.proofImages" :key="idx" 
                 :src="img" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />
          </div>
        </div>
        <!-- 状态信息 -->
        <div class="ci-meta" style="margin-top:8px;">
          <el-tag :type="profile.community.status === 1 ? 'success' : profile.community.status === 2 ? 'danger' : 'warning'" size="small">
            {{ profile.community.status === 0 ? '待审核' : profile.community.status === 1 ? '已激活' : '已拒绝' }}
          </el-tag>
          <span v-if="profile.community.rejectReason" style="color:#F56C6C;">拒绝原因：{{ profile.community.rejectReason }}</span>
        </div>
        <!-- 社区图片 -->
        <div v-if="profile.community.images && profile.community.images.length > 0" style="margin-top:8px;">
          <span style="font-size:12px;color:#909399;">社区图片：</span>
          <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">
            <img v-for="(img,idx) in profile.community.images" :key="idx" 
                 :src="img" style="width:80px;height:80px;object-fit:cover;border-radius:4px;" />
          </div>
        </div>
        <!-- 时间信息 -->
        <div class="ci-meta">
          <span>🕐 创建：{{ formatDate(profile.community.createdAt) }}</span>
          <span>🔄 更新：{{ formatDate(profile.community.updatedAt) }}</span>
          <span v-if="profile.community.lastLoginAt">🧑 最后登录：{{ formatDate(profile.community.lastLoginAt) }}</span>
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

    <!-- 小区和场地信息 -->
    <div v-if="profile" class="info-sections">
      <!-- 小区列表 -->
      <el-card v-if="profile.compounds && profile.compounds.length > 0" class="section-card">
        <template #header>
          <span>🏠 所辖小区</span>
        </template>
        <el-table :data="profile.compounds" size="small" border>
          <el-table-column prop="name" label="小区名称" />
          <el-table-column prop="households" label="户数" width="100" />
        </el-table>
      </el-card>

      <!-- 场地空间 -->
      <el-card v-if="profile.spaces && profile.spaces.length > 0" class="section-card">
        <template #header>
          <span>🏟️ 场地空间</span>
        </template>
        <div class="spaces-grid">
          <div v-for="space in profile.spaces" :key="space.id" class="space-item">
            <div class="space-header">{{ space.name }}</div>
            <div class="space-info">
              <div class="space-row">
                <span class="label">类型：</span>
                <el-tag size="small" :type="space.location_type === 0 ? 'primary' : 'success'">
                  {{ space.location_type === 0 ? '室内' : '室外' }}
                </el-tag>
                <span v-if="space.location_type === 0 && space.floor_number">{{ space.floor_number }}层</span>
              </div>
              <div v-if="space.area" class="space-row">
                <span class="label">面积：</span>{{ space.area }}㎡
              </div>
              <div v-if="space.capacity" class="space-row">
                <span class="label">容纳：</span>{{ space.capacity }}人
              </div>
              <div v-if="space.facilities && space.facilities.length > 0" class="space-row">
                <span class="label">设施：</span>
                <el-tag v-for="f in space.facilities" :key="f" size="small" style="margin:2px">{{ f }}</el-tag>
              </div>
              <div v-if="space.available_hours" class="space-row">
                <span class="label">可用：</span>{{ space.available_hours }}
              </div>
            </div>
            <div v-if="space.images && space.images.length > 0" class="space-images">
              <el-image
                v-for="(img, idx) in space.images"
                :key="idx"
                :src="img"
                style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 8px;"
                :preview-src-list="space.images"
                fit="cover"
              />
            </div>
          </div>
        </div>
      </el-card>
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
import { ref, computed, onMounted, watch } from 'vue'
import { getCommunityProfile, getCommunityScores } from '@/api/admin'
import { getRegions } from '@/api/admin'

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

// 区域筛选
const regionLoading = ref(false)
const allRegions = ref([])
const selectedDistrict = ref(null)
const selectedStreet = ref(null)
const selectedCommunity = ref(null)

// 区列表
const districtList = computed(() => {
  // 找出顶级地区
  const topLevel = allRegions.value.filter(r => !r.parent_id || r.parent_id === 0 || r.parent_id === '0')
  // 如果顶级只有一个且是"武汉市"，直接显示它的子级（区）
  if (topLevel.length === 1 && (topLevel[0].name === '武汉市' || topLevel[0].region_name === '武汉市')) {
    return allRegions.value.filter(r => r.parent_id === topLevel[0].id)
  }
  return topLevel
})

// 根据选择的区获取街道列表
const filteredStreets = computed(() => {
  if (!selectedDistrict.value) return []
  const district = allRegions.value.find(r => r.id === selectedDistrict.value)
  if (!district) return []
  return allRegions.value
    .filter(r => r.parent_id === district.id)
    .map(r => ({ id: r.id, name: r.name || r.region_name }))
})

// 根据选择的街道获取社区列表（从 regions 表）
const filteredCommunities = computed(() => {
  if (!selectedStreet.value) return []
  
  // 从 regions 表获取 level=4 的社区数据
  return allRegions.value
    .filter(r => r.level === 4 && r.parent_id === selectedStreet.value)
    .map(r => ({ id: r.id, name: r.name || r.region_name, source: 'region' }))
})

// 区变化时清除街道和社区
function onDistrictChange() {
  selectedStreet.value = null
  selectedCommunity.value = null
}

// 街道变化时清除社区
function onStreetChange() {
  selectedCommunity.value = null
}

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

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

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
  loadDistricts()
})

// 加载行政区数据
async function loadDistricts() {
  regionLoading.value = true
  try {
    const res = await getRegions()
    allRegions.value = res.data || []
  } catch {
    allRegions.value = []
  } finally {
    regionLoading.value = false
  }
}

// 监听社区变化 - 根据数据源选择不同处理方式
watch(selectedCommunity, (newVal) => {
  if (!newVal) {
    selectedId.value = null
    profile.value = null
    return
  }
  
  const community = filteredCommunities.value.find(c => c.id === newVal)
  if (!community) {
    selectedId.value = null
    profile.value = null
    return
  }
  
  // 如果来自 communities 表（有真实 id），直接加载
  if (community.source === 'db') {
    selectedId.value = community.id
    loadProfile(community.id)
    return
  }
  
  // 如果来自 regions 表，需要匹配 communities 表中的同名社区
  const street = allRegions.value.find(r => r.id === selectedStreet.value)
  const streetName = street?.name || ''
  const streetNameShort = streetName.replace(/街道$/, '').replace(/镇$/, '')

  // 在 communities 表中找同名社区（communityName字段 + 同街道）
  const match = communityList.value.find(c =>
    (c.communityName === community.name || c.realName === community.name) &&
    (c.street === streetName || c.street === streetNameShort || (streetNameShort && c.street?.includes(streetNameShort)))
  )
  
  if (match) {
    selectedId.value = match.id
    loadProfile(match.id)
  } else {
    console.warn('该行政社区尚未在平台注册，无详细信息')
    selectedId.value = null
    profile.value = null
  }
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

/* 小区和场地信息区块 */
.info-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}
.section-card { }
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.space-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}
.space-header {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}
.space-info { font-size: 13px; color: #606266; }
.space-row {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.space-row .label { color: #909399; min-width: 50px; }
.space-images {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

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
.ci-tags { margin-top: 8px; }
.ci-desc { margin-top: 6px; font-size: 13px; color: #606266; line-height: 1.4; }
.ci-baseinfo { margin-top: 4px; font-size: 13px; color: #606266; }
.ci-baseinfo span { margin-right: 16px; }
.ci-stats { margin-top: 6px; font-size: 13px; color: #409EFF; display: flex; flex-wrap: wrap; gap: 8px; }
.ci-stats span { background: #f0f9ff; padding: 2px 8px; border-radius: 4px; }
.ci-facilities { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }
.facility-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f5f5f5; color: #999; }
.facility-tag.active { background: #e6f7e6; color: #67C23A; }
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
