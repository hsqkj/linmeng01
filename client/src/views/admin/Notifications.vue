<template>
  <div class="page" v-loading="loading">
    <h2>系统通知管理</h2>

    <div class="action-bar">
      <el-button type="primary" @click="openCreate">发布新通知</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="通知状态" style="width:130px" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="草稿" value="0" />
        <el-option label="已发布" value="1" />
        <el-option label="已撤回" value="2" />
      </el-select>
      <el-select v-model="filterTarget" placeholder="发送对象" style="width:140px" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="全体用户" value="all" />
        <el-option label="社区用户" value="community" />
        <el-option label="商家用户" value="merchant" />
        <el-option label="招商大使" value="ambassador" />
      </el-select>
    </div>

    <el-table :data="notifications" stripe border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="title" label="通知标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="target_type" label="发送对象" width="100">
        <template #default="{ row }">
          {{ targetLabels[row.target_type] || row.target_type }}
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="priorityTag[row.priority]" size="small">{{ priorityLabels[row.priority] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTag[row.status]" size="small">{{ statusLabels[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="创建人" width="100" />
      <el-table-column prop="published_at" label="发布时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.published_at) }}</template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
          <el-button v-if="row.status === 0" text type="success" size="small" @click="publishNotify(row)">发布</el-button>
          <el-button v-if="row.status === 1" text type="warning" size="small" @click="withdraw(row)">撤回</el-button>
          <el-button v-if="row.status !== 3" text type="danger" size="small" @click="deleteNotify(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        layout="prev,pager,next,total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>

    <!-- 通知详情对话框 -->
    <el-dialog v-model="showDetail" title="通知详情" width="600px" v-if="currentNotify">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="通知标题" :span="2">{{ currentNotify.title }}</el-descriptions-item>
        <el-descriptions-item label="发送对象">{{ targetLabels[currentNotify.target_type] }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="priorityTag[currentNotify.priority]" size="small">{{ priorityLabels[currentNotify.priority] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag[currentNotify.status]" size="small">{{ statusLabels[currentNotify.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentNotify.creator_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmtTime(currentNotify.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ fmtTime(currentNotify.published_at) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="通知内容" :span="2">
          <div style="white-space:pre-wrap;line-height:1.6;max-height:200px;overflow-y:auto">{{ currentNotify.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentNotify.status === 0" type="success" @click="publishNotify(currentNotify); showDetail = false">发布</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑通知对话框 -->
    <el-dialog v-model="showForm" :title="editId ? '编辑通知' : '发布新通知'" width="620px">
      <el-form label-position="top">
        <el-form-item label="通知标题" required>
          <el-input v-model="form.title" placeholder="请输入通知标题，最多50字" maxlength="50" clearable />
        </el-form-item>
        <el-form-item label="通知内容" required>
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请输入通知内容" maxlength="1000" />
        </el-form-item>
        <el-form-item label="发送对象" required>
          <el-radio-group v-model="form.target_type">
            <el-radio label="all">全体用户</el-radio>
            <el-radio label="community">社区用户</el-radio>
            <el-radio label="merchant">商家用户</el-radio>
            <el-radio label="ambassador">招商大使</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio :label="0">普通</el-radio>
            <el-radio :label="1">重要</el-radio>
            <el-radio :label="2">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button @click="saveDraft" :loading="submitting">保存草稿</el-button>
        <el-button type="primary" @click="saveAndPublish" :loading="submitting">保存并发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getNotifications, getNotificationDetail,
  createNotification, updateNotification,
  deleteNotification, publishNotification
} from '@/api/admin'

const loading = ref(false)
const notifications = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10

const filterStatus = ref('')
const filterTarget = ref('')

const showDetail = ref(false)
const showForm = ref(false)
const currentNotify = ref(null)
const editId = ref(null)
const submitting = ref(false)

const form = ref({
  title: '',
  content: '',
  target_type: 'all',
  priority: 0
})

const targetLabels = { all: '全体用户', community: '社区用户', merchant: '商家用户', ambassador: '招商大使' }
const priorityLabels = { 0: '普通', 1: '重要', 2: '紧急' }
const priorityTag = { 0: 'info', 1: 'warning', 2: 'danger' }
const statusLabels = { 0: '草稿', 1: '已发布', 2: '已撤回', 3: '已删除' }
const statusTag = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }

async function loadNotifications() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterTarget.value) params.target_type = filterTarget.value
    const res = await getNotifications(params)
    notifications.value = res.data?.list || res.data || []
    total.value = res.data?.pagination?.total || res.data?.total || notifications.value.length
  } catch {
    notifications.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadNotifications()
}

function onPageChange(p) {
  page.value = p
  loadNotifications()
}

async function viewDetail(row) {
  try {
    const res = await getNotificationDetail(row.id)
    currentNotify.value = res.data
    showDetail.value = true
  } catch {
    ElMessage.error('加载详情失败')
  }
}

function openCreate() {
  editId.value = null
  form.value = { title: '', content: '', target_type: 'all', priority: 0 }
  showForm.value = true
}

async function saveDraft() {
  if (!form.value.title.trim()) { ElMessage.warning('请填写通知标题'); return }
  if (!form.value.content.trim()) { ElMessage.warning('请填写通知内容'); return }
  submitting.value = true
  try {
    if (editId.value) {
      await updateNotification(editId.value, { ...form.value, status: 0 })
    } else {
      await createNotification({ ...form.value, draft: true })
    }
    ElMessage.success('草稿已保存')
    showForm.value = false
    loadNotifications()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

async function saveAndPublish() {
  if (!form.value.title.trim()) { ElMessage.warning('请填写通知标题'); return }
  if (!form.value.content.trim()) { ElMessage.warning('请填写通知内容'); return }
  submitting.value = true
  try {
    await createNotification({ ...form.value, draft: false })
    ElMessage.success('通知已发布')
    showForm.value = false
    loadNotifications()
  } catch {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

async function publishNotify(row) {
  try {
    await ElMessageBox.confirm(
      `确认发布通知"${row.title}"？发布后将推送给${targetLabels[row.target_type] || '目标用户'}。`,
      '发布确认',
      { type: 'success', confirmButtonText: '确认发布', cancelButtonText: '取消' }
    )
    await publishNotification(row.id)
    ElMessage.success('通知已发布')
    loadNotifications()
  } catch {}
}

async function withdraw(row) {
  try {
    await ElMessageBox.confirm(`确认撤回通知"${row.title}"？撤回后用户端将不再显示。`, '撤回确认', { type: 'warning' })
    await updateNotification(row.id, { status: 2 })
    ElMessage.success('已撤回')
    loadNotifications()
  } catch {}
}

async function deleteNotify(row) {
  try {
    await ElMessageBox.confirm('确认删除该通知？删除后不可恢复。', '删除确认', { type: 'warning' })
    await deleteNotification(row.id)
    ElMessage.success('已删除')
    loadNotifications()
  } catch {}
}

function fmtTime(t) {
  if (!t) return '—'
  return String(t).slice(0, 16).replace('T', ' ')
}

onMounted(() => { loadNotifications() })
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.action-bar { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
