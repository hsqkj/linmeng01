# -*- coding: utf-8 -*-
"""直接修复 Profile.vue 中 floor_number placeholder"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 查找包含 floor_number 和 placeholder 的行
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'floor_number' in line and 'placeholder' in line:
        print(f"Line {i+1}:")
        print(repr(line))
        
        # 提取 placeholder 和 style= 之间的内容
        import re
        match = re.search(r'placeholder="([^"]*?) style=', line)
        if match:
            ph_value = match.group(1)
            print(f"Placeholder value: '{ph_value}'")
            # 检查是否缺少结束引号
            if not line.strip().endswith('" style='):
                print("Missing closing quote before style=")

# 现在用简单的方式替换：找到这个特定的行并修复
old_line = '                      <el-input-number v-model="space.floor_number" :min="1" :max="100" placeholder="绗?灞? style="width:100%" />'
new_line = '                      <el-input-number v-model="space.floor_number" :min="1" :max="100" placeholder="绗?灞?" style="width:100%" />'

if old_line in content:
    content = content.replace(old_line, new_line)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("\nFixed!")
else:
    print("\nExact match not found, trying partial...")
    # 尝试只用关键部分匹配
    key_old = '绗?灞? style="width:100%"'
    key_new = '绗?灞?" style="width:100%"'
    if key_old in content:
        content = content.replace(key_old, key_new)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed with partial match!")
    else:
        print("Partial match not found either")
