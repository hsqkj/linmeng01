<template>
  <div class="config-service" v-loading="loading">
    <h2>智能客服配置</h2>

    <el-tabs v-model="activeTab">
      <!-- FAQ资料库 -->
      <el-tab-pane label="FAQ资料库" name="faq">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">配置智能客服的常见问题与回答，用户提问时可自动匹配回复</p>
            <el-button type="primary" @click="openAddFaq"><el-icon><Plus /></el-icon> 添加FAQ</el-button>
          </div>
          <el-table :data="faqs" stripe border>
            <el-table-column type="index" width="60" label="序号" />
            <el-table-column prop="question" label="问题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="answer" label="回答" min-width="300" show-overflow-tooltip />
            <el-table-column prop="hits" label="命中次数" width="100" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleFaq(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editFaq(row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteFaq(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 客服设置 -->
      <el-tab-pane label="客服设置" name="settings">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">配置智能客服的基本设置和欢迎语</p>
          </div>
          <el-form :model="serviceSettings" label-width="120px" style="max-width: 600px">
            <el-form-item label="客服名称">
              <el-input v-model="serviceSettings.name" placeholder="如：邻盟智能小助手" />
            </el-form-item>
            <el-form-item label="欢迎语">
              <el-input v-model="serviceSettings.welcome" type="textarea" :rows="3" placeholder="用户打开客服时的欢迎语" />
            </el-form-item>
            <el-form-item label="工作时间">
              <el-input v-model="serviceSettings.workTime" placeholder="如：周一至周五 9:00-18:00" />
            </el-form-item>
            <el-form-item label="客服热线">
              <el-input v-model="serviceSettings.hotline" placeholder="如：400-888-8888" />
            </el-form-item>
            <el-form-item label="客服邮箱">
              <el-input v-model="serviceSettings.email" placeholder="如：12494789@qq.com" />
            </el-form-item>
            <el-form-item label="未知问题回复">
              <el-input v-model="serviceSettings.unknownReply" type="textarea" :rows="2" placeholder="当无法匹配时的回复内容" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 快捷问题配置 -->
      <el-tab-pane label="快捷问题" name="quick">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">配置用户在智能客服中看到的快捷问题按钮</p>
            <el-button type="primary" @click="openAddQuick"><el-icon><Plus /></el-icon> 添加快捷问题</el-button>
          </div>
          <el-table :data="quickQuestions" stripe border>
            <el-table-column type="index" width="60" label="序号" />
            <el-table-column prop="text" label="问题文本" min-width="300" />
            <el-table-column prop="sort" label="排序" width="80" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleQuick(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editQuick(row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteQuick(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑FAQ弹窗 -->
    <el-dialog v-model="showFaqDialog" :title="editingFaq ? '编辑FAQ' : '添加FAQ'" width="600px">
      <el-form :model="faqForm" label-width="100px">
        <el-form-item label="问题" required>
          <el-input v-model="faqForm.question" placeholder="请输入常见问题" />
        </el-form-item>
        <el-form-item label="回答" required>
          <el-input v-model="faqForm.answer" type="textarea" :rows="4" placeholder="请输入回复内容" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="faqForm.keywords" placeholder="可选，用逗号分隔，用于更精准匹配" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFaqDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFaq" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑快捷问题弹窗 -->
    <el-dialog v-model="showQuickDialog" :title="editingQuick ? '编辑快捷问题' : '添加快捷问题'" width="500px">
      <el-form :model="quickForm" label-width="100px">
        <el-form-item label="问题文本" required>
          <el-input v-model="quickForm.text" placeholder="请输入快捷问题文本" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="quickForm.sort" :min="1" :max="99" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuickDialog = false">取消</el-button>
        <el-button type="primary" @click="saveQuick" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getServiceConfig, saveServiceConfig, getFaqList, createFaq, updateFaq, deleteFaq as deleteFaqApi, getQuickQuestions, createQuickQuestion, updateQuickQuestion, deleteQuickQuestion } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('faq')

// FAQ列表
const faqs = ref([])
const showFaqDialog = ref(false)
const editingFaq = ref(null)
const faqForm = ref({
  question: '',
  answer: '',
  keywords: ''
})

// 快捷问题
const quickQuestions = ref([])
const showQuickDialog = ref(false)
const editingQuick = ref(null)
const quickForm = ref({
  text: '',
  sort: 1
})

// 客服设置
const serviceSettings = ref({
  name: '邻盟智能客服',
  welcome: '您好！我是邻盟智能客服助手 👋\n请问有什么可以帮您？',
  workTime: '周一至周五 9:00-18:00',
  hotline: '400-888-8888',
  email: '12494789@qq.com',
  unknownReply: '抱歉，我暂时无法理解您的问题。您可以：\n1. 拨打客服热线：400-888-8888\n2. 发送邮件至：12494789@qq.com'
})

async function loadFaqs() {
  loading.value = true
  try {
    const res = await getFaqList()
    faqs.value = res.data || []
  } catch {
    faqs.value = []
  } finally {
    loading.value = false
  }
}

async function loadQuickQuestions() {
  try {
    const res = await getQuickQuestions()
    quickQuestions.value = res.data || []
  } catch {
    quickQuestions.value = []
  }
}

async function loadSettings() {
  try {
    const res = await getServiceConfig()
    if (res.data) {
      serviceSettings.value = { ...serviceSettings.value, ...res.data }
    }
  } catch {}
}

function openAddFaq() {
  editingFaq.value = null
  faqForm.value = { question: '', answer: '', keywords: '' }
  showFaqDialog.value = true
}

function editFaq(row) {
  editingFaq.value = row
  faqForm.value = { question: row.question, answer: row.answer, keywords: row.keywords || '' }
  showFaqDialog.value = true
}

async function saveFaq() {
  if (!faqForm.value.question.trim()) {
    ElMessage.warning('请输入问题')
    return
  }
  if (!faqForm.value.answer.trim()) {
    ElMessage.warning('请输入回答')
    return
  }
  saving.value = true
  try {
    if (editingFaq.value) {
      await updateFaq(editingFaq.value.id, faqForm.value)
      editingFaq.value.question = faqForm.value.question
      editingFaq.value.answer = faqForm.value.answer
      editingFaq.value.keywords = faqForm.value.keywords
      ElMessage.success('FAQ已更新')
    } else {
      await createFaq(faqForm.value)
      await loadFaqs()
      ElMessage.success('FAQ已添加')
    }
    showFaqDialog.value = false
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteFaq(row) {
  try {
    await ElMessageBox.confirm(`确认删除FAQ"${row.question}"？`, '删除确认', { type: 'warning' })
    await deleteFaqApi(row.id)
    await loadFaqs()
    ElMessage.success('已删除')
  } catch {}
}

async function toggleFaq(row) {
  try {
    await updateFaq(row.id, { enabled: row.enabled })
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('切换失败')
  }
}

function openAddQuick() {
  editingQuick.value = null
  quickForm.value = { text: '', sort: quickQuestions.value.length + 1 }
  showQuickDialog.value = true
}

function editQuick(row) {
  editingQuick.value = row
  quickForm.value = { text: row.text, sort: row.sort }
  showQuickDialog.value = true
}

async function saveQuick() {
  if (!quickForm.value.text.trim()) {
    ElMessage.warning('请输入问题文本')
    return
  }
  saving.value = true
  try {
    if (editingQuick.value) {
      await updateQuickQuestion(editingQuick.value.id, quickForm.value)
      editingQuick.value.text = quickForm.value.text
      editingQuick.value.sort = quickForm.value.sort
      ElMessage.success('快捷问题已更新')
    } else {
      await createQuickQuestion(quickForm.value)
      await loadQuickQuestions()
      ElMessage.success('快捷问题已添加')
    }
    showQuickDialog.value = false
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteQuick(row) {
  try {
    await ElMessageBox.confirm(`确认删除快捷问题"${row.text}"？`, '删除确认', { type: 'warning' })
    await deleteQuickQuestion(row.id)
    await loadQuickQuestions()
    ElMessage.success('已删除')
  } catch {}
}

async function toggleQuick(row) {
  try {
    await updateQuickQuestion(row.id, { enabled: row.enabled })
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('切换失败')
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await saveServiceConfig(serviceSettings.value)
    ElMessage.success('设置已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadFaqs()
  loadQuickQuestions()
  loadSettings()
})
</script>

<style scoped>
.config-service { max-width: 1000px; margin: 0 auto; }
.config-service h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.config-section { background: #fff; border-radius: 12px; padding: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-desc { color: #909399; font-size: 13px; margin: 0; }

@media (max-width: 768px) {
  .config-service { padding: 12px; }
  .config-service h2 { font-size: 18px; }
  .section-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
