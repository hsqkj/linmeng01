<template>
  <div class="legal-page">
    <div class="legal-container">
      <el-button text @click="$router.back()" style="margin-bottom:20px">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1>邻盟平台服务协议</h1>
      <p class="update-time">最后更新：2026年1月1日</p>

      <div class="section">
        <h2>一、服务说明</h2>
        <p>邻盟平台（以下简称"平台"）是一个社区资源智能匹配助手，旨在连接社区与商家，促进社区资源共享与合作。平台提供需求发布、资源展示、智能匹配、在线沟通等服务。</p>
      </div>

      <div class="section">
        <h2>二、用户注册与账号</h2>
        <p>1. 您在使用平台服务前，需要注册成为平台用户。注册时需提供真实、准确的个人或企业信息。</p>
        <p>2. 您应妥善保管账号和密码，因账号被盗用产生的任何损失，由用户自行承担。</p>
        <p>3. 商家用户需经平台审核通过后方可发布资源；社区用户需经所在社区或街道确认后方可发布需求。</p>
      </div>

      <div class="section">
        <h2>三、商家入驻规范</h2>
        <p>1. 商家入驻需提供真实有效的企业资质信息，包括营业执照、联系人信息等。</p>
        <p>2. 商家发布的资源信息必须真实准确，不得含有虚假宣传或误导性内容。</p>
        <p>3. 商家应按照平台规则参与社区合作，履行承诺，不得无故撤回已确认的合作意向。</p>
        <p>4. 商家会员等级及权益由平台统一制定，详见《会员等级说明》。</p>
      </div>

      <div class="section">
        <h2>四、社区使用规范</h2>
        <p>1. 社区用户发布需求需真实描述社区情况和实际需求。</p>
        <p>2. 社区有义务对合作商家提供必要的配合与支持，共同推进合作落地。</p>
        <p>3. 社区应尊重商家权益，不得将商家联系方式用于平台以外的商业目的。</p>
      </div>

      <div class="section">
        <h2>五、信息保护</h2>
        <p>1. 平台承诺保护用户的个人信息安全，未经用户授权不向第三方披露联系方式。</p>
        <p>2. 商家联系方式属于平台保护信息，社区需通过平台系统发起合作意向，不得绕过平台私下联系。</p>
        <p>3. 用户不得在平台留言区发布手机号、微信号等联系方式，违规内容将被平台屏蔽。</p>
      </div>

      <div class="section">
        <h2>六、撮合与奖励机制</h2>
        <p>1. 平台鼓励社区与商家通过平台完成合作撮合，撮合成功后平台将给予相应奖励。</p>
        <p>2. 每笔成功撮合，平台将捐赠价值200元的物资用于社区公益事业。</p>
        <p>3. 招商大使成功推荐商家入驻，可获得相应比例的佣金提成。</p>
      </div>

      <div class="section">
        <h2>七、服务费用</h2>
        <p>1. 基础服务免费，商家会员可选择付费升级以获取更多权益。</p>
        <p>2. 会员年费标准：普通会员（免费）、银牌会员（999元/年）、金牌会员（2,999元/年）、铂金会员（5,999元/年）、钻石会员（12,000元/年）。</p>
        <p>3. 会员费按自然年度计算，续费可享优惠政策。</p>
      </div>

      <div class="section">
        <h2>八、免责声明</h2>
        <p>1. 平台不对社区与商家之间的合作结果承担连带责任，合作纠纷由双方自行协商解决。</p>
        <p>2. 因不可抗力导致的合作无法履行，平台不承担违约责任。</p>
        <p>3. 用户因违反本协议导致的法律后果，由违规方自行承担。</p>
      </div>

      <div class="section">
        <h2>九、协议修改</h2>
        <p>平台有权根据法律法规及业务需要修订本协议，修订内容将在平台公示。用户在修订后继续使用平台服务，视为接受修订后的协议。</p>
      </div>

      <div class="section">
        <h2>十、联系我们</h2>
        <p>如您对本协议有任何疑问，请联系平台客服：400-888-8888 或发送邮件至 service@linmeng.cn</p>
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
  text-indent: 2em;
}
</style>
