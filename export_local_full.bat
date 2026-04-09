@echo off
chcp 65001 >nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT config_key FROM sys_configs ORDER BY config_key;" > D:\WorkBuddy\20260331205655\local_keys.txt
