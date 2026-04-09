@echo off
chcp 65001 >nul
set SSH="C:\Windows\System32\OpenSSH\ssh.exe"
set KEY=D:\WorkBuddy\linmeng2026key.pem

echo === 同步缺失的配置到服务器 ===

:: 1. anti_flying
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -e \"INSERT INTO sys_configs (config_key, config_value, config_type, description, updated_at) VALUES ('anti_flying', '{\\"filterRules\\":{\\"phone\\":true,\\"wechat\\":true,\\"qq\\":true,\\"email\\":true,\\"url\\":true},\\"autoWarn\\":true,\\"autoBan\\":false}', 'flying', '防飞单规则配置', NOW()) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value), updated_at=NOW();\""

echo anti_flying done

:: 2. expert_types  
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -e \"INSERT INTO sys_configs (config_key, config_value, config_type, description, updated_at) VALUES ('expert_types', '[{\\"name\\":\\"法律咨询\\",\\"status\\":1,\\"sort_order\\":1},{\\"name\\":\\"医疗健康\\",\\"status\\":1,\\"sort_order\\":2},{\\"name\\":\\"心理辅导\\",\\"status\\":1,\\"sort_order\\":3},{\\"name\\":\\"教育培训\\",\\"status\\":1,\\"sort_order\\":4},{\\"name\\":\\"技能培训\\",\\"status\\":1,\\"sort_order\\":5},{\\"name\\":\\"金融理财\\",\\"status\\":1,\\"sort_order\\":6},{\\"name\\":\\"社会工作\\",\\"status\\":1,\\"sort_order\\":7},{\\"name\\":\\"文艺指导\\",\\"status\\":1,\\"sort_order\\":8},{\\"name\\":\\"体育健身\\",\\"status\\":1,\\"sort_order\\":9},{\\"name\\":\\"营养指导\\",\\"status\\":1,\\"sort_order\\":10},{\\"name\\":\\"IT技术\\",\\"status\\":1,\\"sort_order\\":11},{\\"name\\":\\"财务税务\\",\\"status\\":1,\\"sort_order\\":12},{\\"name\\":\\"人力资源\\",\\"status\\":1,\\"sort_order\\":13},{\\"name\\":\\"亲子教育\\",\\"status\\":1,\\"sort_order\\":14},{\\"name\\":\\"老年服务\\",\\"status\\":1,\\"sort_order\\":15},{\\"name\\":\\"志愿服务\\",\\"status\\":1,\\"sort_order\\":16},{\\"name\\":\\"环保公益\\",\\"status\\":1,\\"sort_order\\":17},{\\"name\\":\\"社区建设\\",\\"status\\":1,\\"sort_order\\":18},{\\"name\\":\\"婚姻家庭\\",\\"status\\":1,\\"sort_order\\":19},{\\"name\\":\\"职业规划\\",\\"status\\":1,\\"sort_order\\":20},{\\"name\\":\\"中医养生\\",\\"status\\":1,\\"sort_order\\":22},{\\"name\\":\\"瑜伽冥想\\",\\"status\\":1,\\"sort_order\\":23},{\\"name\\":\\"宠物护理\\",\\"status\\":1,\\"sort_order\\":24},{\\"name\\":\\"家居装修\\",\\"status\\":1,\\"sort_order\\":25},{\\"name\\":\\"汽车维修\\",\\"status\\":1,\\"sort_order\\":26},{\\"name\\":\\"摄影摄像\\",\\"status\\":1,\\"sort_order\\":27},{\\"name\\":\\"美妆造型\\",\\"status\\":1,\\"sort_order\\":28},{\\"name\\":\\"烹饪烘焙\\",\\"status\\":1,\\"sort_order\\":29},{\\"name\\":\\"其他\\",\\"status\\":1,\\"sort_order\\":99}]', 'basic', '专家类型配置', NOW()) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value), updated_at=NOW();\""

echo expert_types done

:: 3. level_bonus
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -e \"INSERT INTO sys_configs (config_key, config_value, config_type, description, updated_at) VALUES ('level_bonus', '[{\\"level\\":1,\\"bonus\\":1},{\\"level\\":2,\\"bonus\\":1.2},{\\"level\\":3,\\"bonus\\":1.5},{\\"level\\":4,\\"bonus\\":1.8},{\\"level\\":5,\\"bonus\\":2}]', 'reward', '等级奖励配置', NOW()) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value), updated_at=NOW();\""

echo level_bonus done

:: 4. reward_base
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -e \"INSERT INTO sys_configs (config_key, config_value, config_type, description, updated_at) VALUES ('reward_base', '{\\"rewardValue\\":50,\\"rewardDesc\\":\\"撮合成功奖励物资（价值约50元）\\",\\"rewardType\\":\\"both\\",\\"enabled\\":true,\\"deliveryMethod\\":\\"auto\\",\\"monthlyLimit\\":50,\\"firstOrderBonus\\":100,\\"streakBonus\\":200,\\"highQualityBonus\\":50}', 'reward', '撮合奖励基础配置', NOW()) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value), updated_at=NOW();\""

echo reward_base done

echo === 验证同步结果 ===
%SSH% -i %KEY% -o StrictHostKeyChecking=no ubuntu@150.158.12.243 "mysql -u root -proot linmeng -e 'SELECT config_key, LENGTH(config_value) as len FROM sys_configs ORDER BY config_key;'"
