<template>
  <div class="role-select">
    <!-- 顶部品牌 -->
    <div class="rs-header">
      <div class="rs-logo">
        <div class="rs-logo-icon">🏘</div>
        <div>
          <div class="rs-logo-name">邻盟</div>
          <div class="rs-logo-sub">社区资源智能匹配助手</div>
        </div>
      </div>
    </div>

    <!-- 入口卡片 -->
    <div class="rs-cards">
      <div class="rs-card comm" @click="goToLogin('community')">
        <div class="rs-card-icon">🏘</div>
        <h3>社区工作者</h3>
        <p>发布社区需求，智能匹配商家资源</p>
        <div class="rs-card-btn">进入社区端 →</div>
      </div>

      <div class="rs-card merch" @click="goToLogin('merchant')">
        <div class="rs-card-icon">🏪</div>
        <h3>品牌商家</h3>
        <p>发布可赞助资源，精准对接社区需求</p>
        <div class="rs-card-btn">进入商家端 →</div>
      </div>

      <div class="rs-card amb" @click="goToLogin('ambassador')">
        <div class="rs-card-icon">🏅</div>
        <h3>招商大使</h3>
        <p>发展商家会员，获取丰厚佣金收益</p>
        <div class="rs-card-btn">进入大使端 →</div>
      </div>

      <div class="rs-card admin" @click="goToLogin('admin')">
        <div class="rs-card-icon">⚙️</div>
        <h3>平台管理员</h3>
        <p>系统管理、数据监控、审核配置</p>
        <div class="rs-card-btn">进入管理后台 →</div>
      </div>
    </div>

    <!-- 底部特性 -->
    <div class="rs-features">
      <div class="rs-feat"><span>🔗</span>智能匹配</div>
      <div class="rs-feat"><span>❤️</span>五心评级</div>
      <div class="rs-feat"><span>⚡</span>高效对接</div>
      <div class="rs-feat"><span>🎁</span>撮合奖励</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = (role) => {
  if (role === 'admin') {
    router.push('/admin/login')
  } else if (role === 'community') {
    router.push('/login/community')
  } else if (role === 'merchant') {
    router.push('/login/merchant')
  } else {
    router.push('/login/ambassador')
  }
}
</script>

<style scoped>
.role-select {
  min-height: 100vh;
  background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1a5fb4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 40px;
  position: relative;
  overflow: hidden;
}
.role-select::before {
  content: '';
  position: absolute;
  top: -100px; right: -100px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(38,162,105,.15) 0%, transparent 70%);
  border-radius: 50%;
}
.role-select::after {
  content: '';
  position: absolute;
  bottom: -60px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(230,97,0,.12) 0%, transparent 70%);
  border-radius: 50%;
}

/* 品牌 */
.rs-header { text-align: center; margin-bottom: 48px; position: relative; z-index: 1; }
.rs-logo { display: flex; align-items: center; gap: 16px; justify-content: center; }
.rs-logo-icon {
  font-size: 48px; width: 72px; height: 72px;
  background: linear-gradient(135deg, #26a269, #1a5fb4);
  border-radius: 20px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
}
.rs-logo-name { font-size: 40px; font-weight: 900; color: #fff; letter-spacing: 4px; line-height: 1; }
.rs-logo-sub { font-size: 14px; color: rgba(255,255,255,.6); margin-top: 6px; }

/* 卡片组 */
.rs-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 1100px;
  width: 100%;
  margin-bottom: 40px;
  position: relative; z-index: 1;
}
.rs-card {
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 20px;
  padding: 36px 24px 28px;
  text-align: center;
  cursor: pointer;
  transition: all .3s;
  position: relative;
  overflow: hidden;
}
.rs-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity .3s;
}
.rs-card.comm::before  { background: linear-gradient(90deg, #26a269, #1a7a4c); }
.rs-card.merch::before { background: linear-gradient(90deg, #e66100, #b84d00); }
.rs-card.amb::before   { background: linear-gradient(90deg, #813d9c, #5e2b74); }
.rs-card.admin::before { background: linear-gradient(90deg, #1a5fb4, #14407a); }
.rs-card:hover { transform: translateY(-6px); background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.25); }
.rs-card:hover::before { opacity: 1; }

.rs-card-icon { font-size: 48px; margin-bottom: 16px; display: block; }
.rs-card h3 { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 10px; }
.rs-card p  { font-size: 13px; color: rgba(255,255,255,.6); margin-bottom: 24px; line-height: 1.6; }
.rs-card-btn {
  display: inline-block;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px; font-weight: 600;
  transition: all .2s;
  cursor: pointer;
}
.rs-card.comm  .rs-card-btn { background: #26a269; color: #fff; }
.rs-card.merch .rs-card-btn { background: #e66100; color: #fff; }
.rs-card.amb   .rs-card-btn { background: #813d9c; color: #fff; }
.rs-card.admin .rs-card-btn { background: #1a5fb4; color: #fff; }
.rs-card:hover .rs-card-btn { transform: scale(1.04); box-shadow: 0 4px 16px rgba(0,0,0,.3); }

/* 特性栏 */
.rs-features {
  display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
  position: relative; z-index: 1;
}
.rs-feat {
  display: flex; align-items: center; gap: 6px;
  color: rgba(255,255,255,.8);
  font-size: 14px;
  background: rgba(255,255,255,.1);
  padding: 8px 20px; border-radius: 20px;
  backdrop-filter: blur(4px);
}
.rs-feat span { font-size: 16px; }

@media (max-width: 900px) {
  .rs-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .role-select {
    padding: 32px 16px 24px;
  }
  .rs-logo-icon {
    width: 56px;
    height: 56px;
    font-size: 36px;
    border-radius: 14px;
  }
  .rs-logo-name {
    font-size: 32px;
  }
  .rs-logo-sub {
    font-size: 12px;
  }
  .rs-header {
    margin-bottom: 32px;
  }
  .rs-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .rs-card {
    padding: 24px 16px 20px;
    border-radius: 16px;
  }
  .rs-card-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }
  .rs-card h3 {
    font-size: 15px;
  }
  .rs-card p {
    font-size: 11px;
    margin-bottom: 16px;
  }
  .rs-card-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
  .rs-features {
    gap: 10px;
  }
  .rs-feat {
    font-size: 12px;
    padding: 6px 14px;
  }
}
@media (max-width: 500px) {
  .rs-cards { grid-template-columns: 1fr; gap: 14px; }
  .rs-logo-name { font-size: 28px; }
  .rs-header { margin-bottom: 28px; }
}
</style>
