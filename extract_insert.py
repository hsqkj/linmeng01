#!/usr/bin/env python3
import subprocess
import re
import os

# 读取SQL文件
with open(r'D:\WorkBuddy\20260331205655\demands_data.sql', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 提取INSERT语句
match = re.search(r'(INSERT INTO [^;]+;)', content, re.DOTALL)
if match:
    sql = match.group(1)
    # 写入临时文件
    with open(r'D:\WorkBuddy\20260331205655\demands_insert.sql', 'w', encoding='utf-8') as f:
        f.write('SET FOREIGN_KEY_CHECKS=0;\n')
        f.write(sql)
        f.write('\nSET FOREIGN_KEY_CHECKS=1;')
    print(f"Extracted SQL: {len(sql)} chars")

    # 执行SQL
    mysql = r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
    result = subprocess.run([mysql, '-u', 'root', '-proot', 'linmeng'],
                           input=open(r'D:\WorkBuddy\20260331205655\demands_insert.sql', 'rb'),
                           capture_output=True)
    print(f"Return code: {result.returncode}")
    print(f"Stderr: {result.stderr.decode('utf-8', errors='ignore')[:200]}")
else:
    print("No INSERT found")
