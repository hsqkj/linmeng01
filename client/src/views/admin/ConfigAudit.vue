<template>
  <div class="page" v-loading="loading">
    <h2>内容审核机制设置</h2>
    <div class="tip-box">💡 配置AI自动审核规则，商家发布需求/资源时的审核流程与阈值设置</div>

    <!-- 审核总开关 -->
    <div class="section-card">
      <div class="section-title-row">
        <span class="section-title">AI审核开关</span>
        <el-switch v-model="config.enabled" @change="handleEnabledChange" />
      </div>
      <p style="color:#909399;font-size:13px;margin:0">
        开启后，商家发布需求/资源将先经过AI预审，再决定是否转人工复审
      </p>
    </div>

    <!-- 审核场景配置 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">分场景配置</div>
      <el-table :data="scenes" stripe border>
        <el-table-column prop="name" label="审核场景" width="130" />
        <el-table-column prop="desc" label="说明" min-width="160" />
        <el-table-column label="启用" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" :disabled="!config.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="AI通过后自动通过" width="150" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.autoPass" :disabled="!config.enabled || !row.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="AI拒绝后自动拒绝" width="150" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.autoReject" :disabled="!config.enabled || !row.enabled" />
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="风险阈值" width="120" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.threshold"
              :min="0"
              :max="100"
              :step="5"
              size="small"
              style="width:80px"
              :disabled="!config.enabled || !row.enabled"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- AI服务配置 -->
    <div class="section-card" style="margin-top:20px" v-if="config.enabled">
      <div class="section-title">AI服务配置</div>
      <el-form label-position="top" style="max-width:600px">
        <el-form-item label="AI服务提供商">
          <el-select v-model="config.provider" style="width:100%">
            <el-option label="模拟模式（仅测试用）" value="simulated" />
            <el-option label="腾讯云内容安全" value="tencent" />
            <el-option label="阿里云内容安全" value="aliyun" />
          </el-select>
        </el-form-item>
        <el-form-item label="敏感词检测">
          <el-switch v-model="config.sensitiveDetection" />
          <span style="margin-left:12px;color:#909399;font-size:13px">检测政治敏感、色情低俗、暴力恐怖等内容</span>
        </el-form-item>
        <el-form-item label="联系方式检测">
          <el-switch v-model="config.contactDetection" />
          <span style="margin-left:12px;font-size:13px;color:#909399">自动检测并标记需求/资源中包含手机号、微信号等内容</span>
        </el-form-item>
        <el-form-item label="违禁品类检测">
          <el-switch v-model="config.bannedCategoryDetection" />
          <span style="margin-left:12px;font-size:13px;color:#909399">检测平台禁止的行业或商品</span>
        </el-form-item>
        <el-form-item label="内容质量评估">
          <el-switch v-model="config.qualityCheck" />
          <span style="margin-left:12px;font-size:13px;color:#909399">评估标题描述完整性、图片清晰度</span>
        </el-form-item>
      </el-form>
    </div>

    <!-- 审核阈值说明 -->
    <div class="section-card" style="margin-top:20px" v-if="config.enabled">
      <div class="section-title">风险分计算规则</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="敏感词检测">触发时 +30分/项</el-descriptions-item>
        <el-descriptions-item label="联系方式检测">触发时 +20分</el-descriptions-item>
        <el-descriptions-item label="违禁品类">触发时 +40分</el-descriptions-item>
        <el-descriptions-item label="内容过短（&lt;10字）">触发时 +15分</el-descriptions-item>
        <el-descriptions-item label="自动通过阈值" :span="2">风险分 &lt; {{ autoPassThreshold }} → 自动通过</el-descriptions-item>
        <el-descriptions-item label="自动拒绝阈值" :span="2">风险分 &gt; {{ autoRejectThreshold }} → 自动拒绝</el-descriptions-item>
      </el-descriptions>
    </div>

    <div style="margin-top:24px;text-align:right">
      <el-button type="primary" size="large" @click="saveConfig" :loading="saving">保存配置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAuditConfig, saveAuditConfig } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)

const config = reactive({
  enabled: false,
  provider: 'simulated',
  sensitiveDetection: true,
  contactDetection: true,
  bannedCategoryDetection: false,
  qualityCheck: false
})

const scenes = reactive([
  { name: '需求审核', key: 'demand', desc: '商家发布的合作需求', enabled: true, autoPass: false, autoReject: false, threshold: 80 },
  { name: '资源审核', key: 'resource', desc: '商家发布的服务资源', enabled: true, autoPass: false, autoReject: false, threshold: 80 },
  { name: '留言审核', key: 'comment', desc: '社区/商家留言内容', enabled: false, autoPass: false, autoReject: false, threshold: 60 }
])

const autoPassThreshold = computed(() => {
  const thresholds = scenes.filter(s => s.enabled && s.autoPass).map(s => s.threshold)
  return thresholds.length > 0 ? Math.min(...thresholds) : 20
})

const autoRejectThreshold = computed(() => {
  const thresholds = scenes.filter(s => s.enabled && s.autoReject).map(s => s.threshold)
  return thresholds.length > 0 ? Math.max(...thresholds) : 80
})

function handleEnabledChange(val) {
  if (!val) {
    scenes.forEach(s => { s.enabled = false; s.autoPass = false; s.autoReject = false })
  }
}

async function loadConfig() {
  loading.value = true
  try {
    const res = await getAuditConfig()
    const data = res.data || {}
    if (data.enabled !== undefined) config.enabled = data.enabled
    if (data.provider) config.provider = data.provider
    if (data.sensitiveDetection !== undefined) config.sensitiveDetection = data.sensitiveDetection
    if (data.contactDetection !== undefined) config.contactDetection = data.contactDetection
    if (data.bannedCategoryDetection !== undefined) config.bannedCategoryDetection = data.bannedCategoryDetection
    if (data.qualityCheck !== undefined) config.qualityCheck = data.qualityCheck
    if (data.scenes && data.scenes.length > 0) {
      data.scenes.forEach(s => {
        const scene = scenes.find(sc => sc.key === s.key)
        if (scene) {
          scene.enabled = s.enabled
          scene.autoPass = s.autoPass
          scene.autoReject = s.autoReject
          scene.threshold = s.threshold
        }
      })
    }
  } catch {
    // 使用默认值
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await saveAuditConfig({
      ...config,
      scenes: scenes.map(s => ({ key: s.key, enabled: s.enabled, autoPass: s.autoPass, autoReject: s.autoReject, threshold: s.threshold }))
    })
    ElMessage.success('内容审核机制配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
