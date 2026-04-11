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
      res.data.resource_types.forEach((name, idx) => {
        map[idx] = name
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
.favorites-page { max-width: 1000px; margin: 0 auto; }
.favorites-page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.favorites-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.fav-card { cursor: pointer; transition: transform 0.2s; }
.fav-card:hover { transform: translateY(-2px); }
.fav-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.fav-info { flex: 1; min-width: 0; }
.fav-title { font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.fav-merchant { font-size: 13px; color: #409EFF; }
.fav-star { font-size: 20px; color: #f56c6c; cursor: pointer; }
.fav-desc { font-size: 13px; color: #606266; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.fav-footer { padding-top: 8px; border-top: 1px solid #f0f0f0; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .favorites-page h2 { font-size: 18px; margin-bottom: 14px; }
  .favorites-list { grid-template-columns: 1fr; gap: 12px; }
  .favorites-page { padding-bottom: 70px; }
}
</style>
