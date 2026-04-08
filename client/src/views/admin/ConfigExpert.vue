<template>
  <div class="config-page">
    <h2>专家类型管理</h2>
    <p class="sub-tip">管理专家注册时可选择的专家类型，启用后在前端注册页面展示</p>

    <el-card v-loading="loading">
      <div class="toolbar">
        <el-button type="primary" @click="addType">
          <el-icon><Plus /></el-icon> 添加类型
        </el-button>
        <el-button @click="resetDefault" plain>恢复默认</el-button>
      </div>

      <el-table :data="types" stripe border>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column prop="name" label="专家类型名称" min-width="200">
          <template #default="{ row }">
            <el-input v-if="row._editing" v-model="row.name" size="small" />
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="saveChanges" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row, $index }">
            <template v-if="row._editing">
              <el-button type="success" size="small" @click="confirmEdit(row, $index)">保存</el-button>
              <el-button size="small" @click="cancelEdit(row, $index)">取消</el-button>
            </template>
            <template v-else>
              <el-button text type="primary" size="small" @click="startEdit(row)">编辑</el-button>
              <el-button text type="primary" size="small" @click="moveUp($index)" :disabled="$index === 0">上移</el-button>
              <el-button text type="danger" size="small" @click="deleteType($index)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="save-footer">
        <el-button type="success" size="large" @click="saveAll" :loading="saving">
          保存所有修改
        </el-button>
        <span class="save-tip" v-if="hasChanges">有未保存的修改</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getExpertTypes, saveExpertTypes } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const hasChanges = ref(false)
const types = ref([])
const originalTypes = ref([])

const defaultTypes = [
  { name: '法律咨询', status: 1, sort_order: 1 },
  { name: '医疗健康', status: 1, sort_order: 2 },
  { name: '心理辅导', status: 1, sort_order: 3 },
  { name: '教育培训', status: 1, sort_order: 4 },
  { name: '技能培训', status: 1, sort_order: 5 },
  { name: '金融理财', status: 1, sort_order: 6 },
  { name: '社会工作', status: 1, sort_order: 7 },
  { name: '文艺指导', status: 1, sort_order: 8 },
  { name: '体育健身', status: 1, sort_order: 9 },
  { name: '营养指导', status: 1, sort_order: 10 },
  { name: 'IT技术', status: 1, sort_order: 11 },
  { name: '财务税务', status: 1, sort_order: 12 },
  { name: '人力资源', status: 1, sort_order: 13 },
  { name: '亲子教育', status: 1, sort_order: 14 },
  { name: '老年服务', status: 1, sort_order: 15 },
  { name: '志愿服务', status: 1, sort_order: 16 },
  { name: '环保公益', status: 1, sort_order: 17 },
  { name: '社区建设', status: 1, sort_order: 18 },
  { name: '婚姻家庭', status: 1, sort_order: 19 },
  { name: '职业规划', status: 1, sort_order: 20 },
  { name: '创业指导', status: 1, sort_order: 21 },
  { name: '中医养生', status: 1, sort_order: 22 },
  { name: '瑜伽冥想', status: 1, sort_order: 23 },
  { name: '宠物护理', status: 1, sort_order: 24 },
  { name: '家居装修', status: 1, sort_order: 25 },
  { name: '汽车维修', status: 1, sort_order: 26 },
  { name: '摄影摄像', status: 1, sort_order: 27 },
  { name: '美妆造型', status: 1, sort_order: 28 },
  { name: '烹饪烘焙', status: 1, sort_order: 29 },
  { name: '其他', status: 1, sort_order: 99 }
]

async function loadTypes() {
  loading.value = true
  try {
    const res = await getExpertTypes()
    types.value = res.data || []
    originalTypes.value = JSON.parse(JSON.stringify(types.value))
    hasChanges.value = false
  } catch {
    ElMessage.error('加载专家类型失败')
  } finally {
    loading.value = false
  }
}

function addType() {
  const maxSort = types.value.reduce((max, t) => Math.max(max, t.sort_order || 0), 0)
  types.value.push({
    name: '',
    status: 1,
    sort_order: maxSort + 1,
    _editing: true,
    _isNew: true
  })
  hasChanges.value = true
}

function startEdit(row) {
  row._editing = true
  row._originalName = row.name
}

function confirmEdit(row, index) {
  if (!row.name || !row.name.trim()) {
    ElMessage.warning('类型名称不能为空')
    return
  }
  row.name = row.name.trim()
  delete row._editing
  delete row._originalName
  delete row._isNew
  hasChanges.value = true
}

function cancelEdit(row, index) {
  if (row._isNew) {
    types.value.splice(index, 1)
  } else {
    row.name = row._originalName
    delete row._editing
    delete row._originalName
  }
}

function moveUp(index) {
  if (index <= 0) return
  const temp = types.value[index]
  types.value[index] = types.value[index - 1]
  types.value[index - 1] = temp
  // 更新排序号
  types.value.forEach((t, i) => { t.sort_order = i + 1 })
  hasChanges.value = true
}

async function deleteType(index) {
  try {
    await ElMessageBox.confirm(`确定删除专家类型「${types.value[index].name}」？`, '确认删除', { type: 'warning' })
    types.value.splice(index, 1)
    types.value.forEach((t, i) => { t.sort_order = i + 1 })
    hasChanges.value = true
  } catch {}
}

async function saveAll() {
  // 清理编辑状态
  types.value = types.value.filter(t => {
    if (t._isNew && (!t.name || !t.name.trim())) return false
    return true
  }).map(t => {
    const clean = { ...t }
    delete clean._editing
    delete clean._originalName
    delete clean._isNew
    return clean
  })

  saving.value = true
  try {
    await saveExpertTypes(types.value)
    originalTypes.value = JSON.parse(JSON.stringify(types.value))
    hasChanges.value = false
    ElMessage.success('专家类型配置已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function resetDefault() {
  try {
    await ElMessageBox.confirm('确定恢复默认专家类型？这将覆盖当前配置。', '确认恢复', { type: 'warning' })
    types.value = JSON.parse(JSON.stringify(defaultTypes))
    // 自动保存到数据库
    await saveAll()
  } catch {}
}

onMounted(() => {
  loadTypes()
})
</script>

<style scoped>
.config-page { max-width: 800px; margin: 0 auto; }
.config-page h2 { margin-bottom: 8px; font-size: 22px; font-weight: 700; }
.sub-tip { color: #909399; font-size: 14px; margin-bottom: 20px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.save-footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid #ebeef5; display: flex; align-items: center; gap: 12px; }
.save-tip { color: #E6A23C; font-size: 13px; }

@media (max-width: 768px) {
  .config-page { padding: 12px; padding-bottom: 70px; }
  .config-page h2 { font-size: 18px; }
  .toolbar { flex-direction: column; gap: 8px; }
  .save-footer { flex-direction: column; align-items: stretch; }
  :deep(.el-table) { font-size: 12px; }
  :deep(.el-table__header th) { padding: 8px 4px; }
  :deep(.el-table__body td) { padding: 8px 4px; }
}
</style>
