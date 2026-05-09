# -*- coding: utf-8 -*-
"""
修复 Profile.vue 移动端布局问题
1. 清理多余的空属性行
2. 确保设施选择器等组件宽度正确
"""

import re

# 读取文件
file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复 el-input-number 的空行问题 (456, 461, 466行附近)
# 清理: placeholder="平米" 后的空行和 />
content = re.sub(
    r'placeholder="[^"]*"\s+\n\s+/>/g',
    'placeholder="平米"/>\n                    ',
    content
)

# 2. 修复 el-input-number 的空行问题 (户数)
content = re.sub(
    r'placeholder="[^"]*"\s+\n\s+/\s*>/g',
    lambda m: m.group(0).replace('\n                    ', '\n                    '),
    content
)

# 3. 修复 customFacilities el-input 的空行问题
# 找到: placeholder="其他设备..." 后跟空行的情况
content = re.sub(
    r'(placeholder="其他设备[^"]*")\s*\n\s*\n\s*(size="small")',
    r'\1\n                      \2',
    content
)

# 4. 修复 el-time-select 的空行问题 (多处)
# 移除 el-time-select 标签内属性之间的空行
content = re.sub(
    r'(placeholder="[^"]*")\s*\n\s*\n\s*(start="[^"]*")',
    r'\1\n                        \2',
    content
)

content = re.sub(
    r'(end="[^"]*")\s*\n\s*\n\s*(/>)',
    r'\1\n                        \2',
    content
)

# 5. 在样式中添加更严格的移动端规则
# 找到 @media (max-width: 768px) 的末尾添加额外规则

# 添加设施选择器的完整修复
facility_fix = '''
  /* ========== 设施选择器完整修复 ========== */
  .facility-selector { 
    display: flex !important; 
    flex-direction: column !important;
    flex-wrap: wrap !important; 
    gap: 8px !important; 
    align-items: stretch !important;
  }
  .facility-selector :deep(.el-check-tag) { 
    width: auto !important; 
    font-size: 12px !important; 
    padding: 4px 10px !important; 
    margin: 2px !important;
  }
  .facility-selector :deep(.el-input) { 
    width: 100% !important; 
    margin-left: 0 !important; 
    margin-top: 8px !important; 
    flex: 1 1 100% !important;
  }
  .facility-selector :deep(.el-input__wrapper) {
    width: 100% !important;
  }
'''

# 在移动端样式末尾插入修复
# 找到 </style> 前一行
marker = '  /* 上传区 */'
if marker in content:
    # 在 upload-tip 之后添加修复
    idx = content.find(marker)
    end_idx = content.find('}', idx) + 1
    content = content[:end_idx] + facility_fix + content[end_idx:]

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Profile.vue 移动端布局修复完成")
