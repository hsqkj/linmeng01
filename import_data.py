import subprocess
import sys

# 先清空本地表
result = subprocess.run([
    r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "-u", "root",
    "-proot",
    "linmeng",
    "-e", "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE demands; TRUNCATE TABLE resources; TRUNCATE TABLE comments; SET FOREIGN_KEY_CHECKS=1;"
], capture_output=True, text=True)
print("Clear:", result.returncode)

# 从服务器获取数据并导入
dump_proc = subprocess.Popen([
    "ssh", "-i", r"D:\WorkBuddy\linmeng2026key.pem",
    "ubuntu@150.158.12.243",
    "mysqldump -u root -proot linmeng demands resources comments --single-transaction --quick"
], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

import_proc = subprocess.Popen([
    r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "-u", "root",
    "-proot",
    "linmeng",
    "--binary-mode=1"
], stdin=dump_proc.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

stdout, stderr = import_proc.communicate()
print("Import stdout:", stdout.decode('utf-8', errors='ignore')[:500])
print("Import stderr:", stderr.decode('utf-8', errors='ignore')[:500])
print("Import returncode:", import_proc.returncode)
