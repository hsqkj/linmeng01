<template>
  <div class="mp-page">
    <!-- PC 端筛选区（仅 PC 显示） -->
    <div class="mp-pc-container" style="display:none">
      <div class="mp-search-bar">
        <div class="mp-pc-search">
          <input
            v-model="filters.keyword"
            class="mp-pc-search-input"
            placeholder="搜索资源 / 商家名称"
            @keyup.enter="doSearch"
          />
          <button class="mp-pc-search-btn" @click="doSearch">🔍 搜索</button>
        </div>
      </div>
      <div class="mp-pc-filters">
        <div class="mp-filter-group">
          <span class="mp-filter-label">排序：</span>
          <select v-model="filters.matchOrder" class="mp-select" @change="doSearch">
            <option value="match">匹配度</option>
            <option value="newest">最新</option>
            <option value="rating">评价最高</option>
            <option value="level">等级优先</option>
          </select>
        </div>
        <div class="mp-filter-group">
          <span class="mp-filter-label">等级：</span>
          <select v-model="filters.rating" class="mp-select" @change="doSearch">
            <option value="">不限</option>
            <option value="5">五星商家</option>
            <option value="4">四星+</option>
            <option value="3">三星+</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 小程序导航栏 -->
    <div class="mp-nav">
      <div class="mp-nav-inner">
        <span class="mp-nav-title">资源广场</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="mp-search-bar">
      <div class="mp-search-input-wrap">
        <span class="mp-search-icon">🔍</span>
        <input
          v-model="filters.keyword"
          class="mp-search-input"
          placeholder="搜索资源 / 商家名称"
          @keyup.enter="doSearch"
        />
        <span v-if="filters.keyword" class="mp-search-clear" @click="filters.keyword = ''; doSearch()">✕</span>
      </div>
      <button class="mp-search-btn" @click="doSearch">搜索</button>
    </div>

    <!-- 分类标签（横向滚动） -->
    <div class="mp-tabs-scroll">
      <div
        class="mp-tab"
        :class="{ active: filters.type === '' }"
        @click="selectType('')"
      >全部</div>
      <div
        v-for="(t, idx) in resourceTypes"
        :key="idx"
        class="mp-tab"
        :class="{ active: filters.type === idx.toString() }"
        :style="filters.type === idx.toString() ? { color: getResourceTypeColor(idx), borderColor: getResourceTypeColor(idx) } : {}"
        @click="selectType(idx.toString())"
      >{{ t }}</div>
    </div>

    <!-- 快捷筛选行 -->
    <div class="mp-quick-filters">
      <div class="mp-filter-group">
        <span class="mp-filter-label">排序：</span>
        <select v-model="filters.matchOrder" class="mp-select" @change="doSearch">
          <option value="match">匹配度</option>
          <option value="newest">最新</option>
          <option value="rating">评价最高</option>
          <option value="level">等级优先</option>
        </select>
      </div>
      <div class="mp-filter-group">
        <span class="mp-filter-label">等级：</span>
        <select v-model="filters.rating" class="mp-select" @change="doSearch">
          <option value="">不限</option>
          <option value="5">五星商家</option>
          <option value="4">四星+</option>
          <option value="3">三星+</option>
        </select>
      </div>
    </div>

    <!-- 结果统计 -->
    <div class="mp-result-info" v-if="!loading">
      <span v-if="total > 0">共找到 <strong>{{ total }}</strong> 个资源</span>
      <span v-else>暂无资源</span>
    </div>

    <!-- 骨架屏 / 加载状态 -->
    <div v-if="loading" class="mp-skeleton-list">
      <div v-for="n in 4" :key="n" class="mp-skeleton-card">
        <div class="mp-skeleton-left">
          <div class="mp-skeleton-logo"></div>
        </div>
        <div class="mp-skeleton-right">
          <div class="mp-skeleton-line w60"></div>
          <div class="mp-skeleton-line w80"></div>
          <div class="mp-skeleton-line w40"></div>
        </div>
      </div>
    </div>

    <!-- 资源列表 -->
    <div v-else class="mp-list">
      <div
        v-for="resource in resources"
        :key="resource.id"
        class="mp-card"
        @click="viewDetail(resource)"
      >
        <!-- 左侧 Logo -->
        <div class="mp-card-left">
          <img
            v-if="resource.merchant_logo"
            :src="resource.merchant_logo"
            class="mp-merchant-logo"
            @error="(e) => e.target.style.display='none'"
          />
          <div v-else class="mp-merchant-logo-default">🏪</div>
        </div>

        <!-- 右侧内容 -->
        <div class="mp-card-right">
          <!-- 第一行：类型标签 + 匹配度 -->
          <div class="mp-card-row1">
            <span class="mp-type-badge" :style="{ background: getResourceTypeColor(resource.resource_type) }">
              {{ getResourceTypeName(resource.resource_type) }}
            </span>
            <span class="mp-match-hearts">
              <span v-for="n in 5" :key="n" class="mp-heart" :class="{ filled: n <= (resource.matchHearts || 0) }">♥</span>
            </span>
          </div>

          <!-- 第二行：资源标题 -->
          <div class="mp-card-title">{{ resource.title }}</div>

          <!-- 第三行：商家名 + 星级 -->
          <div class="mp-card-merchant">
            <span class="mp-merchant-name">{{ resource.company_name }}</span>
            <span class="mp-star">⭐ {{ resource.star_rating || 0 }}</span>
            <span class="mp-member-badge" :type="memberLevelType[resource.member_level]">
              {{ memberLevelName[resource.member_level] || '普通' }}
            </span>
          </div>

          <!-- 第四行：内容摘要 -->
          <div class="mp-card-desc">{{ resource.content }}</div>

          <!-- 第五行：标签 + 操作 -->
          <div class="mp-card-row5">
            <div class="mp-card-tags">
              <span
                v-for="tag in (Array.isArray(resource.tags) ? resource.tags : (resource.tags || '').split(',')).filter(t => t).slice(0, 3)"
                :key="tag"
                class="mp-tag"
              >{{ tag }}</span>
            </div>
            <div class="mp-card-actions">
              <span class="mp-action-btn" @click.stop="handleFavorite(resource)">
                <span :style="{ color: favoritedIds.has(resource.id) ? '#07C160' : '#ccc' }">♥</span>
              </span>
              <span class="mp-action-btn" @click.stop="viewDetail(resource)">
                <span style="color:#07C160">→</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="resources.length === 0" class="mp-empty">
        <div class="mp-empty-icon">📦</div>
        <div class="mp-empty-text">暂无匹配的资源</div>
        <button class="mp-empty-btn" @click="resetFilters">重置筛选</button>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="mp-pagination">
      <button class="mp-page-btn" :disabled="currentPage <= 1" @click="onPageChange(currentPage - 1)">上一页</button>
      <span class="mp-page-info">{{ currentPage }} / {{ Math.ceil(total / pageSize) }}</span>
      <button class="mp-page-btn" :disabled="currentPage >= Math.ceil(total / pageSize)" @click="onPageChange(currentPage + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth } from '@/utils/useAuth'
import { Briefcase, OfficeBuilding, Present, Medal, Wallet, FirstAidKit, Tickets, Camera, Tools, HomeFilled, Goods } from '@element-plus/icons-vue'
import { getResources, toggleFavorite, getMyFavorites, getConfig } from '@/api/community'

const router = useRouter()
const loading = ref(false)
const favoritedIds = ref(new Set())

const filters = reactive({ keyword: '', type: '', rating: '', distance: '', matchOrder: 'match' })
const resourceTypes = ref([])
const resourceTypeMap = ref({})

const resourceTypeIcons = {
  0: Briefcase, 1: OfficeBuilding, 2: HomeFilled, 3: Present,
  4: Medal, 5: Wallet, 6: Tools, 7: FirstAidKit,
  8: Tickets, 9: Camera, 10: Goods, 11: HomeFilled,
}

const resourceTypeColors = {
  0: '#409EFF', 1: '#E6A23C', 2: '#67C23A', 3: '#F56C6C',
  4: '#9C27B0', 5: '#FFD700', 6: '#00BCD4', 7: '#E91E63',
  8: '#FF9800', 9: '#795548', 10: '#607D8B', 11: '#8BC34A',
}

const getResourceTypeColor = (typeIdx) => {
  const idx = parseInt(typeIdx)
  return resourceTypeColors[idx] || '#409EFF'
}

function selectType(typeIdx) {
  filters.type = typeIdx
  doSearch()
}

const memberLevelName = ref({})
const memberLevelType = { 0: 'info', 1: 'info', 2: '', 3: 'warning', 4: 'danger', 5: 'danger' }

const getResourceTypeName = (type) => {
  if (typeof type === 'string' && resourceTypeMap.value[type] !== undefined) {
    return resourceTypeMap.value[type]
  }
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeMap.value[num] !== undefined) {
    return resourceTypeMap.value[num]
  }
  if (typeof type === 'string') return type
  return type || '其他'
}

async function loadConfig() {
  try {
    const res = await getConfig()
    if (res.data?.resourceTypes?.length) {
      resourceTypes.value = res.data.resourceTypes
      const map = {}
      res.data.resourceTypes.forEach((t, idx) => { map[idx] = t; map[t] = t })
      resourceTypeMap.value = map
    }
    if (res.data?.member_levels?.length) {
      const map = {}
      res.data.member_levels.forEach(item => { map[item.level] = item.name })
      memberLevelName.value = map
    }
  } catch {}
}

const resources = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

async function fetchResources() {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize, sort: filters.matchOrder || 'match' }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.type) params.type = filters.type
    if (filters.rating) params.level = filters.rating
    const res = await getResources(params)
    resources.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || resources.value.length
  } catch {
    resources.value = []
  } finally {
    loading.value = false
  }
}

function viewDetail(res) { router.push(`/community/resources/${res.id}`) }
function doSearch() { currentPage.value = 1; fetchResources() }
function resetFilters() {
  filters.keyword = ''; filters.type = ''; filters.rating = ''; filters.matchOrder = 'match'
  doSearch()
}
function onPageChange(page) { currentPage.value = page; fetchResources(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

async function loadFavorites() {
  try {
    const res = await getMyFavorites()
    const list = res.data?.list || res.data || []
    favoritedIds.value = new Set(list.map(i => i.resource_id || i.id))
  } catch {}
}

async function handleFavorite(res) {
  if (!localStorage.getItem('community_token')) return requireAuth('community')
  try {
    await toggleFavorite({ resource_id: res.id })
    if (favoritedIds.value.has(res.id)) {
      favoritedIds.value.delete(res.id)
      ElMessage.success('已取消收藏')
    } else {
      favoritedIds.value.add(res.id)
      ElMessage.success('已收藏')
    }
    favoritedIds.value = new Set(favoritedIds.value)
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => { loadConfig(); fetchResources(); loadFavorites() })
</script>

<style scoped>

/* ===== 基础样式（移动端默认，PC覆盖）===== */
.mp-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
}
.mp-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #07C160;
}
.mp-nav-inner {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mp-nav-title {
  color: white;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
}
.mp-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: white;
}
.mp-search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 18px;
  padding: 0 14px;
  height: 36px;
}
.mp-search-icon { font-size: 14px; color: #999; margin-right: 6px; }
.mp-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
}
.mp-search-input::placeholder { color: #bbb; }
.mp-search-clear { font-size: 12px; color: #ccc; cursor: pointer; }
.mp-search-btn {
  background: #07C160;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 0 16px;
  height: 34px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}
.mp-tabs-scroll {
  display: flex;
  overflow-x: auto;
  padding: 10px 14px;
  gap: 8px;
  background: white;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.mp-tabs-scroll::-webkit-scrollbar { display: none; }
.mp-tab {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: 14px;
  font-size: 13px;
  color: #666;
  background: #f0f0f0;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.mp-tab.active {
  color: #07C160;
  border-color: #07C160;
  background: #e8f8f0;
  font-weight: 600;
}
.mp-quick-filters {
  display: flex;
  gap: 12px;
  padding: 8px 14px;
  background: white;
}
.mp-filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mp-filter-label { font-size: 12px; color: #999; }
.mp-select {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 12px;
  color: #555;
  background: white;
  outline: none;
}
.mp-result-info { padding: 8px 14px; font-size: 12px; color: #999; background: #f9f9f9; }
.mp-result-info strong { color: #07C160; }
.mp-skeleton-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; }
.mp-skeleton-card { background: white; border-radius: 12px; padding: 12px; display: flex; gap: 10px; animation: mp-pulse 1.5s infinite; }
.mp-skeleton-left { flex-shrink: 0; }
.mp-skeleton-logo { width: 44px; height: 44px; border-radius: 8px; background: #eee; }
.mp-skeleton-right { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.mp-skeleton-line { height: 10px; border-radius: 5px; background: #eee; }
.w40 { width: 40%; } .w60 { width: 60%; } .w80 { width: 80%; }
@keyframes mp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.mp-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; }
.mp-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.mp-card-left { flex-shrink: 0; }
.mp-merchant-logo { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #f5f5f5; }
.mp-merchant-logo-default { width: 44px; height: 44px; border-radius: 8px; background: #e8f8f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.mp-card-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.mp-card-row1 { display: flex; align-items: center; justify-content: space-between; }
.mp-type-badge { font-size: 10px; color: white; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.mp-match-hearts { display: flex; gap: 1px; }
.mp-heart { font-size: 11px; color: #ddd; }
.mp-heart.filled { color: #f56c6c; }
.mp-card-title { font-size: 14px; font-weight: 600; color: #333; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-card-merchant { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mp-merchant-name { font-size: 12px; color: #409EFF; }
.mp-star { font-size: 11px; color: #f5a623; }
.mp-member-badge { font-size: 10px; background: #f0f0f0; color: #666; padding: 1px 5px; border-radius: 4px; }
.mp-card-desc { font-size: 12px; color: #888; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-card-row5 { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.mp-card-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.mp-tag { font-size: 10px; color: #555; background: #f5f5f5; padding: 1px 6px; border-radius: 4px; }
.mp-card-actions { display: flex; gap: 8px; }
.mp-action-btn { font-size: 14px; cursor: pointer; padding: 2px 4px; }
.mp-empty { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 10px; }
.mp-empty-icon { font-size: 48px; }
.mp-empty-text { font-size: 14px; color: #999; }
.mp-empty-btn { background: #07C160; color: white; border: none; border-radius: 16px; padding: 8px 24px; font-size: 13px; cursor: pointer; }
.mp-pagination { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 14px; }
.mp-page-btn { background: #07C160; color: white; border: none; border-radius: 16px; padding: 7px 18px; font-size: 13px; cursor: pointer; }
.mp-page-btn:disabled { background: #ccc; cursor: not-allowed; }
.mp-page-info { font-size: 13px; color: #666; }

/* ===== PC 端样式（≥769px）===== */
@media (min-width: 769px) {
  .mp-page {
    min-height: 100vh;
    background: #f0f2f5;
    padding: 0 0 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  }

  /* 显示 PC 元素，隐藏移动端元素 */
  .mp-pc-container { display: block !important; }
  .mp-pc-filters { display: flex !important; }
  .mp-nav { display: none !important; }
  .mp-quick-filters { display: none !important; }

  /* PC 页面容器 */
  .mp-pc-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* 搜索区域 */
  .mp-search-bar {
    display: flex !important;
    align-items: center;
    gap: 12px;
    padding: 20px 0 0;
    background: white;
    border-radius: 8px;
    margin-top: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .mp-pc-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px;
  }
  .mp-pc-search-input {
    flex: 1;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 14px;
    outline: none;
    max-width: 400px;
  }
  .mp-pc-search-input:focus { border-color: #07C160; }
  .mp-pc-search-btn {
    background: #07C160;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 20px;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
  }
  .mp-pc-search-btn:hover { background: #06a554; }

  /* PC 筛选区域 */
  .mp-pc-filters {
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    padding: 12px 20px 16px;
    background: white;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .mp-filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mp-filter-label { font-size: 14px; color: #666; font-weight: 500; }
  .mp-select {
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    color: #555;
    background: white;
    outline: none;
    cursor: pointer;
  }
  .mp-select:hover { border-color: #07C160; }

  /* 分类标签 */
  .mp-tabs-scroll {
    display: flex !important;
    flex-wrap: wrap;
    padding: 16px 20px;
    gap: 8px;
    background: white;
    border-radius: 8px;
    margin-top: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .mp-tab {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 13px;
    color: #555;
    background: #f5f5f5;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .mp-tab:hover { border-color: #07C160; color: #07C160; }
  .mp-tab.active {
    color: #07C160;
    border-color: #07C160;
    background: #e8f8f0;
    font-weight: 600;
  }

  /* 结果统计 */
  .mp-result-info {
    display: block !important;
    padding: 12px 20px;
    font-size: 14px;
    color: #888;
    background: white;
    border-radius: 8px;
    margin-top: 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .mp-result-info strong { color: #07C160; }

  /* PC 资源卡片网格 */
  .mp-list {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 16px 0;
  }
  .mp-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    gap: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    border: 1px solid transparent;
  }
  .mp-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    border-color: #07C160;
  }

  .mp-card-left { flex-shrink: 0; }
  .mp-merchant-logo {
    width: 64px; height: 64px;
    border-radius: 8px;
    object-fit: cover;
    background: #f5f5f5;
  }
  .mp-merchant-logo-default {
    width: 64px; height: 64px;
    border-radius: 8px;
    background: #e8f8f0;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
  }

  .mp-card-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }

  .mp-card-row1 { display: flex; align-items: center; justify-content: space-between; }
  .mp-type-badge {
    font-size: 12px; color: white;
    padding: 2px 8px; border-radius: 4px;
    font-weight: 600;
  }
  .mp-match-hearts { display: flex; gap: 2px; }
  .mp-heart { font-size: 13px; color: #ddd; }
  .mp-heart.filled { color: #f56c6c; }

  .mp-card-title {
    font-size: 15px; font-weight: 600; color: #222;
    line-height: 1.4;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .mp-card-merchant {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .mp-merchant-name { font-size: 13px; color: #409EFF; font-weight: 500; }
  .mp-star { font-size: 12px; color: #f5a623; }
  .mp-member-badge {
    font-size: 11px;
    background: #f0f0f0;
    color: #666;
    padding: 1px 6px; border-radius: 4px;
  }

  .mp-card-desc {
    font-size: 13px; color: #888; line-height: 1.5;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .mp-card-row5 { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
  .mp-card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .mp-tag {
    font-size: 11px; color: #555;
    background: #f5f5f5;
    padding: 2px 8px; border-radius: 4px;
  }
  .mp-card-actions { display: flex; gap: 10px; }
  .mp-action-btn { font-size: 16px; cursor: pointer; padding: 4px 6px; }

  /* 空状态 */
  .mp-empty {
    display: flex !important;
    flex-direction: column; align-items: center;
    padding: 60px 20px; gap: 12px;
    background: white;
    border-radius: 8px;
  }
  .mp-empty-icon { font-size: 56px; }
  .mp-empty-text { font-size: 15px; color: #999; }
  .mp-empty-btn {
    background: #07C160; color: white;
    border: none; border-radius: 6px;
    padding: 10px 28px; font-size: 14px;
    cursor: pointer;
  }
  .mp-empty-btn:hover { background: #06a554; }

  /* 分页 */
  .mp-pagination {
    display: flex !important;
    align-items: center; justify-content: center;
    gap: 16px; padding: 20px;
    background: white;
    border-radius: 8px;
    margin-top: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .mp-page-btn {
    background: #07C160; color: white;
    border: none; border-radius: 6px;
    padding: 8px 20px; font-size: 14px;
    cursor: pointer;
  }
  .mp-page-btn:disabled { background: #ccc; cursor: not-allowed; }
  .mp-page-info { font-size: 14px; color: #666; }

  /* 骨架屏 */
  .mp-skeleton-list {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 16px 0;
  }
  .mp-skeleton-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    gap: 14px;
    animation: mp-pulse 1.5s infinite;
  }
  .mp-skeleton-left { flex-shrink: 0; }
  .mp-skeleton-logo { width: 64px; height: 64px; border-radius: 8px; background: #eee; }
  .mp-skeleton-right { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
  .mp-skeleton-line { height: 12px; border-radius: 6px; background: #eee; }
  .w40 { width: 40%; } .w60 { width: 60%; } .w80 { width: 80%; }
  @keyframes mp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
}

/* ===== 移动端样式（≤768px）===== */
@media (max-width: 768px) {
  .mp-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 70px;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  }

  /* 导航栏 */
  .mp-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #07C160;
    padding: env(safe-area-inset-top) 0 0;
  }
  .mp-nav-inner {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mp-nav-title {
    color: white;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* 搜索栏 */
  .mp-search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: white;
    border-bottom: 1px solid #eee;
  }
  .mp-search-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    background: #f0f0f0;
    border-radius: 18px;
    padding: 0 14px;
    height: 36px;
  }
  .mp-search-icon { font-size: 14px; color: #999; margin-right: 6px; }
  .mp-search-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #333;
  }
  .mp-search-input::placeholder { color: #bbb; }
  .mp-search-clear { font-size: 12px; color: #ccc; cursor: pointer; }
  .mp-search-btn {
    background: #07C160;
    color: white;
    border: none;
    border-radius: 16px;
    padding: 0 16px;
    height: 34px;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
  }

  /* 横向滚动标签 */
  .mp-tabs-scroll {
    display: flex;
    overflow-x: auto;
    padding: 10px 14px;
    gap: 8px;
    background: white;
    border-bottom: 1px solid #eee;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .mp-tabs-scroll::-webkit-scrollbar { display: none; }
  .mp-tab {
    flex-shrink: 0;
    padding: 5px 14px;
    border-radius: 14px;
    font-size: 13px;
    color: #666;
    background: #f0f0f0;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .mp-tab.active {
    color: #07C160;
    border-color: #07C160;
    background: #e8f8f0;
    font-weight: 600;
  }

  /* 快捷筛选 */
  .mp-quick-filters {
    display: flex;
    gap: 12px;
    padding: 8px 14px;
    background: white;
    border-bottom: 1px solid #eee;
  }
  .mp-filter-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mp-filter-label { font-size: 12px; color: #999; }
  .mp-select {
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 3px 10px;
    font-size: 12px;
    color: #555;
    background: white;
    outline: none;
  }

  /* 结果统计 */
  .mp-result-info {
    padding: 8px 14px;
    font-size: 12px;
    color: #999;
    background: #f9f9f9;
  }
  .mp-result-info strong { color: #07C160; }

  /* 骨架屏 */
  .mp-skeleton-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; }
  .mp-skeleton-card {
    background: white;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    gap: 10px;
    animation: mp-pulse 1.5s infinite;
  }
  .mp-skeleton-left { flex-shrink: 0; }
  .mp-skeleton-logo { width: 44px; height: 44px; border-radius: 8px; background: #eee; }
  .mp-skeleton-right { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
  .mp-skeleton-line { height: 10px; border-radius: 5px; background: #eee; }
  .w40 { width: 40%; } .w60 { width: 60%; } .w80 { width: 80%; }
  @keyframes mp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  /* 资源卡片 */
  .mp-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; }
  .mp-card {
    background: white;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    gap: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .mp-card:active { transform: scale(0.98); box-shadow: 0 0 0 rgba(0,0,0,0.06); }

  .mp-card-left { flex-shrink: 0; }
  .mp-merchant-logo {
    width: 44px; height: 44px;
    border-radius: 8px;
    object-fit: cover;
    background: #f5f5f5;
  }
  .mp-merchant-logo-default {
    width: 44px; height: 44px;
    border-radius: 8px;
    background: #e8f8f0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }

  .mp-card-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }

  .mp-card-row1 { display: flex; align-items: center; justify-content: space-between; }
  .mp-type-badge {
    font-size: 10px; color: white;
    padding: 1px 6px; border-radius: 4px;
    font-weight: 600;
  }
  .mp-match-hearts { display: flex; gap: 1px; }
  .mp-heart { font-size: 11px; color: #ddd; }
  .mp-heart.filled { color: #f56c6c; }

  .mp-card-title {
    font-size: 14px; font-weight: 600; color: #333;
    line-height: 1.4;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .mp-card-merchant {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  }
  .mp-merchant-name { font-size: 12px; color: #409EFF; }
  .mp-star { font-size: 11px; color: #f5a623; }
  .mp-member-badge {
    font-size: 10px;
    background: #f0f0f0;
    color: #666;
    padding: 1px 5px; border-radius: 4px;
  }

  .mp-card-desc {
    font-size: 12px; color: #888; line-height: 1.4;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .mp-card-row5 { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
  .mp-card-tags { display: flex; gap: 4px; flex-wrap: wrap; }
  .mp-tag {
    font-size: 10px; color: #555;
    background: #f5f5f5;
    padding: 1px 6px; border-radius: 4px;
  }
  .mp-card-actions { display: flex; gap: 8px; }
  .mp-action-btn {
    font-size: 14px; cursor: pointer; padding: 2px 4px;
  }

  /* 空状态 */
  .mp-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 40px 20px; gap: 10px;
  }
  .mp-empty-icon { font-size: 48px; }
  .mp-empty-text { font-size: 14px; color: #999; }
  .mp-empty-btn {
    background: #07C160; color: white;
    border: none; border-radius: 16px;
    padding: 8px 24px; font-size: 13px;
    cursor: pointer;
  }

  /* 分页 */
  .mp-pagination {
    display: flex; align-items: center; justify-content: center;
    gap: 14px; padding: 14px;
  }
  .mp-page-btn {
    background: #07C160; color: white;
    border: none; border-radius: 16px;
    padding: 7px 18px; font-size: 13px;
    cursor: pointer;
  }
  .mp-page-btn:disabled { background: #ccc; cursor: not-allowed; }
  .mp-page-info { font-size: 13px; color: #666; }
}
</style>
