<template>
  <div class="page">
    <h2>商家评级标准配置</h2>
    <div class="tip-box">💡 配置商家五星评级的评定标准，影响平台对商家的综合评级管理</div>

    <div class="section-card">
      <div class="section-title-row">
        <span class="section-title">评级维度权重配置</span>
        <el-button type="primary" @click="addDimension"><el-icon><Plus /></el-icon> 新增维度</el-button>
      </div>
      <p class="desc-text">设置各维度的权重比例，总和须为100%，系统将根据加权得分计算最终评级</p>
      
      <el-table :data="dimensions" stripe border>
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="维度名称" width="150">
          <template #default="{ row, $index }">
            <el-input v-if="row.editing" v-model="row.name" size="small" />
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200">
          <template #default="{ row, $index }">
            <el-input v-if="row.editing" v-model="row.description" size="small" />
            <span v-else>{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重(%)" width="120">
          <template #default="{ row, $index }">
            <el-input-number v-if="row.editing" v-model="row.weight" :min="0" :max="100" size="small" style="width:80px" />
            <span v-else>{{ row.weight }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="criteria" label="评分标准" min-width="250">
          <template #default="{ row }">
            <span class="criteria-text">{{ row.criteria }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row, $index }">
            <el-button v-if="!row.editing" text type="primary" size="small" @click="editDimension(row)">编辑</el-button>
            <el-button v-else text type="success" size="small" @click="saveDimension(row, $index)">保存</el-button>
            <el-button v-if="row.editing" text type="info" size="small" @click="cancelEdit(row, $index)">取消</el-button>
            <el-button v-else text type="danger" size="small" @click="deleteDimension($index)" :disabled="row.isDefault">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="weight-summary">
        <span>权重总和：<strong :class="{ 'weight-error': totalWeight !== 100 }">{{ totalWeight }}%</strong></span>
        <el-button v-if="totalWeight !== 100" type="warning" size="small" @click="normalizeWeight">自动调整为100%</el-button>
      </div>
    </div>

    <div class="section-card" style="margin-top:20px">
      <div class="section-title">星级评定规则</div>
      <p class="desc-text">设置各星级对应的得分区间，商家综合得分达到对应区间即可获得相应评级</p>
      
      <el-table :data="ratingRules" stripe border>
        <el-table-column prop="stars" label="星级" width="120" align="center">
          <template #default="{ row }">
            <div class="stars-display">
              <span v-for="n in row.stars" :key="n" class="star filled">★</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="minScore" label="最低得分" width="150">
          <template #default="{ row, $index }">
            <el-input-number v-if="row.editing" v-model="row.minScore" :min="0" :max="100" size="small" style="width:100px" />
            <span v-else>{{ row.minScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="maxScore" label="最高得分" width="150">
          <template #default="{ row, $index }">
            <el-input-number v-if="row.editing" v-model="row.maxScore" :min="0" :max="100" size="small" style="width:100px" />
            <span v-else>{{ row.maxScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="等级说明" min-width="200">
          <template #default="{ row, $index }">
            <el-input v-if="row.editing" v-model="row.description" size="small" />
            <span v-else>{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row, $index }">
            <el-button v-if="!row.editing" text type="primary" size="small" @click="editRule(row)">编辑</el-button>
            <el-button v-else text type="success" size="small" @click="saveRule(row, $index)">保存</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="section-card" style="margin-top:20px">
      <div class="section-title">评定指标细则</div>
      <p class="desc-text">配置各维度下的具体评分指标和评分规则</p>
      
      <el-collapse v-model="activeCollapse">
        <el-collapse-item v-for="dim in dimensions" :key="dim.key" :title="dim.name" :name="dim.key">
          <div class="criteria-list">
            <div class="criteria-item" v-for="(c, idx) in dim.items" :key="idx">
              <span class="criteria-name">{{ c.name }}</span>
              <span class="criteria-score">满分 {{ c.maxScore }} 分</span>
              <el-tag size="small" type="info">{{ c.type === 'auto' ? '自动评分' : '人工评定' }}</el-tag>
            </div>
          </div>
          <el-button size="small" type="primary" plain @click="addCriteria(dim)" style="margin-top:10px">
            <el-icon><Plus /></el-icon> 添加评分项
          </el-button>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="action-bar">
      <el-button type="primary" size="large" @click="saveAll">保存配置</el-button>
      <el-button size="large" @click="resetToDefault">恢复默认设置</el-button>
    </div>

    <!-- 新增维度对话框 -->
    <el-dialog v-model="showDimensionDialog" title="新增评级维度" width="480px">
      <el-form :model="newDimension" label-width="100px">
        <el-form-item label="维度名称" required>
          <el-input v-model="newDimension.name" placeholder="如：服务质量、响应速度等" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="newDimension.description" type="textarea" :rows="2" placeholder="简要描述该维度的含义" />
        </el-form-item>
        <el-form-item label="权重" required>
          <el-input-number v-model="newDimension.weight" :min="0" :max="100" /> %
        </el-form-item>
        <el-form-item label="评分标准">
          <el-input v-model="newDimension.criteria" type="textarea" :rows="2" placeholder="描述该维度的评分依据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDimensionDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDimension">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { saveRatingConfig } from '@/api/admin'

const showDimensionDialog = ref(false)
const activeCollapse = ref(['quality', 'response', 'activity', 'cooperation'])

const newDimension = ref({ name: '', description: '', weight: 0, criteria: '' })

const dimensions = reactive([
  { 
    key: 'quality', 
    name: '服务质量', 
    description: '商家提供服务的专业性和用户满意度', 
    weight: 30, 
    criteria: '根据用户评价平均分和服务完成度计算',
    isDefault: true,
    editing: false,
    items: [
      { name: '用户好评率', maxScore: 30, type: 'auto' },
      { name: '服务完成率', maxScore: 20, type: 'auto' },
      { name: '投诉率', maxScore: 15, type: 'auto' },
      { name: '人工评定', maxScore: 35, type: 'manual' }
    ]
  },
  { 
    key: 'response', 
    name: '响应速度', 
    description: '商家对需求和咨询的响应及时程度', 
    weight: 20, 
    criteria: '根据平均响应时间和响应率计算',
    isDefault: true,
    editing: false,
    items: [
      { name: '平均响应时间', maxScore: 40, type: 'auto' },
      { name: '响应率', maxScore: 30, type: 'auto' },
      { name: '人工评定', maxScore: 30, type: 'manual' }
    ]
  },
  { 
    key: 'activity', 
    name: '活跃程度', 
    description: '商家在平台的活跃频率和资源发布情况', 
    weight: 25, 
    criteria: '根据登录频率、资源发布数量计算',
    isDefault: true,
    editing: false,
    items: [
      { name: '月登录次数', maxScore: 25, type: 'auto' },
      { name: '资源发布数', maxScore: 35, type: 'auto' },
      { name: '信息完整度', maxScore: 20, type: 'auto' },
      { name: '人工评定', maxScore: 20, type: 'manual' }
    ]
  },
  { 
    key: 'cooperation', 
    name: '合作表现', 
    description: '商家与社区合作的履约情况和贡献度', 
    weight: 25, 
    criteria: '根据撮合成功率、履约率、物资贡献等计算',
    isDefault: true,
    editing: false,
    items: [
      { name: '撮合成功率', maxScore: 35, type: 'auto' },
      { name: '履约率', maxScore: 30, type: 'auto' },
      { name: '物资贡献额', maxScore: 20, type: 'auto' },
      { name: '人工评定', maxScore: 15, type: 'manual' }
    ]
  }
])

const ratingRules = reactive([
  { stars: 5, minScore: 90, maxScore: 100, description: '金牌商家，综合表现卓越', editing: false },
  { stars: 4, minScore: 75, maxScore: 89, description: '优质商家，综合表现良好', editing: false },
  { stars: 3, minScore: 60, maxScore: 74, description: '合格商家，满足基本要求', editing: false },
  { stars: 2, minScore: 40, maxScore: 59, description: '一般商家，需要改进提升', editing: false },
  { stars: 1, minScore: 0, maxScore: 39, description: '待改进商家，需要重点扶持或淘汰', editing: false }
])

const totalWeight = computed(() => dimensions.reduce((sum, d) => sum + d.weight, 0))

function editDimension(row) {
  row._backup = { ...row }
  row.editing = true
}

function saveDimension(row, index) {
  if (!row.name.trim()) { ElMessage.warning('维度名称不能为空'); return }
  row.editing = false
  delete row._backup
  ElMessage.success('维度已保存')
}

function cancelEdit(row, index) {
  if (row._backup) {
    Object.assign(row, row._backup)
    delete row._backup
  }
  row.editing = false
}

function deleteDimension(index) {
  const dim = dimensions[index]
  if (dim.isDefault) {
    ElMessage.warning('默认维度不可删除')
    return
  }
  ElMessageBox.confirm('确认删除该维度？删除后相关评分将重新分配。', '删除确认', { type: 'warning' })
    .then(() => {
      dimensions.splice(index, 1)
      ElMessage.success('维度已删除')
    }).catch(() => {})
}

function addDimension() {
  newDimension.value = { name: '', description: '', weight: 0, criteria: '' }
  showDimensionDialog.value = true
}

function confirmAddDimension() {
  if (!newDimension.value.name.trim()) { ElMessage.warning('请填写维度名称'); return }
  if (newDimension.value.weight <= 0) { ElMessage.warning('权重须大于0'); return }
  dimensions.push({
    key: 'dim_' + Date.now(),
    name: newDimension.value.name,
    description: newDimension.value.description,
    weight: newDimension.value.weight,
    criteria: newDimension.value.criteria,
    isDefault: false,
    editing: false,
    items: []
  })
  showDimensionDialog.value = false
  ElMessage.success('维度已添加')
}

function normalizeWeight() {
  const total = dimensions.reduce((sum, d) => sum + d.weight, 0)
  if (total === 0) return
  const factor = 100 / total
  dimensions.forEach(d => {
    d.weight = Math.round(d.weight * factor)
  })
  ElMessage.success('权重已自动调整为100%')
}

function editRule(row) {
  row._backup = { ...row }
  row.editing = true
}

function saveRule(row, index) {
  if (row.minScore > row.maxScore) {
    ElMessage.warning('最低得分不能大于最高得分')
    return
  }
  row.editing = false
  delete row._backup
  ElMessage.success('评定规则已保存')
}

function addCriteria(dim) {
  ElMessage.info('评分项编辑功能开发中...')
}

async function saveAll() {
  if (totalWeight.value !== 100) {
    ElMessage.warning('权重总和必须为100%')
    return
  }
  try {
    await saveRatingConfig({
      dimensions: dimensions.map(d => ({ name: d.name, description: d.description, weight: d.weight, criteria: d.criteria })),
      starRules: ratingRules.map(r => ({ star: r.stars, minScore: r.minScore, maxScore: r.maxScore, description: r.description }))
    })
    ElMessage.success('评级标准配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}

function resetToDefault() {
  ElMessageBox.confirm('确认恢复默认设置？当前修改将被丢弃。', '恢复确认', { type: 'warning' })
    .then(() => {
      ElMessage.success('已恢复默认设置')
    }).catch(() => {})
}
</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #f0f9ff; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #409EFF; font-size: 14px; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.desc-text { color: #909399; font-size: 13px; margin-bottom: 12px; }
.weight-summary { margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; }
.weight-error { color: #f56c6c; }
.stars-display { display: inline-flex; gap: 2px; }
.star { color: #dcdfe6; font-size: 14px; }
.star.filled { color: #f56c6c; }
.criteria-text { font-size: 13px; color: #606266; }
.criteria-list { display: flex; flex-direction: column; gap: 8px; }
.criteria-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f7fa; border-radius: 6px; }
.criteria-name { flex: 1; }
.criteria-score { color: #909399; font-size: 13px; }
.action-bar { margin-top: 24px; display: flex; gap: 12px; justify-content: center; }
</style>
