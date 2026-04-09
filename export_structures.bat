@echo off
chcp 65001 >nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "DESCRIBE tags; DESCRIBE regions;" > D:\WorkBuddy\20260331205655\local_structures.txt
