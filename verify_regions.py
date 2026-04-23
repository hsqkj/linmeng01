import pandas as pd
df = pd.read_excel('D:/0好社区/1社区/区街社区地址表22.xlsx', dtype=str)
df.columns = ['id', 'qname', 'level', 'qsjid', 'qdelte', 'qlogo']
df['qsjid'] = df['qsjid'].str.strip()
df['level'] = df['level'].str.strip()

# 找 qsjid=596 的街道
streets = df[(df['level'] == '3') & (df['qsjid'] == '596')]
print('qsjid=596 的街道：')
for _, r in streets.iterrows():
    print(f'  id={r["id"]} {r["qname"]}')

# 确认 596 是什么
parent = df[df['id'] == '596']
name = parent['qname'].values[0] if len(parent) > 0 else '未找到'
print(f'\nid=596 的名称：{name}')

# 洪山区和东湖新技术开发区的 id
print('\n层级2（所有区）：')
districts = df[df['level'] == '2'][['id', 'qname']]
for _, r in districts.iterrows():
    print(f'  id={r["id"]:>4} {r["qname"]}')
