<template>
  <div class="legal-page">
    <div class="legal-container">
      <el-button text @click="$router.back()" style="margin-bottom:20px">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1>隐私政策</h1>
      <p class="update-time">最后更新：2026年1月1日</p>

      <div class="section">
        <h2>一、信息收集</h2>
        <p>1. <strong>注册信息：</strong>当您注册邻盟平台账号时，我们会收集您的手机号码、验证码等信息。商家用户还需提供企业名称、联系人、地址等信息。</p>
        <p>2. <strong>认证信息：</strong>为保障平台可信度，商家入驻需提交企业资质证明，社区用户需经所在街道或社区确认。</p>
        <p>3. <strong>行为信息：</strong>平台会记录您的浏览记录、合作意向提交记录、留言互动等行为数据，用于智能匹配推荐。</p>
        <p>4. <strong>设备信息：</strong>为保障账号安全，平台可能收集您的设备型号、IP地址等基础信息。</p>
      </div>

      <div class="section">
        <h2>二、信息使用</h2>
        <p>1. <strong>服务提供：</strong>您的信息用于平台核心功能，包括身份验证、需求发布、资源展示、智能匹配、合作撮合等。</p>
        <p>2. <strong>智能推荐：</strong>基于您的社区画像数据和商家资源标签，平台进行智能匹配推荐。</p>
        <p>3. <strong>通知推送：</strong>平台通过短信、站内消息向您推送合作意向、审核结果、活动通知等信息。</p>
        <p>4. <strong>数据统计：</strong>平台会对脱敏后的数据进行统计分析，用于优化服务质量。</p>
      </div>

      <div class="section">
        <h2>三、信息保护</h2>
        <p>1. <strong>联系方式保护：</strong>商家联系电话属于平台核心数据，平台采用加密存储，社区用户查看联系方式需通过平台授权机制。严禁绕过平台进行私下联系。</p>
        <p>2. <strong>留言审核：</strong>用户留言内容经平台审核后方可展示，禁止在留言区填写联系方式，违规内容将被自动屏蔽。</p>
        <p>3. <strong>数据安全：</strong>平台采用行业标准的安全技术手段保护您的数据安全，防止数据泄露、篡改或丢失。</p>
      </div>

      <div class="section">
        <h2>四、信息共享</h2>
        <p>1. <strong>合作场景：</strong>当您通过平台发起合作意向时，平台会将您的联系方式（经您授权的部分）共享给合作对方。</p>
        <p>2. <strong>法律要求：</strong>如法律法规要求或司法机关要求，平台可能在合法范围内披露您的信息。</p>
        <p>3. <strong>服务提供商：</strong>平台可能委托第三方服务提供商协助运营，但仅提供必要数据，并要求其承担保密义务。</p>
        <p>4. <strong>未经授权不共享：</strong>未经您同意，平台不会将您的个人信息出售、租借给任何第三方。</p>
      </div>

      <div class="section">
        <h2>五、用户权利</h2>
        <p>1. <strong>查看与更正：</strong>您有权随时查看和更正您的注册信息，发现错误可及时修改。</p>
        <p>2. <strong>账号注销：</strong>您有权申请注销账号，注销后您的信息将被删除或匿名化处理（法律法规另有规定的除外）。</p>
        <p>3. <strong>拒绝推送：</strong>您可在设置中关闭非必要的通知推送。</p>
      </div>

      <div class="section">
        <h2>六、Cookie政策</h2>
        <p>平台使用Cookie技术记录您的登录状态和偏好设置，以便提供更流畅的访问体验。您可在浏览器设置中禁用Cookie，但这可能影响部分功能使用。</p>
      </div>

      <div class="section">
        <h2>七、未成年人保护</h2>
        <p>平台服务主要面向成年人用户。不满18周岁的未成年人请在监护人陪同下使用平台服务，并确保在监护人知情同意的情况下提供个人信息。</p>
      </div>

      <div class="section">
        <h2>八、隐私政策更新</h2>
        <p>平台可能根据法律法规或业务变化更新本隐私政策，更新内容将在平台显著位置公示。如更新涉及重大变更，我们将通过短信或站内消息另行通知。</p>
      </div>

      <div class="section">
        <h2>九、联系我们</h2>
        <p>如您对本隐私政策有任何疑问或建议，请联系平台隐私保护负责人：</p>
        <p>邮箱：privacy@linmeng.cn</p>
        <p>电话：400-888-8888</p>
        <p>地址：上海市浦东新区花木路888号邻盟大厦</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}
.legal-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
h1 {
  text-align: center;
  font-size: 26px;
  color: #303133;
  margin-bottom: 8px;
}
.update-time {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin-bottom: 32px;
}
.section {
  margin-bottom: 28px;
}
.section h2 {
  font-size: 17px;
  color: #409EFF;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
  margin-bottom: 12px;
}
.section p {
  color: #606266;
  font-size: 14px;
  line-height: 1.9;
  margin: 6px 0;
}
</style>
