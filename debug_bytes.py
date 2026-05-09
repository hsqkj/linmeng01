# -*- coding: utf-8 -*-
"""检查并修复 Profile.vue"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'

# 先读取文件
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# 查找包含 floor_number 和 style="width:100%" 的行
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'floor_number' in line:
        print(f"Line {i+1}: {line}")
