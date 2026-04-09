#!/usr/bin/env python3
import os
import subprocess

# 服务器数据导出
print("Exporting from server...")
dump_result = subprocess.run([
    'ssh', '-i', r'D:\WorkBuddy\linmeng2026key.pem',
    'ubuntu@150.158.12.243',
    'mysqldump -u root -proot linmeng demands resources comments --no-create-info --single-transaction --quick'
], capture_output=True)

if dump_result.returncode != 0:
    print(f"Dump error: {dump_result.stderr}")
    exit(1)

# 保存到文件（原始字节）
with open(r'D:\WorkBuddy\20260331205655\test_data_new.sql', 'wb') as f:
    f.write(dump_result.stdout)

print(f"Dumped {len(dump_result.stdout)} bytes")

# 先清空表
print("Clearing local tables...")
clear_result = subprocess.run([
    r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
    '-u', 'root',
    '-proot',
    'linmeng',
    '-e', 'SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE demands; TRUNCATE TABLE resources; TRUNCATE TABLE comments; SET FOREIGN_KEY_CHECKS=1;'
], capture_output=True)
print(f"Clear result: {clear_result.returncode}")

# 导入到本地
print("Importing to local...")
mysql_result = subprocess.run([
    r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
    '-u', 'root',
    '-proot',
    'linmeng',
    '--binary-mode=1'
], stdin=open(r'D:\WorkBuddy\20260331205655\test_data_new.sql', 'rb'),
   capture_output=True)

if mysql_result.returncode != 0:
    print(f"Import error: {mysql_result.stderr.decode('utf-8', errors='ignore')}")
else:
    print("Import completed successfully!")

# 验证
verify_result = subprocess.run([
    r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
    '-u', 'root',
    '-proot',
    'linmeng',
    '-e', 'SELECT COUNT(*) FROM demands; SELECT COUNT(*) FROM resources;'
], capture_output=True)
print(verify_result.stdout.decode('utf-8', errors='ignore'))
