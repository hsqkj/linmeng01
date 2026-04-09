@echo off
chcp 65001 >nul
set MYSQL="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
set SSH="C:\Windows\System32\OpenSSH\ssh.exe"
set KEY=D:\WorkBuddy\linmeng2026key.pem

echo === 本地各表数据量 === > D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'regions', COUNT(*) FROM regions" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'tags', COUNT(*) FROM tags" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'communities', COUNT(*) FROM communities" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'ambassadors', COUNT(*) FROM ambassadors" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'merchants', COUNT(*) FROM merchants" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'demands', COUNT(*) FROM demands" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'resources', COUNT(*) FROM resources" >> D:\WorkBuddy\20260331205655\compare_result.txt
%MYSQL% -u root -proot linmeng -N -e "SELECT 'banners', COUNT(*) FROM banners" >> D:\WorkBuddy\20260331205655\compare_result.txt

echo. >> D:\WorkBuddy\20260331205655\compare_result.txt
echo === 服务器各表数据量 === >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"regions\", COUNT(*) FROM regions'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"tags\", COUNT(*) FROM tags'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"communities\", COUNT(*) FROM communities'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"ambassadors\", COUNT(*) FROM ambassadors'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"merchants\", COUNT(*) FROM merchants'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"demands\", COUNT(*) FROM demands'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"resources\", COUNT(*) FROM resources'" >> D:\WorkBuddy\20260331205655\compare_result.txt
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -N -e 'SELECT \"banners\", COUNT(*) FROM banners'" >> D:\WorkBuddy\20260331205655\compare_result.txt
