<template>
  <div class="page" v-loading="loading">
    <h2>防飞单配置</h2>
    <div class="tip-box">💡 通过留言咨询绕过平台直接联系属于违规行为，以下配置用于防止此类行为发生</div>

    <!-- 留言内容过滤 -->
    <div class="section-card">
      <div class="section-title">留言内容自动过滤</div>
      <p style="color:#909399;font-size:13px;margin:0 0 16px">商家或社区在需求/资源详情页留言时，系统自动检测并过滤以下内容：</p>
      <el-form label-width="160px">
        <el-form-item label="过滤手机号码">
          <el-switch v-model="filterRules.phone" />
          <span style="margin-left:12px;color:#909399;font-size:13px">自动替换手机号格式（如138****1234）</span>
        </el-form-item>
        <el-form-item label="过滤微信号">
          <el-switch v-model="filterRules.wechat" />
          <span style="margin-left:12px;color:#909399;font-size:13px">自动过滤"微信""wechat""wx:"等关键词</span>
        </el-form-item>
        <el-form-item label="过滤QQ号">
          <el-switch v-model="filterRules.qq" />
          <span style="margin-left:12px;color:#909399;font-size:13px">自动过滤QQ号码格式</span>
        </el-form-item>
        <el-form-item label="过滤邮箱地址">
          <el-switch v-model="filterRules.email" />
          <span style="margin-left:12px;color:#909399;font-size:13px">自动过滤邮箱地址格式</span>
        </el-form-item>
        <el-form-item label="过滤网址链接">
          <el-switch v-model="filterRules.url" />
          <span style="margin-left:12px;color:#909399;font-size:13px">自动过滤http/https开头的网址</span>
        </el-form-item>
      </el-form>
    </div>

    <!-- 联系方式展示策略 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">联系方式展示策略</div>
      <p style="color:#909399;font-size:13px;margin:0 0 16px">社区或商家联系方式的展示规则，由会员权益统一控制，无需在此重复配置</p>
      <el-alert type="info" :closable="false">
        查看联系方式权限已在「会员配置 → 权益类型配置」中统一管理（金牌及以上会员默认开启）
      </el-alert>
    </div>

    <!-- 警告规则 -->
    <div class="section-card" style="margin-top:20px">
      <div class="section-title">飞单警告规则</div>
      <el-form label-width="160px">
        <el-form-item label="自动警告">
          <el-switch v-model="autoWarn" />
          <span style="margin-left:12px;color:#909399;font-size:13px">检测到疑似飞单行为时自动发送平台警告通知</span>
        </el-form-item>
        <el-form-item label="连续违规封禁">
          <el-switch v-model="autoBan" />
          <span style="margin-left:12px;color:#909399;font-size:13px">累计3次违规后自动封禁账号，需要管理员解封</span>
        </el-form-item>
      </el-form>
    </div>

    <div style="margin-top:24px;text-align:right">
      <el-button type="primary" size="large" @click="saveConfig" :loading="saving">保存配置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAntiFlyingConfig, saveAntiFlyingConfig } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)

const filterRules = reactive({
  phone: true,
  wechat: true,
  qq: true,
  email: false,
  url: false
})
const autoWarn = ref(true)
const autoBan = ref(true)

async function loadConfig() {
  loading.value = true
  try {
    const res = await getAntiFlyingConfig()
    const data = res.data || {}
    if (data.filterRules) {
      Object.assign(filterRules, data.filterRules)
    }
    autoWarn.value = data.autoWarn !== false
    autoBan.value = data.autoBan === true
  } catch {
    // 使用默认值
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await saveAntiFlyingConfig({
      filterRules: { ...filterRules },
      autoWarn: autoWarn.value,
      autoBan: autoBan.value
    })
    ElMessage.success('防飞单配置已保存')
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
