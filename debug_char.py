# -*- coding: utf-8 -*-
"""检查 Profile.vue 中第466行的确切内容"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 输出第466行（索引465）
line = lines[465]
print("Line 466 content:")
print(repr(line))
print("\nActual:")
print(line)

# 尝试找到 floor_number 行
for i, l in enumerate(lines):
    if 'floor_number' in l and 'placeholder' in l:
        print(f"\nLine {i+1}:")
        print(repr(l))
