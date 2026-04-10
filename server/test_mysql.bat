@echo off
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -N -e "SELECT config_key FROM sys_configs LIMIT 3"
