<template>
  <div class="batch-import">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>批量导入需求</h2>
    </div>

    <el-steps :active="importStep" finish-status="success" class="steps">
      <el-step title="下载模板" />
      <el-step title="上传文件" />
      <el-step title="确认数据" />
      <el-step title="提交审核" />
    </el-steps>

    <!-- 步骤1：下载模板 -->
    <div v-if="importStep === 0" class="step-content">
      <div class="guide-box">
        <h3>📋 批量导入使用说明</h3>
        <div class="guide-steps">
          <div class="guide-step">
            <div class="step-num">1</div>
            <div class="step-desc">
              <strong>下载Excel模板</strong>
              <p>点击下方按钮下载标准模板，模板内包含字段说明和示例数据</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">2</div>
            <div class="step-desc">
              <strong>填写需求数据</strong>
              <p>按照模板格式填写需求信息，每行代表一条需求</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">3</div>
            <div class="step-desc">
              <strong>上传文件</strong>
              <p>上传填写好的Excel文件，系统自动校验数据格式</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">4</div>
            <div class="step-desc">
              <strong>确认并提交</strong>
              <p>预览解析结果，确认无误后批量提交审核</p>
            </div>
          </div>
        </div>
      </div>

      <div class="template-cards">
        <div class="template-card" @click="downloadTemplate('activity')">
          <el-icon :size="40" color="#409EFF"><Calendar /></el-icon>
          <h4>活动赞助需求模板</h4>
          <p>包含活动名称、类型、时间、地点、赞助类型、商家回报等字段</p>
          <el-button type="primary" plain size="small">
            <el-icon><Download /></el-icon> 下载模板
          </el-button>
        </div>
        <div class="template-card" @click="downloadTemplate('expert')">
          <el-icon :size="40" color="#67C23A"><UserFilled /></el-icon>
          <h4>专家服务需求模板</h4>
          <p>包含专家类型、服务时间、频次、人数、资质要求等字段</p>
          <el-button type="success" plain size="small">
            <el-icon><Download /></el-icon> 下载模板
          </el-button>
        </div>
        <div class="template-card" @click="downloadTemplate('space')">
          <el-icon :size="40" color="#E6A23C"><OfficeBuilding /></el-icon>
          <h4>空间运营需求模板</h4>
          <p>包含空间名称、面积、设施、合作形式、商家回报等字段</p>
          <el-button type="warning" plain size="small">
            <el-icon><Download /></el-icon> 下载模板
          </el-button>
        </div>
      </div>
    </div>

    <!-- 步骤2：上传文件 -->
    <div v-if="importStep === 1" class="step-content">
      <div class="form-tip-box">💡 请使用下载的标准模板，确保字段格式正确，否则可能导致校验失败</div>

      <el-upload
        class="upload-area"
        drag
        accept=".xlsx,.xls,.csv"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload" :size="60"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将Excel文件拖拽到此处，或 <em>点击选择文件</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .xlsx / .xls / .csv 格式，文件大小不超过5MB，每次最多导入200条
          </div>
        </template>
      </el-upload>

      <div v-if="uploadedFile" class="file-info">
        <el-icon color="#67C23A"><SuccessFilled /></el-icon>
        <span>已选择：{{ uploadedFile.name }}</span>
        <el-button type="primary" @click="parseFile" :loading="parsing">
          {{ parsing ? '解析中...' : '开始解析' }}
        </el-button>
      </div>
    </div>

    <!-- 步骤3：确认数据 -->
    <div v-if="importStep === 2" class="step-content">
      <div class="parse-summary">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="summary-card total">
              <div class="num">{{ parseResult.total }}</div>
              <div class="label">共解析</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-card success">
              <div class="num">{{ parseResult.success }}</div>
              <div class="label">可导入</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-card error">
              <div class="num">{{ parseResult.error }}</div>
              <div class="label">有错误</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-card dup">
              <div class="num">{{ parseResult.duplicate }}</div>
              <div class="label">重复</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table :data="parseResult.data" stripe border max-height="400" class="preview-table">
        <el-table-column type="index" width="50" label="#" />
        <el-table-column prop="name" label="需求名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="90" />
        <el-table-column prop="startTime" label="时间" width="140" />
        <el-table-column prop="venue" label="地点" width="120" />
        <el-table-column prop="status" label="校验结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ok' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ok' ? '✓ 通过' : '✗ 错误' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error" label="错误信息" min-width="150">
          <template #default="{ row }">
            <span class="error-text" v-if="row.error">{{ row.error }}</span>
            <span class="ok-text" v-else>—</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="import-tip" v-if="parseResult.error > 0">
        <el-icon color="#E6A23C"><Warning /></el-icon>
        有 {{ parseResult.error }} 条数据存在错误，将只导入校验通过的 {{ parseResult.success }} 条。
        <el-button text type="primary" size="small">下载错误报告</el-button>
      </div>
    </div>

    <!-- 步骤4：提交结果 -->
    <div v-if="importStep === 3" class="step-content">
      <el-result
        icon="success"
        :title="`成功导入 ${parseResult.success} 条需求！`"
        sub-title="所有需求已进入审核队列，审核通过后将自动在平台发布并推送给匹配商家"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/community/demands')">查看我的需求</el-button>
          <el-button @click="resetImport">继续导入</el-button>
        </template>
      </el-result>
    </div>

    <!-- 导航按钮 -->
    <div class="step-actions" v-if="importStep < 3">
      <el-button v-if="importStep > 0" @click="importStep--" size="large">上一步</el-button>
      <el-button
        v-if="importStep === 0"
        type="primary" @click="importStep = 1" size="large"
      >已下载模板，开始上传</el-button>
      <el-button
        v-if="importStep === 2"
        type="success" @click="submitImport" size="large" :loading="submitting"
        :disabled="parseResult.success === 0"
      >导入 {{ parseResult.success }} 条需求</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Calendar, UserFilled, OfficeBuilding,
  Download, UploadFilled, SuccessFilled, Warning
} from '@element-plus/icons-vue'

const importStep = ref(0)
const uploadedFile = ref(null)
const parsing = ref(false)
const submitting = ref(false)

const parseResult = ref({
  total: 8, success: 6, error: 1, duplicate: 1,
  data: [
    { name: '六一儿童节亲子嘉年华', type: '活动赞助', startTime: '2026-06-01 09:00', venue: '户外广场', status: 'ok', error: '' },
    { name: '端午节包粽子活动', type: '活动赞助', startTime: '2026-06-02 14:00', venue: '活动中心', status: 'ok', error: '' },
    { name: '健康知识讲座', type: '专家服务', startTime: '2026-05-15 10:00', venue: '会议室', status: 'ok', error: '' },
    { name: '青少年法律普及', type: '专家服务', startTime: '2026-05-20 14:00', venue: '活动室', status: 'ok', error: '' },
    { name: '广场舞大赛', type: '活动赞助', startTime: '', venue: '南门广场', status: 'error', error: '活动时间为必填项' },
    { name: '社区文化节', type: '活动赞助', startTime: '2026-07-01 09:00', venue: '中心广场', status: 'ok', error: '' },
    { name: '暑期亲子运动会', type: '活动赞助', startTime: '2026-07-15 08:30', venue: '篮球场', status: 'ok', error: '' },
    { name: '六一儿童节亲子嘉年华', type: '活动赞助', startTime: '2026-06-01 09:00', venue: '户外广场', status: 'ok', error: '与第1行重复' }
  ]
})

function downloadTemplate(type) {
  const names = { activity: '活动赞助需求', expert: '专家服务需求', space: '空间运营需求' }
  ElMessage.success(`${names[type]}模板下载中...`)
}

function handleFileChange(file) {
  uploadedFile.value = file
}

async function parseFile() {
  parsing.value = true
  await new Promise(r => setTimeout(r, 2000))
  parsing.value = false
  importStep.value = 2
}

async function submitImport() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 1500))
  submitting.value = false
  importStep.value = 3
}

function resetImport() {
  importStep.value = 0
  uploadedFile.value = null
}
</script>

<style scoped>
.batch-import { max-width: 900px; margin: 0 auto; padding: 20px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.page-header h2 { flex: 1; margin: 0; font-size: 22px; font-weight: 700; }
.steps { margin-bottom: 32px; }
.step-content { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.form-tip-box { background: linear-gradient(135deg, #e8f4ff, #fff8e1); border: 1px solid #b3d4ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; color: #409EFF; font-size: 14px; }
.guide-box h3 { margin-bottom: 20px; }
.guide-steps { display: flex; flex-direction: column; gap: 16px; }
.guide-step { display: flex; align-items: flex-start; gap: 16px; }
.step-num { width: 32px; height: 32px; background: #409EFF; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
.step-desc strong { font-size: 15px; }
.step-desc p { margin: 4px 0 0; color: #909399; font-size: 13px; }
.template-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
.template-card { border: 1px solid #eee; border-radius: 12px; padding: 24px 16px; text-align: center; cursor: pointer; transition: all 0.2s; }
.template-card:hover { border-color: #409EFF; box-shadow: 0 4px 16px rgba(64,158,255,0.15); transform: translateY(-2px); }
.template-card h4 { margin: 12px 0 8px; }
.template-card p { font-size: 12px; color: #909399; margin-bottom: 16px; }
.upload-area { width: 100%; }
.file-info { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px; background: #f0fdf4; border-radius: 8px; }
.parse-summary { margin-bottom: 20px; }
.summary-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
.summary-card .num { font-size: 28px; font-weight: 700; }
.summary-card .label { font-size: 13px; color: #909399; margin-top: 4px; }
.summary-card.total .num { color: #409EFF; }
.summary-card.success .num { color: #67C23A; }
.summary-card.error .num { color: #F56C6C; }
.summary-card.dup .num { color: #E6A23C; }
.preview-table { margin-top: 16px; }
.error-text { color: #F56C6C; font-size: 12px; }
.ok-text { color: #C0C4CC; }
.import-tip { margin-top: 12px; display: flex; align-items: center; gap: 8px; color: #E6A23C; font-size: 13px; }
.step-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; padding-bottom: 40px; }

@media (max-width: 768px) {
  .template-cards { grid-template-columns: 1fr; }
}
</style>
