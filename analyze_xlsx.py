import pandas as pd

df = pd.read_excel('D:/0好社区/1社区/区街社区地址表22.xlsx', dtype=str)
df.columns = ['id', 'qname', 'level', 'qsjid', 'qdelte', 'qlogo']
df['level'] = df['level'].str.strip()

level_names = {'1': '市', '2': '区', '3': '街道', '4': '社区', '5': '小区', '6': '楼栋单元'}

print("=== 各层级数量 ===")
for lv, name in level_names.items():
    count = len(df[df['level'] == lv])
    print(f"  层级{lv}（{name}）：{count} 条")

print(f"\n总行数：{len(df)}")

print("\n=== 层级5、6 样本 ===")
sample56 = df[df['level'].isin(['5', '6'])]
if len(sample56) > 0:
    print(sample56.head(10).to_string())
else:
    print("  无层级5、6数据")

print("\n=== 各区名称（层级2）===")
districts = df[df['level'] == '2'][['id', 'qname', 'qsjid']].reset_index(drop=True)
print(districts.to_string())

print("\n=== 街道总数（层级3）===")
streets = df[df['level'] == '3']
print(f"共 {len(streets)} 个街道")

print("\n=== 社区总数（层级4）===")
communities = df[df['level'] == '4']
print(f"共 {len(communities)} 个社区")
