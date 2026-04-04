<template>
  <div class="page" v-loading="loading">
    <h2>撮合奖励配置</h2>

    <!-- 奖励说明卡片 -->
    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #title>
        <strong>撮合奖励说明</strong>：当社区发布的需求与商家发布的资源成功撮合后（双方确认合作意向），平台将给予社区一定的物资或现金奖励，激励社区积极获取资源支持。
      </template>
    </el-alert>

    <!-- 基本奖励配置 -->
    <div class="config-card">
      <h3>奖励基本设置</h3>
      <el-form :model="form" label-width="140px" style="max-width: 600px">
        <el-form-item label="单笔奖励金额">
          <el-input-number
            v-model="form.rewardValue"
            :min="0"
            :max="10000"
            :step="50"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
          <div class="form-tip">每次成功撮合后发放的物资价值（现金折算）</div>
        </el-form-item>

        <el-form-item label="奖励说明">
          <el-input
            v-model="form.rewardDesc"
            type="textarea"
            :rows="2"
            placeholder="如：撮合成功奖励物资（价值约200元）"
            style="width: 400px"
          />
        </el-form-item>

        <el-form-item label="奖励类型">
          <el-radio-group v-model="form.rewardType">
            <el-radio value="material">物资奖励</el-radio>
            <el-radio value="cash">现金奖励</el-radio>
            <el-radio value="both">物资+现金</el-radio>
          </el-radio-group>
          <div class="form-tip">奖励的发放形式</div>
        </el-form-item>

        <el-form-item label="是否启用奖励">
          <el-switch v-model="form.enabled" />
          <div class="form-tip">关闭后新撮合不再产生奖励记录</div>
        </el-form-item>

        <el-form-item label="奖励发放方式">
          <el-select v-model="form.deliveryMethod" style="width: 300px">
            <el-option value="auto" label="自动发放（撮合成功即时生成）" />
            <el-option value="manual" label="手动审核发放" />
            <el-option value="monthly" label="每月集中发放" />
          </el-select>
          <div class="form-tip">奖励的发放审核方式</div>
        </el-form-item>

        <el-form-item label="每月奖励上限">
          <el-input-number
            v-model="form.monthlyLimit"
            :min="0"
            :max="1000"
            :step="5"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399">笔/月</span>
          <div class="form-tip">0表示不限制</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 等级奖励倍数 -->
    <div class="config-card">
      <h3>会员等级奖励倍数</h3>
      <p class="card-desc">根据社区会员等级设置奖励发放倍数</p>
      <el-table :data="levelBonus" stripe border style="max-width: 500px">
        <el-table-column prop="level" label="会员等级" width="120" />
        <el-table-column prop="name" label="等级名称" width="120" />
        <el-table-column label="奖励倍数" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.bonus"
              :min="0.5"
              :max="3"
              :step="0.1"
              :precision="1"
              controls-position="right"
              size="small"
              style="width: 120px"
            />
            <span style="margin-left: 8px">倍</span>
          </template>
        </el-table-column>
        <el-table-column label="预估奖励" width="120">
          <template #default="{ row }">
            <span style="color: #67C23A; font-weight: 600">
              ¥{{ (form.rewardValue * row.bonus).toFixed(0) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 特殊条件奖励 -->
    <div class="config-card">
      <h3>特殊条件奖励</h3>
      <el-form :model="form" label-width="160px" style="max-width: 700px">
        <el-form-item label="首单额外奖励">
          <el-input-number
            v-model="form.firstOrderBonus"
            :min="0"
            :max="1000"
            :step="10"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
          <div class="form-tip">社区首笔成功撮合额外奖励（一次性）</div>
        </el-form-item>

        <el-form-item label="连续撮合奖励">
          <el-input-number
            v-model="form.streakBonus"
            :min="0"
            :max="500"
            :step="10"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
          <div class="form-tip">连续3个月有撮合记录时每月额外奖励</div>
        </el-form-item>

        <el-form-item label="高质量撮合奖励">
          <el-input-number
            v-model="form.highQualityBonus"
            :min="0"
            :max="500"
            :step="10"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
          <div class="form-tip">匹配度超过90%的撮合额外奖励</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 近期奖励记录 -->
    <div class="config-card">
      <h3>近期撮合奖励记录</h3>
      <el-table :data="rewardRecords" stripe border v-loading="recordsLoading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="社区" min-width="150">
          <template #default="{ row }">
            <span>{{ row.community_name || '社区' + row.community_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reward_value" label="奖励金额" width="100">
          <template #default="{ row }">
            <span style="color: #67C23A; font-weight: 600">¥{{ row.reward_value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reward_content" label="奖励内容" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'" size="small">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="生成时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!recordsLoading && rewardRecords.length === 0" description="暂无奖励记录" :image-size="60" />
    </div>

    <!-- 保存按钮 -->
    <div class="save-bar">
      <el-button @click="loadData">重置</el-button>
      <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRewardConfig, saveRewardConfig } from '@/api/admin'
import { getRewardRecords } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const recordsLoading = ref(false)
const statusText = { 0: '待发放', 1: '已发放', 2: '已失效' }

const form = reactive({
  rewardValue: 200,
  rewardDesc: '撮合成功奖励物资（价值约200元）',
  rewardType: 'material',
  enabled: true,
  deliveryMethod: 'auto',
  monthlyLimit: 0,
  firstOrderBonus: 50,
  streakBonus: 100,
  highQualityBonus: 30
})

const levelBonus = ref([
  { level: 1, name: '普通会员', bonus: 1.0 },
  { level: 2, name: '银牌会员', bonus: 1.2 },
  { level: 3, name: '金牌会员', bonus: 1.5 },
  { level: 4, name: '铂金会员', bonus: 1.8 },
  { level: 5, name: '钻石会员', bonus: 2.0 }
])

const rewardRecords = ref([])

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadData() {
  loading.value = true
  try {
    const res = await getRewardConfig()
    if (res.data) {
      const data = res.data
      form.rewardValue = data.rewardValue || 200
      form.rewardDesc = data.rewardDesc || '撮合成功奖励物资（价值约200元）'
      form.rewardType = data.rewardType || 'material'
      form.enabled = data.enabled !== false
      form.deliveryMethod = data.deliveryMethod || 'auto'
      form.monthlyLimit = data.monthlyLimit || 0
      form.firstOrderBonus = data.firstOrderBonus || 50
      form.streakBonus = data.streakBonus || 100
      form.highQualityBonus = data.highQualityBonus || 30

      if (data.levelBonus && Array.isArray(data.levelBonus)) {
        data.levelBonus.forEach(b => {
          const item = levelBonus.value.find(l => l.level === b.level)
          if (item) item.bonus = b.bonus
        })
      }
    }
  } catch {
    // Use defaults
  } finally {
    loading.value = false
  }

  // Load recent records
  recordsLoading.value = true
  try {
    const res = await getRewardRecords({ page: 1, pageSize: 10 })
    rewardRecords.value = res.data?.list || []
  } catch {
    rewardRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await saveRewardConfig({
      rewardValue: form.rewardValue,
      rewardDesc: form.rewardDesc,
      rewardType: form.rewardType,
      enabled: form.enabled,
      deliveryMethod: form.deliveryMethod,
      monthlyLimit: form.monthlyLimit,
      firstOrderBonus: form.firstOrderBonus,
      streakBonus: form.streakBonus,
      highQualityBonus: form.highQualityBonus,
      levelBonus: levelBonus.value.map(l => ({ level: l.level, bonus: l.bonus }))
    })
    ElMessage.success('配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding-bottom: 100px; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }

.config-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.config-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-desc {
  color: #909399;
  font-size: 13px;
  margin: -8px 0 16px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.save-bar {
  position: fixed;
  bottom: 0;
  left: 200px;
  right: 0;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #EBEEF5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  z-index: 100;
}

@media (max-width: 768px) {
  .save-bar {
    left: 0;
    bottom: 60px;
  }
}
</style>
