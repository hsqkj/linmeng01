import pymysql
import sys

try:
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='root',
        database='linmeng'
    )
    cursor = conn.cursor()
    cursor.execute("SELECT config_value FROM sys_configs WHERE config_key='ambassador_commission'")
    result = cursor.fetchone()
    if result:
        print("ambassador_commission 配置:")
        print(result[0][:200])
    else:
        print("配置不存在")
    conn.close()
except Exception as e:
    print(f"错误: {e}")
