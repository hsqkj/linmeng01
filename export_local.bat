@echo off
chcp 65001 >nul
set MYSQL="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"

%MYSQL% -u root -proot linmeng -e "SELECT config_key, LENGTH(config_value) as len FROM sys_configs ORDER BY config_key;" > D:\WorkBuddy\20260331205655\local_configs.txt
%MYSQL% -u root -proot linmeng -e "SELECT 'regions', COUNT(*) FROM regions UNION ALL SELECT 'tags', COUNT(*) FROM tags UNION ALL SELECT 'communities', COUNT(*) FROM communities UNION ALL SELECT 'ambassadors', COUNT(*) FROM ambassadors UNION ALL SELECT 'merchants', COUNT(*) FROM merchants UNION ALL SELECT 'demands', COUNT(*) FROM demands UNION ALL SELECT 'resources', COUNT(*) FROM resources UNION ALL SELECT 'banners', COUNT(*) FROM banners;" >> D:\WorkBuddy\20260331205655\local_configs.txt
%MYSQL% -u root -proot linmeng -e "SELECT config_value FROM sys_configs WHERE config_key = 'member_levels';" >> D:\WorkBuddy\20260331205655\local_configs.txt
