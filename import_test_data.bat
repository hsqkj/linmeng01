@echo off
chcp 65001 >nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng --binary-mode=1 < "D:\WorkBuddy\20260331205655\test_data.sql"
