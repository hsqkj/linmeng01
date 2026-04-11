import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='linmeng')
cursor = conn.cursor()

print('=== resources 表结构 ===')
cursor.execute('DESCRIBE resources')
for f in cursor.fetchall():
    print(f[0])

print('\n=== demands 表结构 ===')
cursor.execute('DESCRIBE demands')
for f in cursor.fetchall():
    print(f[0])

conn.close()
