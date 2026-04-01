<template>
  <div class="qrcode-page">
    <h2>我的渠道码</h2>
    <div class="qrcode-layout">
      <div class="qrcode-card">
        <div class="qr-header">
          <div class="logo-sm">邻</div>
          <div>
            <div class="brand-nm">邻盟招商大使</div>
            <div class="amb-nm">李招商 专属渠道</div>
          </div>
        </div>
        <div class="qr-body">
          <div class="qr-image">
            <div class="qr-placeholder">
              <div class="qr-grid">
                <div v-for="i in 81" :key="i" :class="['qr-cell', Math.random() > 0.4 ? 'filled' : '']" />
              </div>
              <div class="qr-center-logo">邻</div>
            </div>
          </div>
          <div class="qr-code-text">AMB2024001</div>
          <p class="qr-tip">商家扫码注册并缴费，您将获得提成奖励</p>
        </div>
        <div class="qr-footer">
          <div class="rate-item">首次缴费 <strong>20%</strong></div>
          <div class="rate-divider">|</div>
          <div class="rate-item">续费 <strong>10%</strong></div>
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
          <div class="link-text">https://linmeng.com/register?code=AMB2024001</div>
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
            <div class="ms-val">38</div>
            <div class="ms-lab">扫码注册</div>
          </div>
          <div class="mini-stat">
            <div class="ms-val">32</div>
            <div class="ms-lab">成功缴费</div>
          </div>
          <div class="mini-stat">
            <div class="ms-val">84%</div>
            <div class="ms-lab">转化率</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { Download, CopyDocument } from '@element-plus/icons-vue'
function downloadQR() { ElMessage.success('二维码图片已保存到下载文件夹') }
function copyLink() {
  navigator.clipboard?.writeText('https://linmeng.com/register?code=AMB2024001')
  ElMessage.success('注册链接已复制到剪贴板')
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
.qr-placeholder { width: 180px; height: 180px; position: relative; }
.qr-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 2px; width: 100%; height: 100%; }
.qr-cell { background: #f5f7fa; border-radius: 1px; }
.qr-cell.filled { background: #1a1a2e; }
.qr-center-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 36px; height: 36px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #fff; }
.qr-code-text { font-size: 20px; font-weight: 700; color: #FCD34D; letter-spacing: 3px; margin-bottom: 8px; }
.qr-tip { color: rgba(255,255,255,0.6); font-size: 13px; }
.qr-footer { display: flex; align-items: center; justify-content: center; gap: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; }
.rate-item { color: rgba(255,255,255,0.7); font-size: 13px; }
.rate-item strong { color: #F59E0B; font-size: 18px; }
.rate-divider { color: rgba(255,255,255,0.2); }
.qrcode-actions h3 { font-size: 18px; margin-bottom: 20px; }
.action-btns { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
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
}
</style>
