<template>
  <div class="page"><h2>标签管理</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="社区标签" name="community">
        <div class="tag-actions">
          <el-button type="primary" @click="addTag('community')"><el-icon><Plus /></el-icon> 新增标签</el-button>
        </div>
        <div class="tag-grid">
          <div class="tag-item" v-for="(tag, i) in communityTags" :key="i">
            <el-tag closable @close="communityTags.splice(i,1)" type="primary" size="large">{{ tag }}</el-tag>
          </div>
          <div class="tag-item add-btn" @click="addTag('community')">
            <el-button circle type="primary" plain size="small"><el-icon><Plus /></el-icon></el-button>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="商家标签" name="merchant">
        <div class="tag-actions">
          <el-button type="primary" @click="addTag('merchant')"><el-icon><Plus /></el-icon> 新增标签</el-button>
        </div>
        <div class="tag-grid">
          <div class="tag-item" v-for="(tag, i) in merchantTags" :key="i">
            <el-tag closable @close="merchantTags.splice(i,1)" type="success" size="large">{{ tag }}</el-tag>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="待审核自定义标签" name="custom">
        <el-table :data="customTags" stripe border>
          <el-table-column prop="tag" label="标签名称" min-width="150" />
          <el-table-column prop="submitter" label="提交者" width="130" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column prop="submitTime" label="提交时间" width="150" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button text type="success" size="small" @click="approveTag(row)">通过</el-button>
              <el-button text type="danger" size="small">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAddTag" title="新增标签" width="350px">
      <el-input v-model="newTag" placeholder="输入标签名称" />
      <template #footer>
        <el-button @click="showAddTag=false">取消</el-button>
        <el-button type="primary" @click="confirmAddTag">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
const activeTab = ref('community'), showAddTag = ref(false), newTag = ref(''), addingTo = ref('')
const communityTags = reactive(['老旧小区', '新建社区', '亲子社区', '老龄化社区', '学区社区', '商圈社区', '文化社区', '体育社区', '绿色社区', '公共空间丰富', '商业密集', '志愿服务活跃'])
const merchantTags = reactive(['连锁品牌', '本地企业', '上市公司', '高端品牌', '大众品牌', '公益导向', '长期合作', '亲子品牌', '老年服务', '全国服务', '精准获客', '社会责任'])
const customTags = reactive([
  { tag: '外来务工人员社区', submitter: '张主任（社区）', type: '社区标签', submitTime: '2026-04-01 10:00' },
  { tag: '绿色环保品牌', submitter: '某商家', type: '商家标签', submitTime: '2026-03-30 16:00' }
])
function addTag(type) { addingTo.value = type; newTag.value = ''; showAddTag.value = true }
function confirmAddTag() {
  if (!newTag.value.trim()) return
  if (addingTo.value === 'community') communityTags.push(newTag.value.trim())
  else merchantTags.push(newTag.value.trim())
  showAddTag.value = false; ElMessage.success('标签已添加')
}
function approveTag(row) {
  if (row.type === '社区标签') communityTags.push(row.tag)
  else merchantTags.push(row.tag)
  customTags.splice(customTags.indexOf(row), 1)
  ElMessage.success('标签已通过并添加')
}
</script>
<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.tag-actions { margin-bottom: 16px; }
.tag-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.tag-item { display: flex; align-items: center; }
</style>
