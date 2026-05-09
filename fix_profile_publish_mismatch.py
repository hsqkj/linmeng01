#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 Profile.vue 的 @media (max-width: 768px) 部分
移除错误的 PublishDemand.vue 样式，只保留 Profile.vue 自己的移动端样式
"""

import re

file_path = r"D:\WorkBuddy\20260331205655\client\src\views\community\Profile.vue"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到 @media (max-width: 768px) { 的位置
media_start = content.find('@media (max-width: 768px) {')
if media_start == -1:
    print("ERROR: 找不到 @media (max-width: 768px) {")
    exit(1)

# 找到 Profile.vue 移动端专属注释的位置
profile_mobile_start = content.find('/* ========== Profile.vue 移动端专属 ========== */', media_start)
if profile_mobile_start == -1:
    print("ERROR: 找不到 Profile.vue 移动端专属注释")
    exit(1)

# 找到 @media 结束的位置（最后一个 }）
# 从 profile_mobile_start 开始，找到匹配的 }
media_content = content[media_start:]
brace_count = 0
media_end = -1
for i, char in enumerate(media_content):
    if char == '{':
        brace_count += 1
    elif char == '}':
        brace_count -= 1
        if brace_count == 0:
            media_end = media_start + i + 1
            break

if media_end == -1:
    print("ERROR: 找不到 @media 结束位置")
    exit(1)

print(f"找到 @media (max-width: 768px) {{  at position {media_start}")
print(f"找到 Profile.vue 移动端专属 at position {profile_mobile_start}")
print(f"找到 @media 结束位置 at position {media_end}")

# 构建新的内容
# 保留 @media (max-width: 768px) { 到 Profile.vue 移动端专属之前的内容
media_header = content[media_start:profile_mobile_start]

# 保留 Profile.vue 移动端专属到 @media 结束的内容
profile_mobile_content = content[profile_mobile_start:media_end]

# 合并
new_media_block = media_header + profile_mobile_content

# 替换原来的 @media 块
new_content = content[:media_start] + new_media_block + content[media_end:]

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ 已修复 Profile.vue，移除了错误的 PublishDemand.vue 样式")
print(f"原始文件长度: {len(content)} 字符")
print(f"新文件长度: {len(new_content)} 字符")
