import mysql.connector
import sys

# 连接本地MySQL
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root',
    database='linmeng',
    charset='utf8mb4'
)
cursor = conn.cursor()

# 读取SQL文件
with open(r'D:\WorkBuddy\20260331205655\regions_server.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# 执行SQL
for statement in sql_content.split(';'):
    statement = statement.strip()
    if statement:
        try:
            cursor.execute(statement)
            conn.commit()
        except Exception as e:
            print(f"Error: {e}")
            print(f"Statement: {statement[:100]}...")

cursor.close()
conn.close()
print("Done!")
