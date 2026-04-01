<template>
  <div class="config-basic">
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
                <el-button text type="danger" size="small" @click="deleteItem(activityTypes, row)">删除</el-button>
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
                <el-button text type="danger" size="small" @click="deleteItem(enterpriseTypes, row)">删除</el-button>
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
                <el-button text type="danger" size="small" @click="deleteItem(resourceTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 专家类型 -->
      <el-tab-pane label="专家类型" name="expert">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">专家类型用于专家服务需求中选择</p>
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
            <el-table-column prop="count" label="已关联需求" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(expertTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 行政区划 -->
      <el-tab-pane label="行政区划" name="district">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">配置平台服务的区/街道/社区三级行政区划数据</p>
            <el-button type="primary" @click="addDistrict(null, 0)"><el-icon><Plus /></el-icon> 新增区</el-button>
          </div>
          <el-tree
            :data="districtTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            default-expand-all
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon style="margin-right:4px;color:#909399"><Location /></el-icon>
                <span v-if="!data.editing">{{ node.label }}</span>
                <el-input v-else v-model="data.name" size="small" style="width:150px" @blur="data.editing=false" @keyup.enter="data.editing=false" />
                <span class="tree-level" v-if="!data.children">[社区]</span>
                <span class="tree-level" v-else-if="data.children && !data.children[0]?.children">[街道]</span>
                <span class="tree-level" v-else>[区]</span>
                <span class="tree-actions">
                  <el-button text type="primary" size="small" @click.stop="data.editing=true">编辑</el-button>
                  <el-button v-if="node.level < 3" text type="success" size="small" @click.stop="addDistrict(data, node.level)">
                    {{ node.level === 1 ? '加街道' : '加社区' }}
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Location } from '@element-plus/icons-vue'

const activeTab = ref('activity')
const showAddDialog = ref(false), addDialogTitle = ref(''), newItemName = ref(''), newItemDesc = ref(''), currentList = ref(null)
const showDistrictDialog = ref(false), districtDialogTitle = ref(''), districtLabel = ref(''), newDistrictName = ref('')
const districtParent = ref(null), districtLevel = ref(0)
let districtIdCounter = 200

const activityTypes = reactive([
  { name: '文艺演出', desc: '音乐、舞蹈、戏剧等文艺表演类活动', count: 12, enabled: true, editing: false },
  { name: '体育赛事', desc: '社区运动会、球类比赛等体育竞技活动', count: 8, enabled: true, editing: false },
  { name: '公益活动', desc: '志愿服务、慈善募捐等公益类活动', count: 25, enabled: true, editing: false },
  { name: '节庆活动', desc: '传统节日庆典、季节性主题活动', count: 18, enabled: true, editing: false },
  { name: '亲子活动', desc: '针对亲子家庭的互动娱乐活动', count: 20, enabled: true, editing: false },
  { name: '健康讲座', desc: '医疗健康、营养养生等知识讲座', count: 15, enabled: true, editing: false },
  { name: '环保活动', desc: '绿色环保、垃圾分类等环境保护活动', count: 6, enabled: true, editing: false },
  { name: '法制宣传', desc: '法律知识普及、权益保护宣传活动', count: 9, enabled: true, editing: false },
  { name: '职业技能培训', desc: '就业指导、职业技能提升培训', count: 7, enabled: true, editing: false },
  { name: '文化展览', desc: '书画展、摄影展、手工艺展览等', count: 5, enabled: true, editing: false },
  { name: '趣味运动会', desc: '老少皆宜的趣味运动类活动', count: 11, enabled: true, editing: false },
  { name: '其他', desc: '未列入以上类型的其他活动', count: 4, enabled: true, editing: false }
])

const enterpriseTypes = reactive([
  { name: '餐饮', count: 8, enabled: true, editing: false },
  { name: '零售', count: 6, enabled: true, editing: false },
  { name: '教育', count: 5, enabled: true, editing: false },
  { name: '医疗健康', count: 4, enabled: true, editing: false },
  { name: '科技互联网', count: 7, enabled: true, editing: false },
  { name: '金融保险', count: 3, enabled: true, editing: false },
  { name: '文旅娱乐', count: 2, enabled: true, editing: false },
  { name: '房地产', count: 2, enabled: true, editing: false },
  { name: '其他', count: 5, enabled: true, editing: false }
])

const resourceTypes = reactive([
  { name: '资金赞助', desc: '提供活动资金支持', enabled: true, editing: false },
  { name: '物资提供', desc: '提供实物物资', enabled: true, editing: false },
  { name: '人力支持', desc: '提供人员服务', enabled: true, editing: false },
  { name: '技术支持', desc: '提供设备器材或技术服务', enabled: true, editing: false },
  { name: '专业服务', desc: '提供专业人士服务', enabled: true, editing: false },
  { name: '媒体报道', desc: '提供媒体宣传资源', enabled: true, editing: false }
])

const expertTypes = reactive([
  { name: '法律咨询', count: 12, enabled: true, editing: false },
  { name: '医疗健康', count: 18, enabled: true, editing: false },
  { name: '心理辅导', count: 9, enabled: true, editing: false },
  { name: '教育培训', count: 14, enabled: true, editing: false },
  { name: '金融理财', count: 7, enabled: true, editing: false },
  { name: '技能培训', count: 11, enabled: true, editing: false },
  { name: '营养指导', count: 5, enabled: true, editing: false },
  { name: '体育健身', count: 8, enabled: true, editing: false },
  { name: '其他', count: 3, enabled: true, editing: false }
])

const districtTree = reactive([
  {
    id: 1, name: '浦东新区', editing: false, children: [
      {
        id: 11, name: '花木街道', editing: false, children: [
          { id: 111, name: '阳光花园社区', editing: false, children: [] },
          { id: 112, name: '幸福里社区', editing: false, children: [] }
        ]
      },
      {
        id: 12, name: '张江镇', editing: false, children: [
          { id: 121, name: '翠竹苑社区', editing: false, children: [] }
        ]
      },
      {
        id: 13, name: '陆家嘴街道', editing: false, children: [
          { id: 131, name: '新华里社区', editing: false, children: [] }
        ]
      }
    ]
  }
])

function openAdd(listName, title) {
  addDialogTitle.value = title
  currentList.value = listName
  newItemName.value = ''
  newItemDesc.value = ''
  showAddDialog.value = true
}

function confirmAdd() {
  if (!newItemName.value.trim()) { ElMessage.warning('请输入名称'); return }
  const lists = { activityTypes, enterpriseTypes, resourceTypes, expertTypes }
  const list = lists[currentList.value]
  if (list) list.push({ name: newItemName.value.trim(), count: 0, enabled: true, editing: false, desc: newItemDesc.value })
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

function deleteItem(list, row) {
  ElMessageBox.confirm(`确认删除"${row.name}"？`, '删除确认', { type: 'warning' })
    .then(() => { const idx = list.indexOf(row); if (idx >= 0) list.splice(idx, 1); ElMessage.success('已删除') })
    .catch(() => {})
}

function addDistrict(parent, level) {
  districtParent.value = parent
  districtLevel.value = level
  newDistrictName.value = ''
  const labels = { 0: '区', 1: '街道/镇', 2: '社区' }
  districtLabel.value = labels[level] || '节点'
  districtDialogTitle.value = parent ? `在"${parent.name}"下新增${districtLabel.value}` : `新增${districtLabel.value}`
  showDistrictDialog.value = true
}

function confirmAddDistrict() {
  if (!newDistrictName.value.trim()) { ElMessage.warning('请输入名称'); return }
  const newNode = { id: districtIdCounter++, name: newDistrictName.value.trim(), editing: false, children: districtLevel.value < 2 ? [] : undefined }
  if (!districtParent.value) {
    districtTree.push(newNode)
  } else {
    if (!districtParent.value.children) districtParent.value.children = []
    districtParent.value.children.push(newNode)
  }
  showDistrictDialog.value = false
  ElMessage.success('已添加：' + newDistrictName.value)
}

function deleteDistrict(data, node) {
  const hasChildren = data.children && data.children.length > 0
  const msg = hasChildren ? `"${data.name}"下还有子节点，删除后子节点也将一并删除。确认删除？` : `确认删除"${data.name}"？`
  ElMessageBox.confirm(msg, '删除确认', { type: 'warning' })
    .then(() => {
      const parent = node.parent
      const children = parent.data.children || parent.data
      const index = children.findIndex(d => d.id === data.id)
      if (index >= 0) children.splice(index, 1)
      ElMessage.success('已删除')
    }).catch(() => {})
}
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
</style>
