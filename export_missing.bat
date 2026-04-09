@echo off
chcp 65001 >nul
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -proot linmeng -e "SELECT config_key, config_value FROM sys_configs WHERE config_key IN ('anti_flying', 'expert_types', 'level_bonus', 'reward_base', 'regions');" > D:\WorkBuddy\20260331205655\missing_configs.txt
