@echo off
chcp 65001 >nul
echo === 服务器数据库配置 === > D:\WorkBuddy\20260331205655\server_configs.txt
plink -batch -i "D:\WorkBuddy\linmeng2026key.pem" root@150.158.12.243 "mysql -u root -proot linmeng -e \"SELECT config_key, LENGTH(config_value) as len FROM sys_configs ORDER BY config_key;\"" >> D:\WorkBuddy\20260331205655\server_configs.txt 2>&1
echo. >> D:\WorkBuddy\20260331205655\server_configs.txt
echo === 服务器各表数据量 === >> D:\WorkBuddy\20260331205655\server_configs.txt
plink -batch -i "D:\WorkBuddy\linmeng2026key.pem" root@150.158.12.243 "mysql -u root -proot linmeng -e \"SELECT 'regions', COUNT(*) FROM regions UNION ALL SELECT 'tags', COUNT(*) FROM tags UNION ALL SELECT 'communities', COUNT(*) FROM communities UNION ALL SELECT 'ambassadors', COUNT(*) FROM ambassadors UNION ALL SELECT 'merchants', COUNT(*) FROM merchants UNION ALL SELECT 'demands', COUNT(*) FROM demands UNION ALL SELECT 'resources', COUNT(*) FROM resources UNION ALL SELECT 'banners', COUNT(*) FROM banners;\"" >> D:\WorkBuddy\20260331205655\server_configs.txt 2>&1
echo. >> D:\WorkBuddy\20260331205655\server_configs.txt
echo === 服务器member_levels === >> D:\WorkBuddy\20260331205655\server_configs.txt
plink -batch -i "D:\WorkBuddy\linmeng2026key.pem" root@150.158.12.243 "mysql -u root -proot linmeng -e \"SELECT config_value FROM sys_configs WHERE config_key = 'member_levels';\"" >> D:\WorkBuddy\20260331205655\server_configs.txt 2>&1
