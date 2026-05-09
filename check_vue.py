# -*- coding: utf-8 -*-
"""检查 Vue 文件语法"""

file_path = r'D:\WorkBuddy\20260331205655\client\src\views\community\ResourceDetail.vue'
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# 检查是否有未闭合的标签
# 统计 template 标签
open_templates = content.count('<template')
close_templates = content.count('</template>')
print(f"Templates: open={open_templates}, close={close_templates}")

# 统计 div 标签
open_divs = content.count('<div')
close_divs = content.count('</div>')
print(f"Divs: open={open_divs}, close={close_divs}")

# 检查特殊字符
for i, line in enumerate(content.split('\n'), 1):
    if i >= 1000 and i <= 1020:
        print(f"Line {i}: {repr(line)[:100]}")
