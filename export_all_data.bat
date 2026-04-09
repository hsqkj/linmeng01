@echo off
chcp 65001 >nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -N -e "SELECT CONCAT_WS('\t', id, name, type, category, is_system, status) FROM tags;" > D:\WorkBuddy\20260331205655\tags_data.txt
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -N -e "SELECT CONCAT_WS('\t', id, name, level, parent_id, sort_order) FROM regions ORDER BY id;" > D:\WorkBuddy\20260331205655\regions_data.txt
