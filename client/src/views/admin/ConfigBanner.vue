<template>
  <div class="page"><h2>广告轮播图配置</h2>
    <div class="tip-box">📢 轮播图显示在社区端和商家端首页，建议尺寸 1920×400px</div>
    <el-button type="primary" @click="openAdd" style="margin-bottom:16px" v-loading="loading"><el-icon><Plus /></el-icon> 新增轮播图</el-button>
    <el-table :data="banners" stripe border v-loading="loading">
      <el-table-column prop="sort_order" label="排序" width="80" align="center" />
      <el-table-column label="预览图" width="160">
        <template #default="{ row }">
          <div class="banner-preview" :style="{ background: row.image_url ? '#409EFF' : '#ccc' }">
            <img v-if="row.image_url" :src="row.image_url" style="width:100%;height:100%;object-fit:cover;border-radius:4px" />
            <span v-else style="color:#fff;font-size:12px">{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="position" label="展示位置" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="positionTagType[row.position] || 'info'">{{ positionName[row.position] || row.position }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="link_url" label="链接" min-width="150" show-overflow-tooltip>
        <template #default="{ row }"><span v-if="row.link_url">{{ row.link_url }}</span><span v-else style="color:#c0c4cc">无</span></template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row._status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="editBanner(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="deleteBanner(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDialog" :title="editMode ? '编辑轮播图' : '新增轮播图'" width="560px">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required><el-input v-model="form.title" placeholder="轮播图标题" maxlength="50" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="form.image_url" placeholder="图片链接地址（http://...）" /></el-form-item>
        <el-form-item label="跳转链接"><el-input v-model="form.link_url" placeholder="点击后跳转的链接（可留空）" /></el-form-item>
        <el-form-item label="展示位置">
          <el-radio-group v-model="form.position">
            <el-radio label="both">两端都展示</el-radio>
            <el-radio label="community">仅社区端</el-radio>
            <el-radio label="merchant">仅商家端</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序（数值越小越靠前）"><el-input-number v-model="form.sort_order" :min="1" :max="99" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog=false">取消</el-button>
        <el-button type="primary" @click="saveBanner">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getBanners, createBanner, updateBanner, deleteBanner as deleteBannerApi } from '@/api/admin'

const loading = ref(false)
const banners = ref([])
const showDialog = ref(false)
const editMode = ref(false)
const editId = ref(null)
const form = reactive({ title: '', image_url: '', link_url: '', position: 'both', sort_order: 1 })

const positionName = { both: '两端', community: '社区端', merchant: '商家端' }
const positionTagType = { both: '', community: 'success', merchant: 'warning' }

async function loadBanners() {
  loading.value = true
  try {
    const res = await getBanners()
    banners.value = (res.data || []).map(b => ({ ...b, _status: b.status === undefined ? 1 : b.status }))
  } catch {
    banners.value = []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editMode.value = false
  editId.value = null
  Object.assign(form, { title: '', image_url: '', link_url: '', position: 'both', sort_order: 1 })
  showDialog.value = true
}

function editBanner(row) {
  editMode.value = true
  editId.value = row.id
  Object.assign(form, { title: row.title, image_url: row.image_url || '', link_url: row.link_url || '', position: row.position || 'both', sort_order: row.sort_order || 1 })
  showDialog.value = true
}

async function saveBanner() {
  if (!form.title.trim()) { ElMessage.warning('请输入标题'); return }
  try {
    const data = { title: form.title.trim(), image_url: form.image_url, link_url: form.link_url, position: form.position, sort_order: form.sort_order }
    if (editMode.value) {
      await updateBanner(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createBanner(data)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    loadBanners()
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}

async function deleteBanner(row) {
  try {
    await ElMessageBox.confirm(`确认删除轮播图"${row.title}"？`, '删除确认', { type: 'warning' })
    await deleteBannerApi(row.id)
    ElMessage.success('已删除')
    loadBanners()
  } catch {
    // 用户取消
  }
}

async function toggleStatus(row) {
  try {
    await updateBanner(row.id, { title: row.title, image_url: row.image_url, link_url: row.link_url, position: row.position, sort_order: row.sort_order, status: row._status })
    ElMessage.success(row._status === 1 ? '已启用' : '已禁用')
  } catch {
    row._status = row._status === 1 ? 0 : 1
    ElMessage.error('切换失败')
  }
}

onMounted(() => { loadBanners() })
</script>
<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #f0f7ff; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #409EFF; font-size: 14px; }
.banner-preview { width: 120px; height: 36px; border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 0 8px; overflow: hidden; }

@media (max-width: 768px) {
  .page {
    padding: 12px;
    padding-bottom: 70px;
  }
  .page h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  .tip-box {
    padding: 8px 12px;
    font-size: 12px;
    margin-bottom: 12px;
  }
  .el-button {
    font-size: 13px;
    width: 100%;
    margin-bottom: 12px;
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
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 560px;
  }
  :deep(.el-dialog__body) {
    padding: 12px;
  }
}
</style>
