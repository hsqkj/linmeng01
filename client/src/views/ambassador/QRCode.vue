<template>
  <div class="qrcode-page" v-loading="loading">
    <h2>我的渠道码</h2>

    <!-- 审核中提示 -->
    <div v-if="homeData.status !== 1" class="pending-tip">
      <el-result
        icon="warning"
        title="资料审核中"
        sub-title="您的资料正在审核中，审核通过后将显示渠道码和专属链接"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/ambassador')">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <!-- 审核通过后显示渠道码 -->
    <div v-else class="qrcode-layout">
      <div class="qrcode-card">
        <div class="qr-header">
          <div class="logo-sm">邻</div>
          <div>
            <div class="brand-nm">邻盟招商大使</div>
            <div class="amb-nm">{{ qrData.ambassador_name || '' }} 专属渠道</div>
          </div>
        </div>
        <div class="qr-body">
          <div class="qr-image">
            <canvas ref="qrCanvas"></canvas>
          </div>
          <div class="qr-code-text">{{ qrData.qr_code || '' }}</div>
        </div>
      </div>
      <div class="qrcode-actions">
        <h3>分享给商家</h3>
        <div class="action-btns">
          <el-button type="warning" size="large" @click="downloadQR">
            <el-icon><Download /></el-icon> 下载二维码图片
          </el-button>
          <el-button type="primary" size="large" @click="copyLink">
            <el-icon><CopyDocument /></el-icon> 复制注册链接
          </el-button>
        </div>
        <div class="link-box">
          <div class="link-label">专属注册链接：</div>
          <div class="link-text">{{ qrData.register_url || '' }}</div>
        </div>
        <div class="tips-box">
          <h4>📌 使用提示</h4>
          <ul>
            <li>将二维码分享给商家，商家扫码后即可进入您的专属注册页面</li>
            <li>商家注册并缴纳会费后，系统自动计算您的提成</li>
            <li>绑定关系永久有效，商家每次续费您都能获得续费提成</li>
            <li>提成每月1日自动结算，满100元可申请提现</li>
          </ul>
        </div>
        <div class="stats-mini">
          <div class="mini-stat">
            <div class="ms-val">{{ homeData.total_merchants || 0 }}</div>
            <div class="ms-lab">累计发展</div>
          </div>
          <div class="mini-stat">
            <div class="ms-val">{{ Number(homeData.total_commission || 0).toLocaleString() }}</div>
            <div class="ms-lab">累计提成</div>
          </div>
          <div class="mini-stat">
            <div class="ms-val">{{ Number(homeData.pending_commission || 0).toLocaleString() }}</div>
            <div class="ms-lab">待结算</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import { ElMessage } from "element-plus"
import { Download, CopyDocument } from "@element-plus/icons-vue"
import { getQrCode, getHomeData } from "@/api/ambassador"
import QRCode from "qrcode"

const qrData = ref({})
const homeData = ref({})
const loading = ref(false)
const qrCanvas = ref(null)

async function generateQRCode() {
  if (!qrCanvas.value || !qrData.value.register_url) return
  await nextTick()
  try {
    await QRCode.toCanvas(qrCanvas.value, qrData.value.register_url, {
      width: 180, margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" }
    })
  } catch (err) { console.error("QR code error:", err) }
}

async function loadData() {
  loading.value = true
  try {
    // 先获取首页数据，检查审核状态
    const homeRes = await getHomeData()
    homeData.value = homeRes.data || {}
    
    // 审核未通过，不显示渠道码
    if (homeData.value.status !== 1) {
      loading.value = false
      return
    }
    
    // 获取渠道码
    const qrRes = await getQrCode()
    qrData.value = qrRes.data || {}
    await generateQRCode()
  } catch { ElMessage.error("加载渠道码信息失败") }
  finally { loading.value = false }
}

onMounted(() => { loadData() })

async function downloadQR() {
  if (!qrCanvas.value) return
  const dataUrl = qrCanvas.value.toDataURL("image/png")
  const link = document.createElement("a")
  link.download = "邻盟渠道码_" + (qrData.value.qr_code || "") + ".png"
  link.href = dataUrl
  link.click()
  ElMessage.success("二维码图片已下载")
}

async function copyLink() {
  const url = qrData.value.register_url || "http://150.158.12.243/#/register/merchant?code=" + (qrData.value.qr_code || "")
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success("注册链接已复制到剪贴板")
  } catch {
    ElMessage.error("复制失败，请手动复制")
  }
}
</script>

<style scoped>
.qrcode-page { max-width: 900px; margin: 0 auto; }
.qrcode-page h2 { margin-bottom: 24px; font-size: 22px; font-weight: 700; }
.qrcode-layout { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: start; }
.qrcode-card { background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.qr-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.logo-sm { width: 36px; height: 36px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #fff; }
.brand-nm { color: #F59E0B; font-weight: 700; font-size: 15px; }
.amb-nm { color: rgba(255,255,255,0.6); font-size: 12px; }
.qr-body { text-align: center; }
.qr-image { display: inline-block; background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.qr-image canvas { display: block; width: 180px !important; height: 180px !important; }
.qr-code-text { font-size: 20px; font-weight: 700; color: #FCD34D; letter-spacing: 3px; margin-bottom: 8px; }
.qrcode-actions h3 { font-size: 18px; margin-bottom: 20px; }
.action-btns { display: flex; flex-direction: row; gap: 12px; margin-bottom: 24px; }
.action-btns .el-button { flex: 1; justify-content: center; }
.link-box { background: #f5f7fa; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
.link-label { font-size: 13px; color: #909399; margin-bottom: 4px; }
.link-text { font-size: 14px; color: #409EFF; word-break: break-all; }
.tips-box { margin-bottom: 20px; }
.tips-box h4 { font-size: 15px; margin-bottom: 10px; }
.tips-box ul { padding-left: 20px; color: #606266; font-size: 14px; line-height: 2; }
.stats-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mini-stat { text-align: center; background: #f5f7fa; border-radius: 10px; padding: 12px; }
.ms-val { font-size: 24px; font-weight: 700; color: #F59E0B; }
.ms-lab { font-size: 12px; color: #909399; margin-top: 4px; }
@media (max-width: 768px) {
  .qrcode-layout { grid-template-columns: 1fr; }
  .qrcode-card { max-width: 320px; margin: 0 auto; }
  .action-btns { flex-direction: row !important; gap: 8px !important; }
  .action-btns .el-button { font-size: 13px; padding: 12px 8px; }
}
</style>