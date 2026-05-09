# -*- coding: utf-8 -*-
"""
修复 Profile.vue 模板中 placeholder 属性引号不匹配问题
"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复设施选择器的 customFacilities el-input
content = content.replace(
    'placeholder="鍏朵粬璁炬柦锛堥€楀彿鍒嗛殧锛?                      \n                      \n                      size="small"',
    'placeholder="鍏朵粬璁炬柦锛堥€楀彿鍒嗛殧锛?"\n                      size="small"'
)

# 2. 修复 el-time-select weekday_start placeholder
content = content.replace(
    'placeholder="寮€濮嬫椂闂?                        start="06:00"',
    'placeholder="寮€濮嬫椂闂?"\n                        start="06:00"'
)

# 3. 修复 el-input-number placeholder (area)
content = content.replace(
    'placeholder="銕?style="width:100%"',
    'placeholder="銕?/"\n                    style="width:100%"'
)

# 4. 修复 el-input-number placeholder (capacity)
content = content.replace(
    'placeholder="浜?style="width:100%"',
    'placeholder="浜?"\n                    style="width:100%"'
)

# 5. 修复 el-input-number placeholder (floor_number)
content = content.replace(
    'placeholder="绗?\?灞?style="width:100%"',
    'placeholder="绗?\?灞?"\n                    style="width:100%"'
)

# 6. 修复设施选择器样式 - 加强 !important
if '.facility-selector :deep(.el-input) { width: 100% !important; margin-left: 0 !important; margin-top: 6px; }' in content:
    content = content.replace(
        '.facility-selector :deep(.el-input) { width: 100% !important; margin-left: 0 !important; margin-top: 6px; }',
        '.facility-selector :deep(.el-input) { width: 100% !important; margin-left: 0 !important; margin-top: 8px !important; flex: 1 1 100% !important; }'
    )

# 7. 添加按钮宽度强制覆盖
add_btn_fix = '''
  /* 按钮宽度强制100% */
  .edit-form-mobile :deep(.el-button) {
    width: 100% !important;
    display: block !important;
  }
'''

if '.upload-tip { font-size: 11px; color: #909399; }' in content:
    content = content.replace(
        '.upload-tip { font-size: 11px; color: #909399; }',
        '.upload-tip { font-size: 11px; color: #909399; }\n' + add_btn_fix
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("模板语法修复完成")
