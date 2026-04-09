@echo off
chcp 65001 >nul
set MYSQL="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
echo === 本地数据库配置 ===
%MYSQL% -u root -proot linmeng -e "SELECT config_key, LEFT(config_value, 200) FROM sys_configs ORDER BY config_key;"

echo.
echo === 本地各表数据量 ===
%MYSQL% -u root -proot linmeng -e "SELECT 'regions' as tbl, COUNT(*) FROM regions UNION SELECT 'tags', COUNT(*) FROM tags UNION SELECT 'communities', COUNT(*) FROM communities UNION SELECT 'ambassadors', COUNT(*) FROM ambassadors UNION SELECT 'merchants', COUNT(*) FROM merchants UNION SELECT 'demands', COUNT(*) FROM demands UNION SELECT 'resources', COUNT(*) FROM resources UNION SELECT 'banners', COUNT(*) FROM banners UNION SELECT 'intentions', COUNT(*) FROM intentions;"

echo.
echo === 本地会员等级配置完整内容 ===
%MYSQL% -u root -proot linmeng -e "SELECT config_value FROM sys_configs WHERE config_key = 'member_levels';"
