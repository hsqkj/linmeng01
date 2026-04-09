@echo off
chcp 65001 >nul

:: 导出 tags 数据
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT id, name, type, color, status, sort_order FROM tags;" > D:\WorkBuddy\20260331205655\local_tags.txt

:: 导出 regions 数据
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT id, name, code, level, parent_id, sort_order FROM regions ORDER BY code;" > D:\WorkBuddy\20260331205655\local_regions.txt

:: 导出 expert_types 完整配置
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT config_value FROM sys_configs WHERE config_key = 'expert_types';" > D:\WorkBuddy\20260331205655\local_expert_types.txt

:: 导出 basic_types 完整配置（包含企业类型）
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT config_value FROM sys_configs WHERE config_key = 'basic_types';" > D:\WorkBuddy\20260331205655\local_basic_types.txt

echo Export complete
