<template>
  <div class="page"><h2>广告轮播图配置</h2>
    <div class="tip-box">📢 轮播图显示在社区端和商家端首页，建议尺寸 1920×400px</div>
    <el-button type="primary" @click="showAdd = true" style="margin-bottom:16px"><el-icon><Plus /></el-icon> 新增轮播图</el-button>
    <el-table :data="banners" stripe border>
      <el-table-column prop="order" label="排序" width="80" align="center" />
      <el-table-column label="预览图" width="160">
        <template #default="{ row }">
          <div class="banner-preview" :style="{ background: row.color }">
            <span style="color:#fff;font-size:12px">{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="position" label="展示位置" width="120" />
      <el-table-column prop="link" label="链接" min-width="150" show-overflow-tooltip />
      <el-table-column prop="startTime" label="生效时间" width="150" />
      <el-table-column prop="enabled" label="启用" width="80" align="center">
        <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="editBanner(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="deleteBanner(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showAdd" :title="editMode ? '编辑轮播图' : '新增轮播图'" width="560px">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="轮播图标题" /></el-form-item>
        <el-form-item label="图片上传"><el-upload drag :auto-upload="false" accept="image/*"><div class="el-upload__text">拖拽图片至此，或 <em>点击上传</em></div><template #tip><div>建议尺寸 1920×400px，JPG/PNG格式</div></template></el-upload></el-form-item>
        <el-form-item label="跳转链接"><el-input v-model="form.link" placeholder="点击后跳转的链接（可留空）" /></el-form-item>
        <el-form-item label="展示位置">
          <el-radio-group v-model="form.position">
            <el-radio label="both">两端都展示</el-radio>
            <el-radio label="community">仅社区端</el-radio>
            <el-radio label="merchant">仅商家端</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="生效开始时间"><el-date-picker v-model="form.startTime" type="datetime" placeholder="选择时间" style="width:100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生效结束时间"><el-date-picker v-model="form.endTime" type="datetime" placeholder="选择时间" style="width:100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="排序（数值越小越靠前）"><el-input-number v-model="form.order" :min="1" :max="99" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd=false">取消</el-button>
        <el-button type="primary" @click="saveBanner">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
const showAdd = ref(false), editMode = ref(false)
const form = reactive({ title: '', link: '', position: 'both', startTime: '', endTime: '', order: 1 })
const banners = reactive([
  { order: 1, title: '邻盟平台上线啦！', position: '两端', link: '/about', startTime: '2026-01-01', enabled: true, color: '#1890ff' },
  { order: 2, title: '金牌会员限时优惠', position: '商家端', link: '/member', startTime: '2026-03-01', enabled: true, color: '#E6A23C' },
  { order: 3, title: '社区活动精彩瞬间', position: '社区端', link: '/cases', startTime: '2026-02-01', enabled: true, color: '#67C23A' },
  { order: 4, title: '招商大使火热招募中', position: '两端', link: '/ambassador/join', startTime: '2026-01-15', enabled: true, color: '#F56C6C' }
])
function editBanner(row) { Object.assign(form, row); editMode.value = true; showAdd.value = true }
function deleteBanner(row) { banners.splice(banners.indexOf(row), 1); ElMessage.success('已删除') }
function saveBanner() { showAdd.value = false; ElMessage.success('保存成功') }
</script>
<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #f0f7ff; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #409EFF; font-size: 14px; }
.banner-preview { width: 120px; height: 36px; border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 0 8px; }
</style>
