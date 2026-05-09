# -*- coding: utf-8 -*-
"""修复 Profile.vue 模板中 el-input-number placeholder 问题"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 floor_number placeholder - 使用正则表达式
import re

# 找到所有 placeholder 后面直接跟 style 的情况 (缺少引号结束)
# 模式: placeholder="xxx? style=  (xx? 后缺少引号)
pattern = r'(placeholder="[^"]+)\? style="width:100%" />'
replacement = r'\1?" style="width:100%" />'

content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("floor_number placeholder 修复完成")
