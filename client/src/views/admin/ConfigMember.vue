<template>
  <div class="page" v-loading="loading">
    <h2>会员配置</h2>
    <div class="tip-box">💡 修改后立即生效，请谨慎操作</div>

    <!-- 会员等级与费用 -->
    <div class="section-card">
      <div class="section-title-row">
        <span class="section-title">会员等级与费用</span>
        <el-button type="primary" size="small" @click="addLevel"><el-icon><Plus /></el-icon> 新增等级</el-button>
      </div>
      <p style="color:#909399;font-size:13px;margin:0 0 12px">设置各会员等级的名称、年费与有效期，详细权益在下方「权益类型配置」中统一管理</p>
      <el-table :data="levels" stripe border>
        <el-table-column prop="level" label="等级" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">Lv{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="会员名称" width="160">
          <template #default="{ row }">
            <el-input v-model="row.name" size="small" placeholder="请输入名称" maxlength="10" show-word-limit />
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="年费（元）" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.fee" :min="0" :precision="0" size="small" style="width:120px" />
          </template>
        </el-table-column>
        <el-table-column prop="validityPeriod" label="有效期" width="120" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.validityPeriod" :min="1" :max="60" size="small" style="width:70px" />
            <span style="font-size:11px;color:#909399;margin-left:2px">月</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button text type="danger" size="small" :disabled="levels.length <= 1" @click="deleteLevel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 自定义权益类型 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title-row">
        <span class="section-title">权益类型配置</span>
        <el-button type="primary" size="small" @click="openAddBenefit"><el-icon><Plus /></el-icon> 新增权益类型</el-button>
      </div>
      <p style="color:#909399;font-size:13px;margin:0 0 12px">可自定义权益类型，并为每个会员等级单独配置权益值；拖拽左侧把手可调整显示顺序</p>
      <el-table :data="benefits" stripe border row-key="id" ref="benefitTable">
        <el-table-column width="50" align="center">
          <template #default="{ row, $index }">
            <el-icon class="drag-handle" style="cursor:move;color:#909399" draggable="true"
              @dragstart="onDragStart($event, $index)"
              @dragend="onDragEnd"
              @dragover="onDragOver($event, $index)"><Rank /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="权益名称" width="160" />
        <el-table-column prop="desc" label="权益说明" min-width="180">
          <template #default="{ row }">
            <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="row.editing=false" />
            <span v-else style="color:#606266;font-size:13px">{{ row.desc }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="值类型" width="100" align="center">
          <template #default="{ row }"><el-tag :type="row.type==='数量'?'primary':row.type==='开关'?'success':'info'" size="small">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column v-for="lv in levels" :key="lv.level" :label="'Lv'+lv.level+' '+lv.name" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.type==='开关'">
              <el-switch v-model="row.values[lv.level-1]" size="small" />
            </template>
            <template v-else-if="row.type==='数量'">
              <el-input-number v-model="row.values[lv.level-1]" :min="0" size="small" style="width:80px" controls-position="right" />
            </template>
            <template v-else>
              <el-input v-model="row.values[lv.level-1]" size="small" style="width:90px" />
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteBenefit(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div style="margin-top:16px;text-align:right">
      <el-button type="primary" size="large" @click="saveConfig">保存全部配置</el-button>
    </div>

    <!-- 新增权益类型对话框 -->
    <el-dialog v-model="showAddBenefit" title="新增权益类型" width="480px">
      <el-form label-width="90px">
        <el-form-item label="权益名称" required>
          <el-input v-model="newBenefit.name" placeholder="如：专属客服、资源置顶次数" />
        </el-form-item>
        <el-form-item label="权益说明">
          <el-input v-model="newBenefit.desc" type="textarea" :rows="2" placeholder="简要说明该权益的含义" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-radio-group v-model="newBenefit.type">
            <el-radio label="开关">开关（是/否）</el-radio>
            <el-radio label="数量">数量（填数字）</el-radio>
            <el-radio label="文本">文本（自由填写）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="各等级默认值">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div v-for="lv in levels" :key="lv.level" style="text-align:center">
              <div style="font-size:11px;color:#909399;margin-bottom:4px">Lv{{ lv.level }}</div>
              <el-switch v-if="newBenefit.type==='开关'" v-model="newBenefit.defaults[lv.level-1]" size="small" />
              <el-input-number v-else-if="newBenefit.type==='数量'" v-model="newBenefit.defaults[lv.level-1]" :min="0" size="small" style="width:70px" controls-position="right" />
              <el-input v-else v-model="newBenefit.defaults[lv.level-1]" size="small" style="width:80px" />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddBenefit = false">取消</el-button>
        <el-button type="primary" @click="confirmAddBenefit">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Rank } from '@element-plus/icons-vue'
import { getMemberConfig, saveMemberConfig } from '@/api/admin'

const showAddBenefit = ref(false)
const loading = ref(false)
const benefitTable = ref(null)

const levels = reactive([
  { level: 1, name: '普通会员', fee: 99, validityPeriod: 3 },
  { level: 2, name: '银牌会员', fee: 999, validityPeriod: 12 },
  { level: 3, name: '金牌会员', fee: 2999, validityPeriod: 12 },
  { level: 4, name: '铂金会员', fee: 5999, validityPeriod: 12 },
  { level: 5, name: '钻石会员', fee: 12000, validityPeriod: 12 }
])

const benefits = reactive([
  { id: 1, name: '查看联系方式', desc: '可查看社区工作者联系方式', type: '开关', values: [false, false, true, true, true], editing: false },
  { id: 2, name: '月发起意向次数', desc: '每月可发起合作意向次数', type: '数量', values: [2, 10, 0, 0, 0], editing: false },
  { id: 3, name: '优先展示', desc: '资源在商家推荐区优先展示', type: '开关', values: [false, true, true, true, true], editing: false },
  { id: 4, name: '首页推荐', desc: '在平台首页获得推荐展示位', type: '开关', values: [false, false, false, true, true], editing: false },
  { id: 5, name: '年参与活动次数', desc: '每年可参与平台线下活动的次数', type: '数量', values: [0, 2, 5, 10, 0], editing: false },
  { id: 6, name: '专属客服', desc: '享有专属客服一对一服务', type: '开关', values: [false, false, false, true, true], editing: false },
  { id: 7, name: '资源置顶次数/月', desc: '每月可将自己发布的资源置顶展示的次数', type: '数量', values: [0, 1, 3, 10, 0], editing: false },
  { id: 8, name: '数据分析报告', desc: '可获取匹配效果、曝光数据等分析报告', type: '开关', values: [false, false, true, true, true], editing: false },
  { id: 9, name: '品牌故事展示', desc: '在平台首页轮播区展示品牌故事', type: '开关', values: [false, false, false, false, true], editing: false }
])

// 拖拽排序
let draggedIndex = null

function onDragStart(e, index) {
  draggedIndex = index
  e.dataTransfer.effectAllowed = 'move'
  e.target.closest('tr').style.opacity = '0.5'
}

function onDragEnd(e) {
  e.target.closest('tr').style.opacity = '1'
  draggedIndex = null
}

function onDragOver(e, index) {
  e.preventDefault()
  if (draggedIndex === null || draggedIndex === index) return
  const item = benefits.splice(draggedIndex, 1)[0]
  benefits.splice(index, 0, item)
  draggedIndex = index
}

const newBenefit = ref({ name: '', desc: '', type: '开关', defaults: levels.map(() => false) })

function addLevel() {
  const nextLevel = levels.length + 1
  levels.push({
    level: nextLevel,
    name: 'Lv' + nextLevel + '会员',
    fee: 0,
    validityPeriod: 12,
    editing: false
  })
  // 同步给 benefits 每个权益新增一列默认值
  benefits.forEach(b => { b.values.push(false) })
}

function deleteLevel(row) {
  if (levels.length <= 1) { ElMessage.warning('至少保留一个等级'); return }
  ElMessageBox.confirm(`确认删除等级「${row.name}」？此操作不可逆！`, '删除确认', { type: 'warning' })
    .then(() => {
      const idx = levels.indexOf(row)
      if (idx >= 0) {
        const removedLevel = idx + 1
        levels.splice(idx, 1)
        // 重新编号
        levels.forEach((l, i) => { l.level = i + 1 })
        // 同步删除 benefits 里对应列
        benefits.forEach(b => { b.values.splice(idx, 1) })
      }
    })
    .catch(() => {})
}

function openAddBenefit() {
  newBenefit.value = { name: '', desc: '', type: '开关', defaults: levels.map(() => false) }
  showAddBenefit.value = true
}

function confirmAddBenefit() {
  if (!newBenefit.value.name.trim()) { ElMessage.warning('请填写权益名称'); return }
  // 如果当前等级数与默认值数组长度不一致（新增等级后新增权益），补齐
  const defaults = [...newBenefit.value.defaults]
  while (defaults.length < levels.length) { defaults.push(false) }
  const newId = benefits.length > 0 ? Math.max(...benefits.map(b => b.id)) + 1 : 1
  benefits.push({
    id: newId,
    name: newBenefit.value.name,
    desc: newBenefit.value.desc,
    type: newBenefit.value.type,
    values: defaults,
    editing: false
  })
  showAddBenefit.value = false
  ElMessage.success('权益类型已添加')
}

function deleteBenefit(row) {
  ElMessageBox.confirm(`确认删除权益"${row.name}"？`, '删除确认', { type: 'warning' })
    .then(() => { const idx = benefits.indexOf(row); if (idx >= 0) benefits.splice(idx, 1); ElMessage.success('已删除') })
    .catch(() => {})
}

async function loadConfig() {
  loading.value = true
  try {
    const res = await getMemberConfig()
    const data = res.data || {}
    if (data.member_levels && data.member_levels.length > 0) {
      levels.splice(0, levels.length, ...data.member_levels.map(l => ({
        level: l.level,
        name: l.name || '',
        fee: l.fee || 0,
        validityPeriod: l.validity_period || 12,
        editing: false
      })))
    }
    if (data.member_benefits && data.member_benefits.length > 0) {
      benefits.splice(0, benefits.length, ...data.member_benefits.map((b, i) => ({
        id: b.id || i + 1,
        name: b.name, desc: b.desc || '', type: b.type || '开关',
        values: b.values || levels.map(() => false), editing: false
      })))
    }
  } catch {}
  finally { loading.value = false }
}

async function saveConfig() {
  try {
    loading.value = true
    await saveMemberConfig({ member_levels: levels.map(l => ({ level: l.level, name: l.name, fee: l.fee, validity_period: l.validityPeriod })), member_benefits: benefits.map(b => ({ name: b.name, desc: b.desc, type: b.type, values: b.values })) })
    ElMessage.success('会员配置已保存')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally { loading.value = false }
}

onMounted(() => { loadConfig() })
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.tip-box { background: #fff8e1; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; color: #E6A23C; font-size: 14px; }
.section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; display: block; }
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
</style>
