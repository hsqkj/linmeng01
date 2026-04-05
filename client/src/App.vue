<template>
  <router-view />
</template>

<style>
/* ========== 全局 Design Tokens ========== */
:root {
  /* 四端品牌色 */
  --admin: #1a5fb4;
  --admin-d: #14407a;
  --admin-l: #e8f0fb;
  --comm: #26a269;
  --comm-d: #1a7a4c;
  --comm-l: #e8f7ed;
  --merch: #e66100;
  --merch-d: #b84d00;
  --merch-l: #fff0e0;
  --amb: #813d9c;
  --amb-d: #5e2b74;
  --amb-l: #f5ebf7;
  /* 通用色 */
  --text: #1a1a1a;
  --muted: #666;
  --light: #f5f6f8;
  --border: #eee;
  --card-shadow: 0 2px 12px rgba(0,0,0,.06);
  --card-shadow-hover: 0 12px 32px rgba(0,0,0,.12);
  --radius: 16px;
  --radius-sm: 10px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--light);
  color: var(--text);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

/* ========== 卡片通用 ========== */
.lm-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--card-shadow);
  margin-bottom: 20px;
}

/* ========== 统计卡片 ========== */
.lm-stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.lm-stat-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 20px 24px;
  box-shadow: var(--card-shadow);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all .2s;
}
.lm-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
}
.lm-stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}
.lm-stat-num {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}
.lm-stat-label {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}

/* ========== 章节标题 ========== */
.lm-section {
  margin-bottom: 24px;
}
.lm-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.lm-section-header h2 {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== 页面标题 ========== */
.lm-page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.lm-page-sub {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 24px;
}

/* ========== Badge 标签 ========== */
.lm-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}
.lm-badge-green  { background: var(--comm-l);  color: var(--comm); }
.lm-badge-orange { background: var(--merch-l); color: var(--merch); }
.lm-badge-blue   { background: var(--admin-l); color: var(--admin); }
.lm-badge-purple { background: var(--amb-l);   color: var(--amb); }
.lm-badge-red    { background: #fff1f0; color: #ff4d4f; }

/* ========== Banner 渐变块 ========== */
.lm-banner {
  border-radius: var(--radius);
  padding: 40px;
  color: #fff;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  min-height: 180px;
  display: flex;
  align-items: center;
}
.lm-banner::before {
  content: '';
  position: absolute;
  top: -60px; right: -40px;
  width: 280px; height: 280px;
  background: rgba(255,255,255,.08);
  border-radius: 50%;
}
.lm-banner::after {
  content: '';
  position: absolute;
  bottom: -80px; left: 60px;
  width: 200px; height: 200px;
  background: rgba(255,255,255,.05);
  border-radius: 50%;
}
.lm-banner-body { position: relative; z-index: 1; }
.lm-banner-body h2 { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
.lm-banner-body p  { font-size: 15px; opacity: .85; margin-bottom: 18px; }

/* ========== Element Plus 覆盖 ========== */
:deep(.el-card) {
  border-radius: var(--radius) !important;
  border: none !important;
  box-shadow: var(--card-shadow) !important;
}
:deep(.el-button--primary) {
  border-radius: 8px;
}
:deep(.el-tag) {
  border-radius: 8px;
}
:deep(.el-input__wrapper) {
  border-radius: 10px !important;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .pc-only {
    display: none !important;
  }

  /* 全局表格手机端优化 */
  :deep(.el-table) {
    font-size: 13px;
  }
  :deep(.el-table__header th) {
    font-size: 12px;
    padding: 8px 0;
  }
  :deep(.el-table__body td) {
    padding: 8px 4px;
  }
  :deep(.el-table__body .cell) {
    padding: 0 4px;
  }

  /* 表格横向滚动提示 */
  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.el-table__body-wrapper::-webkit-scrollbar) {
    height: 4px;
  }

  /* 对话框手机端全屏 */
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 95%;
    margin: 12px auto !important;
  }
  :deep(.el-dialog__header) {
    padding: 12px 16px;
  }
  :deep(.el-dialog__body) {
    padding: 12px 16px;
    font-size: 14px;
  }
  :deep(.el-dialog__footer) {
    padding: 12px 16px;
  }

  /* 表单项手机端优化 */
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
  :deep(.el-form-item__label) {
    font-size: 13px;
  }
  :deep(.el-form-item__content) {
    font-size: 14px;
  }

  /* 按钮手机端优化 */
  :deep(.el-button) {
    font-size: 13px;
    padding: 8px 12px;
  }
  :deep(.el-button--small) {
    font-size: 12px;
    padding: 6px 10px;
  }

  /* 分页手机端居中 */
  :deep(.el-pagination) {
    justify-content: center;
    font-size: 12px;
  }

  /* 描述列表手机端 */
  :deep(.el-descriptions__label) {
    font-size: 12px;
  }
  :deep(.el-descriptions__content) {
    font-size: 13px;
  }

  /* 下拉选择手机端 */
  :deep(.el-select) {
    font-size: 14px;
  }

  /* 输入框手机端 */
  :deep(.el-input) {
    font-size: 14px;
  }

  /* 标签手机端 */
  :deep(.el-tag) {
    font-size: 11px;
    padding: 0 6px;
  }

  /* 卡片手机端 */
  :deep(.el-card) {
    font-size: 14px;
  }
  :deep(.el-card__header) {
    padding: 12px 14px;
    font-size: 14px;
  }
  :deep(.el-card__body) {
    padding: 12px 14px;
  }
}

@media (min-width: 769px) {
  .mobile-only {
    display: none !important;
  }
}
</style>
