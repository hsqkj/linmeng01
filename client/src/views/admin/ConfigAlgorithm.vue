<template>
  <div class="page" v-loading="loading">
    <h2>匹配算法配置</h2>
    <div class="tip-box">⚙️ 调整各维度权重影响智能匹配结果，所有已启用维度的权重之和应为100%</div>
    <div class="total-weight" :class="totalWeight === 100 ? 'ok' : 'error'">
      当前权重总和：{{ totalWeight }}%（{{ totalWeight === 100 ? '✓ 正确' : '✗ 需调整为100%' }}）
    </div>
    <el-table :data="dimensions" stripe border>
      <el-table-column prop="name" label="匹配维度" min-width="150" />
      <el-table-column prop="description" label="说明" min-width="200" />
      <el-table-column prop="weight" label="权重（%）" width="180">
        <template #default="{ row }">
          <el-input-number v-model="row.weight" :min="0" :max="100" :step="5" size="small" style="width:120px" :disabled="!row.enabled" />
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="启用" width="80" align="center">
        <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
      </el-table-column>
    </el-table>

    <div style="margin-top:24px">
      <h3>其他匹配参数</h3>
      <el-form label-position="top" style="max-width:500px">
        <el-form-item label="匹配结果最大返回数量">
          <el-input-number v-model="maxResults" :min="5" :max="100" />
          <span style="margin-left:8px;color:#909399;font-size:13px">条</span>
        </el-form-item>
        <el-form-item label="匹配半径（仅限同城范围内）">
          <el-radio-group v-model="matchRadius">
            <el-radio label="street">同街道</el-radio>
            <el-radio label="district">同区</el-radio>
            <el-radio label="city">同城</el-radio>
            <el-radio label="all">不限</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveAlgorithm" :loading="saving">保存算法配置</el-button>
          <el-button @click="resetDefault" style="margin-left:12px">恢复默认</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAlgorithmConfig, saveAlgorithmConfig } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const maxResults = ref(20)
const matchRadius = ref('city')

const defaultDimensions = [
  { name: '地域匹配', key: 'region', weight: 25, enabled: true, description: '基于地图定位的距离计算' },
  { name: '类型匹配', key: 'type', weight: 20, enabled: true, description: '需求类型与资源类型对应度' },
  { name: '标签匹配', key: 'tag', weight: 15, enabled: true, description: '双方标签重合度' },
  { name: '社区画像匹配', key: 'community_profile', weight: 15, enabled: true, description: '户数、人群结构、设施等与商家目标客群匹配' },
  { name: '商家画像匹配', key: 'merchant_profile', weight: 10, enabled: true, description: '企业类型、服务范围与社区需求匹配' },
  { name: '语义匹配', key: 'semantic', weight: 10, enabled: true, description: 'NLP提取关键词，语义相似度计算' },
  { name: '信誉评分', key: 'reputation', weight: 5, enabled: true, description: '历史评价、成功率、响应速度' }
]

const dimensions = reactive([])

const totalWeight = computed(() => {
  return dimensions.filter(d => d.enabled).reduce((sum, d) => sum + (d.weight || 0), 0)
})

async function loadConfig() {
  loading.value = true
  try {
    const res = await getAlgorithmConfig()
    const data = res.data || {}
    if (data.dimensions && data.dimensions.length > 0) {
      dimensions.splice(0, dimensions.length, ...data.dimensions)
    } else {
      dimensions.splice(0, dimensions.length, ...defaultDimensions.map(d => ({ ...d })))
    }
    maxResults.value = data.maxResults || 20
    matchRadius.value = data.matchRadius || 'city'
  } catch {
    dimensions.splice(0, dimensions.length, ...defaultDimensions.map(d => ({ ...d })))
  } finally {
    loading.value = false
  }
}

async function saveAlgorithm() {
  if (totalWeight.value !== 100) {
    ElMessage.error('各维度权重之和必须为100%，请调整后保存')
    return
  }
  saving.value = true
  try {
    await saveAlgorithmConfig({
      dimensions: dimensions.map(d => ({
        name: d.name,
        key: d.key,
        weight: d.weight,
        enabled: d.enabled,
        description: d.description
      })),
      maxResults: maxResults.value,
      matchRadius: matchRadius.value
    })
    ElMessage.success('算法配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

function resetDefault() {
  dimensions.splice(0, dimensions.length, ...defaultDimensions.map(d => ({ ...d })))
  maxResults.value = 20
  matchRadius.value = 'city'
  ElMessage.success('已恢复默认配置')
}

onMounted(() => { loadConfig() })
</script>
<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.page h3 { font-size: 16px; margin-bottom: 16px; }
.tip-box { background: #f0f7ff; border-radius: 8px; padding: 10px 16px; margin-bottom: 12px; color: #409EFF; font-size: 14px; }
.total-weight { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
.total-weight.ok { background: #f0fff4; color: #67C23A; }
.total-weight.error { background: #fff5f5; color: #F56C6C; }
</style>
