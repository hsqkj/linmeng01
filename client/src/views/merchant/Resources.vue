<template>
  <div class="page">
    <div class="page-header">
      <h2>我的资源</h2>
      <el-button type="primary" @click="$router.push('/merchant/resources/publish')">
        <el-icon><Plus /></el-icon> 发布资源
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索资源名称" style="width:220px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.status" placeholder="状态" style="width:130px" clearable>
        <el-option label="全部" value="" />
        <el-option label="已发布" value="published" />
        <el-option label="待审核" value="pending" />
        <el-option label="已下架" value="offline" />
      </el-select>
      <el-select v-model="filters.type" placeholder="资源类型" style="width:150px" clearable>
        <el-option label="全部" value="" />
        <el-option v-for="t in resourceTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 资源列表 -->
    <el-table :data="myResources" stripe>
      <el-table-column prop="title" label="资源标题" min-width="200" />
      <el-table-column prop="type" label="资源类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType[row.status]">{{ statusLabel[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="matchCount" label="匹配需求" width="90" align="center" />
      <el-table-column prop="viewCount" label="浏览量" width="80" align="center" />
      <el-table-column prop="createTime" label="发布时间" width="110" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row)">查看</el-button>
          <el-button type="success" size="small" text @click="editResource(row)">编辑</el-button>
          <el-button v-if="row.status === 'published'" type="warning" size="small" text @click="toggleStatus(row, 'offline')">下架</el-button>
          <el-button v-else-if="row.status === 'offline'" type="success" size="small" text @click="toggleStatus(row, 'published')">上架</el-button>
          <el-button type="danger" size="small" text @click="deleteResource(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination layout="prev,pager,next,total" :total="myResources.length" :page-size="10" />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetail" title="资源详情" width="700px" v-if="currentResource">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资源标题" :span="2"><strong>{{ currentResource.title }}</strong></el-descriptions-item>
        <el-descriptions-item label="资源类型">
          <el-tag size="small">{{ currentResource.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusType[currentResource.status]">{{ statusLabel[currentResource.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源说明" :span="2">{{ currentResource.desc }}</el-descriptions-item>
        <el-descriptions-item label="可提供内容" :span="2">{{ currentResource.provide }}</el-descriptions-item>
        <el-descriptions-item label="期望回报" :span="2">{{ currentResource.reward }}</el-descriptions-item>
        <el-descriptions-item label="适合社区" :span="2">{{ currentResource.suitable }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="t in currentResource.tags" :key="t" size="small" style="margin:2px">{{ t }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ currentResource.createTime }}</el-descriptions-item>
        <el-descriptions-item label="浏览量">{{ currentResource.viewCount }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="success" @click="editResource(currentResource); showDetail = false">编辑资源</el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEdit" title="编辑资源" width="700px">
      <el-form :model="editForm" label-width="110px">
        <el-form-item label="资源标题" required>
          <el-input v-model="editForm.title" placeholder="如：星巴克活动赞助计划" />
        </el-form-item>
        <el-form-item label="资源类型" required>
          <el-select v-model="editForm.type" style="width:100%">
            <el-option v-for="t in resourceTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源说明">
          <el-input v-model="editForm.desc" type="textarea" :rows="3" placeholder="简要描述资源内容..." />
        </el-form-item>
        <el-form-item label="可提供内容">
          <el-input v-model="editForm.provide" type="textarea" :rows="2" placeholder="如：活动资金1万~5万元，物资支持等" />
        </el-form-item>
        <el-form-item label="期望回报">
          <el-input v-model="editForm.reward" type="textarea" :rows="2" placeholder="如：冠名权、展台位置、公众号推文等" />
        </el-form-item>
        <el-form-item label="适合社区类型">
          <el-input v-model="editForm.suitable" placeholder="如：亲子型、文化型、综合型社区" />
        </el-form-item>
        <el-form-item label="标签">
          <div class="tag-selector">
            <el-check-tag v-for="t in allTags" :key="t" :checked="editForm.tags.includes(t)" @change="toggleTag(t)" style="margin:4px">{{ t }}</el-check-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const showDetail = ref(false), showEdit = ref(false)
const currentResource = ref(null)
const filters = reactive({ keyword: '', status: '', type: '' })
const resourceTypes = ['资金赞助', '物资提供', '人力支持', '技术支持', '专业服务', '媒体报道']
const statusType = { published: 'success', pending: 'warning', offline: 'info' }
const statusLabel = { published: '已发布', pending: '待审核', offline: '已下架' }
const allTags = ['亲子活动', '老年服务', '文化活动', '体育赛事', '教育培训', '健康医疗', '科技科普', '节庆活动', '环保公益', '商业推广', '社区建设', '志愿服务']

const myResources = reactive([
  { id: 1, title: '星巴克社区活动赞助计划', type: '资金赞助', status: 'published', desc: '为社区文化、亲子类活动提供资金支持', provide: '活动资金1万~5万元，根据活动规模面议', reward: '冠名权、展台2个、公众号推文', suitable: '亲子型、文化型社区', tags: ['亲子活动', '文化活动'], createTime: '2026-03-15', viewCount: 234, matchCount: 8 },
  { id: 2, title: '咖啡饮品活动现场支持', type: '物资提供', status: 'published', desc: '社区活动现场提供咖啡、饮品支持', provide: '活动现场咖啡饮品物料，约200份', reward: '活动现场品牌展示', suitable: '各类社区', tags: ['社区建设', '商业推广'], createTime: '2026-03-10', viewCount: 156, matchCount: 5 },
  { id: 3, title: '新东方教育公益讲座', type: '专业服务', status: 'pending', desc: '专业讲师进社区，开展亲子教育主题讲座', provide: '1~2名专职讲师，每场2小时，可连续3场', reward: '机构宣传展架，课程手册发放', suitable: '有幼儿园或小学的社区', tags: ['教育培训', '亲子活动'], createTime: '2026-03-28', viewCount: 45, matchCount: 2 },
  { id: 4, title: '5G科技进社区活动', type: '技术支持', status: 'offline', desc: '提供5G科技科普讲座和社区活动WiFi支持', provide: '5G工程师讲座1场+现场WiFi布署', reward: '中国移动品牌展示区', suitable: '科技创新需求社区', tags: ['科技科普', '社区建设'], createTime: '2026-02-20', viewCount: 89, matchCount: 3 }
])

const editForm = reactive({ id: null, title: '', type: '', desc: '', provide: '', reward: '', suitable: '', tags: [] })

function viewDetail(row) {
  currentResource.value = row
  showDetail.value = true
}

function editResource(row) {
  Object.assign(editForm, JSON.parse(JSON.stringify(row)))
  showEdit.value = true
}

function saveEdit() {
  const idx = myResources.findIndex(r => r.id === editForm.id)
  if (idx >= 0) Object.assign(myResources[idx], JSON.parse(JSON.stringify(editForm)))
  showEdit.value = false
  ElMessage.success('资源已更新')
}

function toggleStatus(row, newStatus) {
  const action = newStatus === 'published' ? '上架' : '下架'
  ElMessageBox.confirm(`确定要${action}「${row.title}」吗？`, `${action}确认`, { type: 'warning' }).then(() => {
    row.status = newStatus
    ElMessage.success(`资源已${action}`)
  }).catch(() => {})
}

function deleteResource(row) {
  ElMessageBox.confirm(`确定要删除「${row.title}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' }).then(() => {
    const idx = myResources.findIndex(r => r.id === row.id)
    if (idx >= 0) myResources.splice(idx, 1)
    ElMessage.success('资源已删除')
  }).catch(() => {})
}

function toggleTag(tag) {
  const idx = editForm.tags.indexOf(tag)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(tag)
}

function doSearch() { ElMessage.info('搜索功能已触发（演示版）') }
function resetFilters() { Object.assign(filters, { keyword: '', status: '', type: '' }) }
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.tag-selector { display: flex; flex-wrap: wrap; }
</style>
