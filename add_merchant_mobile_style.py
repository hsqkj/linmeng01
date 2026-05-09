#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为商家端所有页面添加移动端小程序风格样式
商家端：纯移动端小程序风格（375px宽度，全屏通栏，无阴影，白色卡片）
"""

import re
import sys
import os

def add_merchant_mobile_style(file_path):
    """为单个Vue文件添加商家端移动端样式"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经有移动端样式
    if '@media (max-width: 768px)' in content and ('merchant-mobile' in content or 'merchant-page' in content):
        print(f"✓ 跳过 {os.path.basename(file_path)} - 已有移动端样式")
        return False
    
    # 找到 </style> 标签位置
    style_end = content.rfind('</style>')
    if style_end == -1:
        print(f"⚠️  警告: {os.path.basename(file_path)} 没有 </style> 标签")
        return False
    
    # 提取文件名（不含扩展名）作为页面标识
    page_name = os.path.basename(file_path).replace('.vue', '')
    
    # 构建移动端样式
    mobile_style = f'''
/* 商家端移动端适配 - 小程序风格 */
@media (max-width: 768px) {{
  .{page_name}-container,
  .merchant-container,
  .page-container {{
    padding: 0 !important;
    margin: 0 !important;
    background: #f5f5f5 !important;
  }}
  
  /* 卡片样式 - 无阴影，白色背景 */
  .el-card,
  .merchant-card,
  .info-card {{
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 0 8px 0 !important;
    border: none !important;
    border-bottom: 1px solid #ebeef5 !important;
  }}
  
  /* 表格样式 */
  .el-table {{
    font-size: 14px !important;
  }}
  
  .el-table th,
  .el-table td {{
    padding: 8px 4px !important;
  }}
  
  /* 表单样式 */
  .el-form-item {{
    margin-bottom: 16px !important;
  }}
  
  .el-form-item__label {{
    font-size: 14px !important;
    color: #606266 !important;
    line-height: 32px !important;
  }}
  
  .el-input__inner,
  .el-textarea__inner {{
    font-size: 14px !important;
  }}
  
  /* 按钮样式 */
  .el-button {{
    font-size: 14px !important;
    padding: 8px 15px !important;
  }}
  
  /* 对话框 */
  .el-dialog {{
    width: 90% !important;
    max-width: 375px !important;
    margin: 0 auto !important;
  }}
  
  /* 分页 */
  .el-pagination {{
    text-align: center !important;
    padding: 10px 0 !important;
  }}
  
  /* 标签 */
  .el-tag {{
    font-size: 12px !important;
  }}
  
  /* 图片 */
  img {{
    max-width: 100% !important;
    height: auto !important;
  }}
}}

/* 商家端PC端样式 - 保持原有布局 */
@media (min-width: 769px) {{
  .{page_name}-container,
  .merchant-container,
  .page-container {{
    max-width: 1200px !important;
    margin: 0 auto !important;
    padding: 20px !important;
  }}
}}
'''
    
    # 插入样式
    new_content = content[:style_end] + mobile_style + '\n' + content[style_end:]
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ 已添加移动端样式: {os.path.basename(file_path)}")
    return True

def main():
    merchant_dir = r'D:\WorkBuddy\20260331205655\client\src\views\merchant'
    
    if not os.path.exists(merchant_dir):
        print(f"错误: 目录不存在 {merchant_dir}")
        sys.exit(1)
    
    # 获取所有 .vue 文件
    vue_files = [f for f in os.listdir(merchant_dir) if f.endswith('.vue')]
    
    print(f"找到 {len(vue_files)} 个 Vue 文件")
    print("=" * 50)
    
    success_count = 0
    skip_count = 0
    
    for vue_file in vue_files:
        file_path = os.path.join(merchant_dir, vue_file)
        try:
            if add_merchant_mobile_style(file_path):
                success_count += 1
            else:
                skip_count += 1
        except Exception as e:
            print(f"❌ 错误: {vue_file} - {str(e)}")
    
    print("=" * 50)
    print(f"✅ 成功: {success_count} 个文件")
    print(f"⏭️  跳过: {skip_count} 个文件")
    print(f"📊 总计: {len(vue_files)} 个文件")

if __name__ == '__main__':
    main()
