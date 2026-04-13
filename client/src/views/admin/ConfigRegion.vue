<template>
  <div class="config-region" v-loading="loading">
    <h2>行政区划配置</h2>
    <div class="config-section">
      <div class="section-header">
        <p class="section-desc">管理省市区街道社区等行政区划数据，用于社区注册和用户筛选</p>
        <el-button type="primary" @click="openAddDialog"><el-icon><Plus /></el-icon> 添加区域</el-button>
      </div>

      <!-- 层级选择器 -->
      <div class="region-selector">
        <el-select v-model="selectedLevel" placeholder="选择级别" style="width:120px" @change="onLevelChange">
          <el-option label="省/市" :value="1" />
          <el-option label="区/县" :value="2" />
          <el-option label="街道" :value="3" />
          <el-option label="社区" :value="4" />
        </el-select>
        
        <el-select v-if="selectedLevel >= 2" v-model="selectedParent" placeholder="选择上级区域" style="width:180px" clearable @change="loadRegions">
          <el-option v-for="p in parentOptions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        
        <el-input v-model="searchKeyword" placeholder="搜索区域名称" style="width:200px" clearable @input="filterRegions">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        
        <span class="region-count">共 {{ filteredRegions.length }} 条</span>
      </div>

      <!-- 区域列表 -->
      <el-table :data="filteredRegions" stripe border>
        <el-table-column type="index" width="60" label="序号" />
        <el-table-column prop="name" label="区域名称" min-width="200">
          <template #default="{ row }">
            <span :class="['region-name', 'level-' + row.level]">
              {{ row.name }}
              <el-tag v-if="row.level === 1" size="small" type="success">市</el-tag>
              <el-tag v-else-if="row.level === 2" size="small" type="primary">区</el-tag>
              <el-tag v-else-if="row.level === 3" size="small" type="warning">街道</el-tag>
              <el-tag v-else size="small" type="info">社区</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template #default="{ row }">
            {{ levelNameMap[row.level] }}
          </template>
        </el-table-column>
        <el-table-column prop="parent_name" label="上级区域" width="150">
          <template #default="{ row }">
            {{ row.parent_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="子区域" width="100" align="center">
          <template #default="{ row }">
            <span v-if="childCountMap[row.id]" class="child-count">
              {{ childCountMap[row.id] }} 个子区域
            </span>
            <span v-else class="no-child">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editRegion(row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteRegion(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="showDialog" :title="editingRegion ? '编辑区域' : '添加区域'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="区域级别" required>
          <el-select v-model="form.level" placeholder="选择级别" style="width:100%" :disabled="!!editingRegion">
            <el-option label="省/市" :value="1" />
            <el-option label="区/县" :value="2" />
            <el-option label="街道" :value="3" />
            <el-option label="社区" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.level >= 2" label="上级区域" required>
          <el-select v-model="form.parent_id" placeholder="选择上级区域" style="width:100%">
            <el-option v-for="p in parentOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域名称" required>
          <el-input v-model="form.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRegion" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getRegions, createRegion, updateRegion, deleteRegion } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingRegion = ref(null)

const regions = ref([])
const filteredRegions = ref([])
const searchKeyword = ref('')
const selectedLevel = ref(2)
const selectedParent = ref(null)
const parentOptions = ref([])
const childCountMap = ref({})

const levelNameMap = { 1: '市', 2: '区/县', 3: '街道', 4: '社区' }

const form = ref({
  name: '',
  level: 2,
  parent_id: null,
  sort_order: 0
})

// 加载上级区域选项
async function loadParentOptions(level) {
  if (level <= 1) {
    parentOptions.value = []
    return
  }
  try {
    const res = await getRegions({ level: level - 1 })
    parentOptions.value = res.data || []
  } catch {
    parentOptions.value = []
  }
}

// 加载区域数据
async function loadRegions() {
  loading.value = true
  try {
    const params = { level: selectedLevel.value }
    if (selectedParent.value) {
      params.parent_id = selectedParent.value
    }
    const res = await getRegions(params)
    regions.value = res.data || []
    
    // 构建父级名称映射
    const allParents = {}
    // 获取所有上级区域
    for (let l = 1; l < selectedLevel.value; l++) {
      const parentRes = await getRegions({ level: l })
      ;(parentRes.data || []).forEach(r => {
        allParents[r.id] = r.name
      })
    }
    // 添加parent_name
    regions.value = regions.value.map(r => ({
      ...r,
      parent_name: allParents[r.parent_id] || ''
    }))
    
    // 加载子区域数量
    await loadChildCounts()
    
    filterRegions()
  } catch {
    regions.value = []
  } finally {
    loading.value = false
  }
}

// 加载子区域数量
async function loadChildCounts() {
  childCountMap.value = {}
  for (const region of regions.value) {
    try {
      const res = await getRegions({ parent_id: region.id })
      const children = res.data || []
      if (children.length > 0) {
        childCountMap.value[region.id] = children.length
      }
    } catch {}
  }
}

function filterRegions() {
  if (!searchKeyword.value) {
    filteredRegions.value = regions.value
  } else {
    const kw = searchKeyword.value.toLowerCase()
    filteredRegions.value = regions.value.filter(r => 
      r.name.toLowerCase().includes(kw)
    )
  }
}

function onLevelChange() {
  selectedParent.value = null
  loadParentOptions(selectedLevel.value)
  loadRegions()
}

function openAddDialog() {
  editingRegion.value = null
  form.value = {
    name: '',
    level: selectedLevel.value,
    parent_id: selectedParent.value,
    sort_order: 0
  }
  loadParentOptions(form.value.level)
  showDialog.value = true
}

function editRegion(row) {
  editingRegion.value = row
  form.value = {
    name: row.name,
    level: row.level,
    parent_id: row.parent_id,
    sort_order: row.sort_order
  }
  loadParentOptions(form.value.level)
  showDialog.value = true
}

async function saveRegion() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入区域名称')
    return
  }
  if (form.value.level >= 2 && !form.value.parent_id) {
    ElMessage.warning('请选择上级区域')
    return
  }
  
  saving.value = true
  try {
    const data = {
      name: form.value.name,
      level: form.value.level,
      parent_id: form.value.level === 1 ? 0 : form.value.parent_id,
      sort_order: form.value.sort_order
    }
    
    if (editingRegion.value) {
      await updateRegion(editingRegion.value.id, data)
      ElMessage.success('区域已更新')
    } else {
      await createRegion(data)
      ElMessage.success('区域已添加')
    }
    showDialog.value = false
    loadRegions()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteRegion(row) {
  // 检查是否有子区域
  if (childCountMap.value[row.id]) {
    ElMessage.warning('该区域有子区域，请先删除子区域')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确认删除区域"${row.name}"？`, '删除确认', { type: 'warning' })
    await deleteRegion(row.id)
    ElMessage.success('已删除')
    loadRegions()
  } catch {}
}

onMounted(() => {
  loadParentOptions(selectedLevel.value)
  loadRegions()
})
</script>

<style scoped>
.config-region { max-width: 1200px; margin: 0 auto; }
.config-region h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.config-section { background: #fff; border-radius: 12px; padding: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-desc { color: #909399; font-size: 13px; margin: 0; }

.region-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.region-count {
  color: #909399;
  font-size: 13px;
  margin-left: auto;
}

.region-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.child-count {
  color: #409eff;
  font-size: 13px;
}

.no-child {
  color: #c0c4cc;
}

@media (max-width: 768px) {
  .config-region { padding: 12px; }
  .config-region h2 { font-size: 18px; }
  .section-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .region-selector { flex-direction: column; align-items: stretch; }
  .region-selector .el-select,
  .region-selector .el-input { width: 100% !important; }
  .region-count { margin-left: 0; }
}
</style>
