# -*- coding: utf-8 -*-
"""修复 Profile.vue 中所有 placeholder 语法错误"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 使用正则表达式修复所有 placeholder 后面缺少引号的情况
# 匹配 placeholder="xxx? style= (placeholder 属性值后面缺少结束引号)
import re

# 修复模式: placeholder="...?" 后直接跟空格和 style= 而不是引号结束
# 找到 placeholder="xxx?" 后面缺少引号的情况
def fix_placeholder(match):
    prefix = match.group(1)  # placeholder=" 之前的内容
    value = match.group(2)   # placeholder 的值
    rest = match.group(3)    # ? 后面的内容
    
    # 在 ? 后添加引号
    return prefix + 'placeholder="' + value + '?"' + rest

# 匹配 placeholder="xxx"? style=" 的模式，其中引号被截断
# 原始: placeholder="绗?灞? style="
# 修复后: placeholder="绗?灞?" style="

# 使用更简单的策略：直接替换特定模式
# 1. 修复 placeholder="銕?style=
content = content.replace('placeholder="銕? style=', 'placeholder="銕?" style=')
# 2. 修复 placeholder="浜?style=
content = content.replace('placeholder="浜? style=', 'placeholder="浜?" style=')
# 3. 修复 placeholder="绗?灞?style=
content = content.replace('placeholder="绗?灞? style=', 'placeholder="绗?灞?" style=')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("placeholder 修复完成")
