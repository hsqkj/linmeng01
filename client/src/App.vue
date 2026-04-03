<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
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
