<template>
  <div class="config-basic" v-loading="loading">
    <h2>基础数据配置</h2>
    <el-tabs v-model="activeTab">
      <!-- 活动类型 -->
      <el-tab-pane label="活动类型" name="activity">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">活动类型用于社区发布需求时选择，影响智能匹配结果</p>
            <el-button type="primary" @click="openAdd('activityTypes','活动类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="activityTypes" stripe border>
            <el-table-column type="index" width="60" label="序号" />
            <el-table-column prop="name" label="类型名称" min-width="150">
              <template #default="{ row, $index }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false" @keyup.enter="row.editing=false" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="已关联需求" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(activityTypes.value, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 专家类型 -->
      <el-tab-pane label="专家类型" name="expert">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">专家类型用于专家服务类需求中选择</p>
            <el-button type="primary" @click="openAdd('expertTypes','专家类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="expertTypes" stripe border>
            <el-table-column type="index" width="60" />
            <el-table-column prop="name" label="专家类型" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="已关联需求" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(expertTypes.value, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 行业分类 -->
      <el-tab-pane label="行业分类" name="industry">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">行业分类用于商家注册时选择，影响智能匹配和筛选</p>
            <el-button type="primary" @click="openAdd('industryTypes','行业分类')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="industryTypes" stripe border>
            <el-table-column type="index" width="60" />
            <el-table-column prop="name" label="行业名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveTypes" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(industryTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 企业类型 -->
      <el-tab-pane label="企业类型" name="enterprise">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">企业类型用于商家注册时选择，影响智能匹配和筛选</p>
            <el-button type="primary" @click="openAdd('enterpriseTypes','企业类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="enterpriseTypes" stripe border>
            <el-table-column type="index" width="60" />
            <el-table-column prop="name" label="类型名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="已关联商家" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(enterpriseTypes.value, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 资源类型 -->
      <el-tab-pane label="资源类型" name="resource">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">资源类型用于商家发布资源时选择</p>
            <el-button type="primary" @click="openAdd('resourceTypes','资源类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="resourceTypes" stripe border>
            <el-table-column type="index" width="60" />
            <el-table-column prop="name" label="资源类型" min-width="120">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(resourceTypes.value, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 行政区划 -->
      <el-tab-pane label="行政区划" name="district">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">配置平台服务的城市/区/街道/社区四级行政区划数据</p>
            <el-button type="primary" @click="addDistrict(null, 0)"><el-icon><Plus /></el-icon> 新增城市</el-button>
          </div>
          <el-tree
            v-loading="districtLoading"
            :data="districtTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            default-expand-all
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon style="margin-right:4px;color:#909399"><Location /></el-icon>
                <span v-if="!data.editing">{{ node.label }}</span>
                <el-input v-else v-model="data.name" size="small" style="width:150px" @blur="saveDistrictEdit(data)" @keyup.enter="saveDistrictEdit(data)" />
                <span v-if="levelName(data, data.parent_id)" class="tree-level">[{{ levelName(data, data.parent_id) }}]</span>
                <span class="tree-actions">
                  <el-button text type="primary" size="small" @click.stop="data.editing=true">编辑</el-button>
                  <el-button v-if="data.level < 4" text type="success" size="small" @click.stop="addDistrict(data, data.level)">
                    {{ data.level === 1 ? '加区' : data.level === 2 ? '加街道' : data.level === 3 ? '加社区' : '加节点' }}
                  </el-button>
                  <el-button text type="danger" size="small" @click.stop="deleteDistrict(data, node)">删除</el-button>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增弹窗 -->
    <el-dialog v-model="showAddDialog" :title="'新增' + addDialogTitle" width="440px">
      <el-form label-position="top">
        <el-form-item :label="addDialogTitle + '名称'" required>
          <el-input v-model="newItemName" :placeholder="'请输入' + addDialogTitle + '名称'" />
        </el-form-item>
        <el-form-item label="说明（选填）">
          <el-input v-model="newItemDesc" type="textarea" :rows="2" placeholder="可选填写说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 新增行政区划弹窗 -->
    <el-dialog v-model="showDistrictDialog" :title="districtDialogTitle" width="400px">
      <el-form label-position="top">
        <el-form-item :label="districtLabel + '名称'" required>
          <el-input v-model="newDistrictName" :placeholder="'请输入' + districtLabel + '名称'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDistrictDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDistrict">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Location } from '@element-plus/icons-vue'
import { getRegions, createRegion, updateRegion, deleteRegion as deleteRegionApi, getBasicTypesConfig, saveBasicTypesConfig } from '@/api/admin'

const loading = ref(false)
const activeTab = ref('activity')
const showAddDialog = ref(false), addDialogTitle = ref(''), newItemName = ref(''), newItemDesc = ref(''), currentList = ref(null)
const showDistrictDialog = ref(false), districtDialogTitle = ref(''), districtLabel = ref(''), newDistrictName = ref('')
const districtParent = ref(null), districtLevel = ref(0)
const districtLoading = ref(false)
// 区(1)、街道(2)、社区(3)，城市级(parent_id=0)直接显示名称不加后缀
const levelName = (data, parentId) => {
  if (!parentId || parentId === 0) return ''  // 顶级城市不显示层级
  return { 2: '区', 3: '街道', 4: '社区' }[data.level] || ''
}

const activityTypes = ref([])
const enterpriseTypes = ref([])
const resourceTypes = ref([])
const expertTypes = ref([])
const industryTypes = ref([])
const districtTree = ref([])

async function loadBasicTypes() {
  loading.value = true
  try {
    const res = await getBasicTypesConfig()
    const data = res.data || {}

    const defaultActivityTypes = [
      { name: '社区文化活动', desc: '居民文艺演出、节庆活动等', count: 0, enabled: true },
      { name: '教育培训', desc: '公益课、讲座、培训等活动', count: 0, enabled: true },
      { name: '健康运动', desc: '健身、太极、广场舞等体育活动', count: 0, enabled: true },
      { name: '志愿服务', desc: '社区公益服务、义务劳动等', count: 0, enabled: true },
      { name: '便民服务', desc: '理发、缝补、维修等便民活动', count: 0, enabled: true },
      { name: '专家咨询', desc: '法律、心理、医疗等专业咨询', count: 0, enabled: true },
    ]
    const defaultEnterpriseTypes = [
      { name: '国有企业', count: 0, enabled: true },
      { name: '民营企业', count: 0, enabled: true },
      { name: '外资企业', count: 0, enabled: true },
      { name: '个体工商户', count: 0, enabled: true },
      { name: '社会企业', count: 0, enabled: true },
      { name: '非营利组织', count: 0, enabled: true },
    ]
    const defaultResourceTypes = [
      { name: '专业服务', desc: '咨询、法律、设计等专业服务', enabled: true },
      { name: '教育培训', desc: '课程、培训、讲座等服务', enabled: true },
      { name: '场地资源', desc: '活动室、运动场等场地支持', enabled: true },
      { name: '物资捐赠', desc: '图书、设备、食品等物资', enabled: true },
      { name: '志愿服务', desc: '人力支持、活动协助等', enabled: true },
    ]
    const defaultExpertTypes = [
      { name: '法律咨询', desc: '法律顾问、纠纷调解等服务', count: 0, enabled: true },
      { name: '心理健康', desc: '心理咨询、心理辅导等服务', count: 0, enabled: true },
      { name: '医疗健康', desc: '义诊、健康讲座等服务', count: 0, enabled: true },
      { name: '财务税务', desc: '财税顾问、代理记账等服务', count: 0, enabled: true },
      { name: '工程技术', desc: '水电维修、网络技术等服务', count: 0, enabled: true },
    ]
    const defaultIndustryTypes = [
      '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果',
      '美业', '保健养生', '体育健身', '银行保险', '电信服务',
      '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材',
      '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务',
      '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰',
      '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
      '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体',
      '自媒体', 'IT互联网', '软件开发', '图文广告', '电子电器维修',
      '家居维修', '美发', '建筑工程', '其他'
    ].map(name => ({ name, enabled: true, editing: false }))

    if (!data.activityTypes || data.activityTypes.length === 0) {
      activityTypes.value = defaultActivityTypes.map(t => ({ ...t, editing: false }))
    } else {
      activityTypes.value = data.activityTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.expertTypes || data.expertTypes.length === 0) {
      expertTypes.value = defaultExpertTypes.map(t => ({ ...t, editing: false }))
    } else {
      expertTypes.value = data.expertTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.enterpriseTypes || data.enterpriseTypes.length === 0) {
      enterpriseTypes.value = defaultEnterpriseTypes.map(t => ({ ...t, editing: false }))
    } else {
      enterpriseTypes.value = data.enterpriseTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.resourceTypes || data.resourceTypes.length === 0) {
      resourceTypes.value = defaultResourceTypes.map(t => ({ ...t, editing: false }))
    } else {
      resourceTypes.value = data.resourceTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.industryTypes || data.industryTypes.length === 0) {
      industryTypes.value = defaultIndustryTypes
    } else {
      industryTypes.value = data.industryTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }
  } catch {}
  finally { loading.value = false }
}

async function saveTypes() {
  await saveBasicTypesConfig({
    activityTypes: activityTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    enterpriseTypes: enterpriseTypes.value.map(t => ({ name: t.name, enabled: t.enabled })),
    resourceTypes: resourceTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    expertTypes: expertTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    industryTypes: industryTypes.value.map(t => ({ name: t.name, enabled: t.enabled }))
  })
}

async function loadDistrictTree() {
  districtLoading.value = true
  try {
    const res = await getRegions()
    const regions = res.data || []
    // Build tree from flat list
    const map = {}
    const roots = []
    regions.forEach(r => { map[r.id] = { ...r, editing: false, children: [] } })
    regions.forEach(r => {
      if (r.parent_id === 0 || r.parent_id === null || r.parent_id === undefined) {
        roots.push(map[r.id])
      } else if (map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id])
      }
    })
    districtTree.value = roots
  } catch {
    districtTree.value = []
  } finally {
    districtLoading.value = false
  }
}

function openAdd(listName, title) {
  addDialogTitle.value = title
  currentList.value = listName
  newItemName.value = ''
  newItemDesc.value = ''
  showAddDialog.value = true
}

async function confirmAdd() {
  if (!newItemName.value.trim()) { ElMessage.warning('请输入名称'); return }
  const lists = { activityTypes, enterpriseTypes, resourceTypes, expertTypes, industryTypes }
  const listRef = lists[currentList.value]
  if (listRef) {
    const item = { name: newItemName.value.trim(), count: 0, enabled: true, editing: false, desc: newItemDesc.value }
    listRef.value.push(item)
    try {
      await saveTypes()
      ElMessage.success('添加成功')
    } catch {
      listRef.value.pop()
      ElMessage.error('添加失败，请重试')
      return
    }
  }
  showAddDialog.value = false
}

async function saveInlineEdit(row) {
  try {
    await saveTypes()
    ElMessage.success('已更新')
  } catch {
    ElMessage.error('更新失败')
  }
}

async function deleteItem(list, row) {
  ElMessageBox.confirm(`确认删除"${row.name}"？`, '删除确认', { type: 'warning' })
    .then(async () => {
      const idx = list.value.indexOf(row)
      if (idx >= 0) {
        list.value.splice(idx, 1)
        try {
          await saveTypes()
          ElMessage.success('已删除')
        } catch {
          list.value.splice(idx, 0, row)
          ElMessage.error('删除失败，请重试')
        }
      }
    })
    .catch(() => {})
}

function addDistrict(parent, level) {
  districtParent.value = parent
  districtLevel.value = level
  newDistrictName.value = ''
  // level=0表示顶级（城市/武汉市），level=1表示区，level=2表示街道，level=3表示社区
  const labels = { 0: '城市', 1: '区', 2: '街道', 3: '社区' }
  districtLabel.value = labels[level] || '节点'
  districtDialogTitle.value = parent ? `在"${parent.name}"下新增${districtLabel.value}` : `新增${districtLabel.value}`
  showDistrictDialog.value = true
}

async function saveDistrictEdit(data) {
  if (!data.name.trim()) { ElMessage.warning('名称不能为空'); data.editing = false; loadDistrictTree(); return }
  try {
    await updateRegion(data.id, { name: data.name.trim() })
    data.editing = false
    ElMessage.success('已更新')
  } catch {
    ElMessage.error('更新失败')
    data.editing = false
  }
}

async function confirmAddDistrict() {
  if (!newDistrictName.value.trim()) { ElMessage.warning('请输入名称'); return }
  try {
    const data = { name: newDistrictName.value.trim(), level: districtLevel.value + 1, parent_id: districtParent.value ? districtParent.value.id : 0 }
    await createRegion(data)
    ElMessage.success('已添加：' + newDistrictName.value)
    showDistrictDialog.value = false
    loadDistrictTree()
  } catch {
    ElMessage.error('添加失败，请重试')
  }
}

async function deleteDistrict(data, node) {
  const hasChildren = data.children && data.children.length > 0
  const msg = hasChildren ? `"${data.name}"下还有子节点，删除后子节点也将一并删除。确认删除？` : `确认删除"${data.name}"？`
  try {
    await ElMessageBox.confirm(msg, '删除确认', { type: 'warning' })
    await deleteRegionApi(data.id)
    ElMessage.success('已删除')
    loadDistrictTree()
  } catch {
    // 用户取消或删除失败
  }
}

onMounted(() => { loadBasicTypes(); loadDistrictTree() })
</script>

<style scoped>
.config-basic { max-width: 1000px; margin: 0 auto; }
.config-basic h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.config-section { background: #fff; border-radius: 12px; padding: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-desc { color: #909399; font-size: 13px; margin: 0; }
.tree-node { display: flex; align-items: center; gap: 4px; width: 100%; }
.tree-level { font-size: 11px; color: #c0c4cc; margin-left: 2px; }
.tree-actions { display: none; gap: 4px; margin-left: 12px; }
.el-tree-node__content:hover .tree-actions { display: flex; }

@media (max-width: 768px) {
  .config-basic {
    padding: 12px;
    padding-bottom: 70px;
  }
  .config-basic h2 {
    font-size: 18px;
    margin-bottom: 14px;
  }
  :deep(.el-tabs__nav) {
    font-size: 13px;
    flex-wrap: wrap;
  }
  .config-section {
    padding: 12px;
    border-radius: 8px;
  }
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }
  .section-header .el-button {
    width: 100%;
    font-size: 13px;
  }
  .section-desc {
    font-size: 12px;
  }
  :deep(.el-table) {
    font-size: 11px;
  }
  :deep(.el-table__header th) {
    font-size: 10px;
    padding: 6px 3px;
  }
  :deep(.el-table__body td) {
    padding: 6px 3px;
  }
  :deep(.el-tree) {
    font-size: 12px;
  }
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 440px;
  }
  :deep(.el-dialog__body) {
    padding: 12px;
  }
}
</style>
