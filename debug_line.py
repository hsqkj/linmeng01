# -*- coding: utf-8 -*-
"""检查 Profile.vue 中 floor_number placeholder 的字节"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 查找包含 floor_number 和 placeholder 的行
import re
matches = list(re.finditer(r'.*floor_number.*placeholder.*', content))
for m in matches:
    line_start = content.rfind('\n', 0, m.start()) + 1
    line_end = content.find('\n', m.end())
    line = content[line_start:line_end]
    print("Found line bytes:")
    # 查找 placeholder="绗 和 style= 之间的部分
    ph_match = re.search(r'placeholder="([^"]*?)" style=', line)
    if ph_match:
        print(f"placeholder value: '{ph_match.group(1)}'")
    else:
        # placeholder 值不完整
        ph_broken = re.search(r'placeholder="([^"]*?) style=', line)
        if ph_broken:
            print(f"Broken placeholder value: '{ph_broken.group(1)}'")
            print("Missing closing quote!")
