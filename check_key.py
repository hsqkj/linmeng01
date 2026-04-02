import sys
with open(r'c:\Users\12494\WorkBuddy\20260331205655\client\src\views\admin\UsersMerchant.vue', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines[94:99], start=95):
    print(f'{i}: {repr(line)}')
