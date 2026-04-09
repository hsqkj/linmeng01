@echo off
chcp 65001 >nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT config_value FROM sys_configs WHERE config_key = 'basic_types';" > D:\WorkBuddy\20260331205655\local_basic.txt 2>nul
