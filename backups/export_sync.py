import subprocess
import sys

# 用 mysqldump 导出带列名的 SQL，然后 Python 处理 BOM 问题
tables = [
    'community_user', 'merchant_user', 'admins', 'ambassadors',
    'demands', 'resources', 'merchants', 'communities',
    'tags', 'tag_library', 'salesmen', 'member_package',
    'sys_configs', 'wuhan_community', 'regions'
]

output_file = r'D:\WorkBuddy\20260331205655\backups\sync_complete.sql'

cmd = [
    r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe',
    '-u', 'root', '-proot',
    '--replace',
    '--no-create-info',
    '--skip-triggers',
    '--complete-insert',
    '--default-character-set=utf8mb4',
    'linmeng'
] + tables

print("Running mysqldump...")
result = subprocess.run(cmd, capture_output=True)

if result.returncode != 0:
    print("STDERR:", result.stderr.decode('utf-8', errors='replace'))
    sys.exit(1)

# 写出 UTF-8 不带 BOM
with open(output_file, 'wb') as f:
    f.write(result.stdout)

size_kb = len(result.stdout) / 1024
print(f"Done! Output: {output_file} ({size_kb:.1f} KB)")
print("First 100 bytes hex:", result.stdout[:100].hex())
