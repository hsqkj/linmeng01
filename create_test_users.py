# -*- coding: utf-8 -*-
"""Create test accounts"""
import mysql.connector
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root',
    database='linmeng'
)
cur = conn.cursor()

# Community test account
cur.execute("""
    INSERT IGNORE INTO communities
    (username, password, real_name, phone, community, district, street, status, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
""", ('18800000001', '$2a$10$test', 'Test User', '18800000001', 'Test Community', 'Jiang\'an District', 'Houhu Street', 1))
conn.commit()
print('[OK] Community test account: 18800000001')

# Merchant test account
cur.execute("""
    INSERT IGNORE INTO merchants
    (username, password, company_name, contact_name, phone, industry, status, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
""", ('18800000002', '$2a$10$test', 'Test Merchant Co', 'Test Merchant', '18800000002', 'Education', 1))
conn.commit()
print('[OK] Merchant test account: 18800000002')

# Ambassador test account
cur.execute("""
    INSERT IGNORE INTO ambassadors
    (username, password, real_name, phone, qr_code, status, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, NOW())
""", ('18800000003', '$2a$10$test', 'Test Ambassador', '18800000003', 'LM88888888', 1))
conn.commit()
print('[OK] Ambassador test account: 18800000003')

# Verify
cur.execute('SELECT username, real_name FROM communities WHERE phone="18800000001"')
print('Community:', cur.fetchone())

cur.execute('SELECT username, company_name FROM merchants WHERE phone="18800000002"')
print('Merchant:', cur.fetchone())

cur.execute('SELECT username, real_name FROM ambassadors WHERE phone="18800000003"')
print('Ambassador:', cur.fetchone())

cur.close()
conn.close()
print('\nAll test accounts created!')
