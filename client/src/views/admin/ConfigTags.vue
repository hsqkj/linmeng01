<template>
  <div class="page"><h2>标签管理</h2>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="社区标签" name="community">
        <div class="tag-actions">
          <el-button type="primary" @click="openAdd('community')"><el-icon><Plus /></el-icon> 新增标签</el-button>
        </div>
        <div class="tag-grid" v-loading="loading">
          <div class="tag-item" v-for="tag in communityTags" :key="tag.id">
            <el-tag
              closable
              @close="deleteTag(tag)"
              :disable-transitions="false"
              type="primary"
              size="large"
            >
              {{ tag.name }}
            </el-tag>
          </div>
          <div v-if="communityTags.length === 0 && !loading" style="color:#909399;padding:20px">暂无标签，点击上方按钮添加</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="商家标签" name="merchant">
        <div class="tag-actions">
          <el-button type="primary" @click="openAdd('merchant')"><el-icon><Plus /></el-icon> 新增标签</el-button>
        </div>
        <div class="tag-grid" v-loading="loading">
          <div class="tag-item" v-for="tag in merchantTags" :key="tag.id">
            <el-tag
              closable
              @close="deleteTag(tag)"
              :disable-transitions="false"
              type="success"
              size="large"
            >
              {{ tag.name }}
            </el-tag>
          </div>
          <div v-if="merchantTags.length === 0 && !loading" style="color:#909399;padding:20px">暂无标签，点击上方按钮添加</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="待审核自定义标签" name="custom">
        <div class="tag-actions">
          <span style="color:#909399;font-size:13px">用户提交的自定义标签申请</span>
        </div>
        <el-table :data="customTags" stripe border v-loading="loading">
          <el-table-column prop="name" label="标签名称" min-width="150" />
          <el-table-column prop="category" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'community' ? 'primary' : 'success'" size="small">
                {{ row.type === 'community' ? '社区标签' : '商家标签' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="申请时间" width="160">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button text type="success" size="small" @click="approveTag(row)">通过</el-button>
              <el-button text type="danger" size="small" @click="rejectTag(row)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && customTags.length === 0" description="暂无待审核标签" :image-size="60" />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAddTag" :title="'新增' + (addType === 'community' ? '社区标签' : '商家标签')" width="350px">
      <el-form label-position="top">
        <el-form-item :label="addType === 'community' ? '社区标签名称' : '商家标签名称'" required>
          <el-input v-model="newTag" placeholder="输入标签名称" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTag=false">取消</el-button>
        <el-button type="primary" @click="confirmAddTag">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getTags, createTag, updateTag, deleteTag as deleteTagApi } from '@/api/admin'

const activeTab = ref('community')
const showAddTag = ref(false)
const newTag = ref('')
const addType = ref('community')
const loading = ref(false)

const communityTags = ref([])
const merchantTags = ref([])
const customTags = ref([])

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadTags() {
  loading.value = true
  try {
    const [cRes, mRes, xRes] = await Promise.allSettled([
      getTags({ type: 'community' }),
      getTags({ type: 'merchant' }),
      getTags({ type: 'custom' })
    ])
    communityTags.value = cRes.status === 'fulfilled' ? (cRes.value.data || []) : []
    merchantTags.value = mRes.status === 'fulfilled' ? (mRes.value.data || []) : []
    customTags.value = xRes.status === 'fulfilled' ? (xRes.value.data || []) : []
  } catch {
    communityTags.value = []
    merchantTags.value = []
    customTags.value = []
  } finally {
    loading.value = false
  }
}

function onTabChange(tab) {
  // Data is preloaded, no additional load needed
}

function openAdd(type) {
  addType.value = type
  newTag.value = ''
  showAddTag.value = true
}

async function confirmAddTag() {
  if (!newTag.value.trim()) { ElMessage.warning('请输入标签名称'); return }
  try {
    await createTag({ name: newTag.value.trim(), type: addType.value })
    ElMessage.success('标签已添加')
    showAddTag.value = false
    loadTags()
  } catch {
    ElMessage.error('添加失败，请重试')
  }
}

async function deleteTag(tag) {
  try {
    await ElMessageBox.confirm(`确认删除标签"${tag.name}"？`, '删除确认', { type: 'warning' })
    await deleteTagApi(tag.id)
    ElMessage.success('已删除')
    loadTags()
  } catch {
    // 用户取消
  }
}

async function approveTag(tag) {
  try {
    await ElMessageBox.confirm(`确认通过标签"${tag.name}"？`, '审核确认', { type: 'success' })
    await updateTag(tag.id, { status: 1 })
    ElMessage.success('标签已通过')
    loadTags()
  } catch {
    // 用户取消
  }
}

async function rejectTag(tag) {
  try {
    await ElMessageBox.confirm(`确认拒绝标签"${tag.name}"？`, '审核确认', { type: 'warning' })
    await deleteTagApi(tag.id)
    ElMessage.success('已拒绝')
    loadTags()
  } catch {
    // 用户取消
  }
}

// Initial load
loadTags()
</script>
<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.tag-actions { margin-bottom: 16px; }
.tag-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.tag-item { display: flex; align-items: center; }
</style>
