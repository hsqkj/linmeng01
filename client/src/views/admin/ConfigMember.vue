<template>
  <div class="page" v-loading="loading">
    <h2>会员配置</h2>
    <div class="tip-box">💡 修改后立即生效，请谨慎操作</div>

    <!-- 会员等级费用与核心权限 -->
    <div class="section-card">
      <div class="section-title">会员等级与费用</div>
      <el-table :data="levels" stripe border>
        <el-table-column prop="level" label="等级" width="60" align="center" />
        <el-table-column prop="name" label="名称" width="100" />
        <el-table-column prop="fee" label="年费（元）" width="130">
          <template #default="{ row }"><el-input-number v-model="row.fee" :min="0" size="small" style="width:110px" /></template>
        </el-table-column>
        <el-table-column prop="viewContact" label="查看联系方式" width="120" align="center">
          <template #default="{ row }"><el-switch v-model="row.viewContact" /></template>
        </el-table-column>
        <el-table-column prop="intentLimit" label="月发起意向" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.intentLimit" :min="0" size="small" style="width:90px" />
            <span style="font-size:11px;color:#909399;margin-left:2px">0=不限</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先展示" width="90" align="center">
          <template #default="{ row }"><el-switch v-model="row.priority" /></template>
        </el-table-column>
        <el-table-column prop="homepage" label="首页推荐" width="90" align="center">
          <template #default="{ row }"><el-switch v-model="row.homepage" /></template>
        </el-table-column>
        <el-table-column prop="activityCount" label="年参与活动" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.activityCount" :min="0" size="small" style="width:90px" />
            <span style="font-size:11px;color:#909399;margin-left:2px">0=不限</span>
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
      <p style="color:#909399;font-size:13px;margin:0 0 12px">可自定义权益类型，并为每个会员等级单独配置权益值</p>
      <el-table :data="benefits" stripe border>
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

    <!-- 防飞单配置 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">防飞单配置</div>
      <el-form label-width="200px">
        <el-form-item label="查看社区联系方式最低等级">
          <el-select v-model="minLevel" style="width:220px">
            <el-option v-for="l in levels" :key="l.level" :label="'Lv'+l.level+' '+l.name" :value="l.level" />
          </el-select>
          <el-tag type="warning" style="margin-left:12px" size="small">当前：Lv{{ minLevel }}（{{ levels[minLevel-1]?.name }}）及以上</el-tag>
        </el-form-item>
        <el-form-item label="留言内容自动过滤规则">
          <el-checkbox-group v-model="filterRules">
            <el-checkbox label="phone">过滤手机号码</el-checkbox>
            <el-checkbox label="wechat">过滤微信号</el-checkbox>
            <el-checkbox label="qq">过滤QQ号</el-checkbox>
            <el-checkbox label="email">过滤邮箱地址</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMemberConfig, saveMemberConfig } from '@/api/admin'

const minLevel = ref(3)
const filterRules = ref(['phone', 'wechat', 'qq'])
const showAddBenefit = ref(false)
const loading = ref(false)

const levels = reactive([
  { level: 1, name: '普通会员', fee: 0, viewContact: false, intentLimit: 5, priority: false, homepage: false, activityCount: 0 },
  { level: 2, name: '银牌会员', fee: 999, viewContact: false, intentLimit: 10, priority: true, homepage: false, activityCount: 2 },
  { level: 3, name: '金牌会员', fee: 2999, viewContact: true, intentLimit: 0, priority: true, homepage: false, activityCount: 5 },
  { level: 4, name: '铂金会员', fee: 5999, viewContact: true, intentLimit: 0, priority: true, homepage: true, activityCount: 10 },
  { level: 5, name: '钻石会员', fee: 12000, viewContact: true, intentLimit: 0, priority: true, homepage: true, activityCount: 999 }
])

const benefits = reactive([
  { name: '查看需求联系方式', desc: '可查看社区工作者联系方式', type: '开关', values: [false, false, true, true, true], editing: false },
  { name: '月发起意向上限', desc: '每月可对社区发起合作意向的次数（0=不限）', type: '数量', values: [5, 10, 0, 0, 0], editing: false },
  { name: '首页优先展示', desc: '资源在商家推荐区优先展示', type: '开关', values: [false, true, true, true, true], editing: false },
  { name: '年参与活动次数', desc: '每年可参与平台线下活动的次数', type: '数量', values: [0, 2, 5, 10, 0], editing: false },
  { name: '专属客服', desc: '享有专属客服一对一服务', type: '开关', values: [false, false, false, true, true], editing: false },
  { name: '资源置顶次数/月', desc: '每月可将自己发布的资源置顶展示的次数', type: '数量', values: [0, 1, 3, 10, 0], editing: false },
  { name: '数据分析报告', desc: '可获取匹配效果、曝光数据等分析报告', type: '开关', values: [false, false, true, true, true], editing: false },
  { name: '品牌故事展示', desc: '在平台首页轮播区展示品牌故事', type: '开关', values: [false, false, false, false, true], editing: false }
])

const newBenefit = ref({ name: '', desc: '', type: '开关', defaults: [false, false, false, false, false] })

function openAddBenefit() {
  newBenefit.value = { name: '', desc: '', type: '开关', defaults: [false, false, false, false, false] }
  showAddBenefit.value = true
}

function confirmAddBenefit() {
  if (!newBenefit.value.name.trim()) { ElMessage.warning('请填写权益名称'); return }
  benefits.push({
    name: newBenefit.value.name,
    desc: newBenefit.value.desc,
    type: newBenefit.value.type,
    values: [...newBenefit.value.defaults],
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
        level: l.level, name: l.name || levels[l.level - 1]?.name || '',
        fee: l.fee, viewContact: !!l.view_contact, intentLimit: l.intent_limit,
        priority: !!l.priority, homepage: !!l.homepage, activityCount: l.activity_count,
        editing: false
      })))
    }
    if (data.member_benefits && data.member_benefits.length > 0) {
      benefits.splice(0, benefits.length, ...data.member_benefits.map(b => ({
        name: b.name, desc: b.desc || '', type: b.type || '开关',
        values: b.values || [false, false, false, false, false], editing: false
      })))
    }
  } catch {}
  finally { loading.value = false }
}

async function saveConfig() {
  try {
    loading.value = true
    await saveMemberConfig({ member_levels: levels.map(l => ({ level: l.level, name: l.name, fee: l.fee, view_contact: l.viewContact, intent_limit: l.intentLimit, priority: l.priority, homepage: l.homepage, activity_count: l.activityCount })), member_benefits: benefits.map(b => ({ name: b.name, desc: b.desc, type: b.type, values: b.values })) })
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
