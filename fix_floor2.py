# -*- coding: utf-8 -*-
"""修复 Profile.vue 中 floor_number placeholder"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'

with open(file_path, 'rb') as f:
    content = f.read()

# 查找问题模式
# 需要找到: placeholder="绗?灞? style=" 这样的字节序列
# 其中 "绗\u53d1\u6c99?" 是 "绗\u53d1\u6c99?" 后面缺少了引号

# 用字节方式搜索
target = b'placeholder="绗?灞? style="'
if target in content:
    print("Found target pattern (bytes)")
    # 替换为正确的
    replacement = b'placeholder="绗?灞?" style="'
    content = content.replace(target, replacement)
    with open(file_path, 'wb') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Target not found. Searching for similar patterns...")
    # 搜索包含 floor_number 和 placeholder 的行
    content_str = content.decode('utf-8', errors='replace')
    for line_num, line in enumerate(content_str.split('\n'), 1):
        if 'floor_number' in line and 'placeholder' in line:
            print(f"Line {line_num}: {line}")
            # 查找 placeholder 和 style 之间的部分
            if '?" style=' in line:
                print("Found broken placeholder (missing quote)")
            elif '" style=' in line:
                # 可能已经有引号了
                print("Has quote before style=")
