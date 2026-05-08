<template>
  <div class="favorites-page">
    <h2>我的收藏</h2>
    <div class="favorites-list" v-loading="loading">
      <el-empty v-if="!loading && favorites.length === 0" description="暂无收藏资源" :image-size="80" />
      <el-card v-for="item in favorites" :key="item.id" shadow="hover" class="fav-card" @click="viewResource(item)">
        <div class="fav-header">
          <el-avatar :size="48" :src="item.merchant_logo" @error="() => true">
            <el-icon :size="20"><Shop /></el-icon>
          </el-avatar>
          <div class="fav-info">
            <div class="fav-title">{{ item.resource_title || item.title }}</div>
            <div class="fav-meta">
              <el-tag size="small" type="info">{{ getResourceTypeName(item.resource_type) }}</el-tag>
              <span class="fav-merchant">{{ item.company_name }}</span>
            </div>
          </div>
          <el-icon class="fav-star active" @click.stop="toggleFav(item)"><Star /></el-icon>
        </div>
        <p class="fav-desc">{{ item.resource_content || item.content }}</p>
        <div class="fav-footer">
          <el-button text size="small" @click.stop="viewResource(item)">查看详情</el-button>
        </div>
      </el-card>
    </div>
    <div class="pagination" v-if="total > pageSize">
      <el-pagination layout="prev,pager,next,total" :total="total" :page-size="pageSize" :current-page="page" @current-change="loadFavorites" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Shop, Star } from '@element-plus/icons-vue'
import { getMyFavorites } from '@/api/community'

const router = useRouter()
const loading = ref(true)
const favorites = ref([])
const page = ref(1)
const pageSize = 20
const total = ref(0)

// 资源类型映射（从API动态加载）
const resourceTypeNumMap = ref({})
const getResourceTypeName = (type) => {
  if (typeof type === 'string' && resourceTypeNumMap.value[type] !== undefined) {
    return resourceTypeNumMap.value[type]
  }
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeNumMap.value[num] !== undefined) {
    return resourceTypeNumMap.value[num]
  }
  if (typeof type === 'string') {
    return type
  }
  return type || '其他'
}

// 加载资源类型配置
async function loadResourceTypes() {
  try {
    const { getPublishTypes } = await import('@/api/community')
    const res = await getPublishTypes()
    if (res.data?.resource_types?.length) {
      const map = {}
      res.data.resource_types.forEach((item, idx) => {
        const name = (typeof item === 'object' && item !== null) ? item.name : item
        const id = (typeof item === 'object' && item !== null) ? item.id : idx
        map[id] = name
        map[name] = name
      })
      resourceTypeNumMap.value = map
    }
  } catch {}
}

async function loadFavorites() {
  loading.value = true
  try {
    const res = await getMyFavorites({ page: page.value, pageSize })
    favorites.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || favorites.value.length
  } catch {
    favorites.value = []
  } finally {
    loading.value = false
  }
}

function viewResource(item) {
  const id = item.resource_id || item.id
  router.push(`/community/resources/${id}`)
}

function toggleFav(item) {
  // Cancel favorite
}

onMounted(() => {
  loadFavorites()
  loadResourceTypes()
})
</script>

<style scoped>

/* ===== 基础样式（移动端默认，PC覆盖）===== */
.favorites-page { background: #f5f5f5; }

/* ===== PC 端样式（≥769px）===== */
@media (min-width: 769px) {
  .favorites-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px 20px 40px;
    min-height: 100vh;
    background: #f0f2f5;
  }
  .favorites-page h2 {
    margin-bottom: 20px;
    font-size: 22px;
    font-weight: 700;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .favorites-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .fav-card {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .fav-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .fav-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
    padding: 16px 16px 0;
  }
  .fav-info { flex: 1; min-width: 0; }
  .fav-title {
    font-weight: 600;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fav-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
  .fav-merchant { font-size: 14px; color: #409EFF; }
  .fav-star { font-size: 22px; color: #f56c6c; cursor: pointer; }
  .fav-desc {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
    padding: 0 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }
  .fav-footer {
    padding: 10px 16px 14px;
    border-top: 1px solid #f0f0f0;
  }
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    background: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
}

/* ===== 移动端样式（≤768px）===== */
@media (max-width: 768px) {
  .favorites-page { padding-bottom: 70px; background: #f5f5f5; }
  .favorites-page h2 {
    font-size: 18px;
    margin-bottom: 14px;
    padding: 12px 14px;
    background: white;
    border-radius: 0;
    border-bottom: 1px solid #eee;
  }
  .favorites-list {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px 14px;
  }
  .fav-card {
    cursor: pointer;
    transition: transform 0.15s;
    background: white;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .fav-card:active { transform: scale(0.98); }
  .fav-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 12px; }
  .fav-info { flex: 1; min-width: 0; }
  .fav-title {
    font-weight: 600;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fav-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
  .fav-merchant { font-size: 12px; color: #409EFF; }
  .fav-star { font-size: 18px; color: #f56c6c; cursor: pointer; }
  .fav-desc {
    font-size: 12px;
    color: #606266;
    margin-bottom: 8px;
    padding: 0 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }
  .fav-footer {
    padding: 8px 12px 12px;
    border-top: 1px solid #f0f0f0;
  }
  .pagination {
    justify-content: center;
    padding: 14px;
    margin-top: 0;
  }
}
</style>
