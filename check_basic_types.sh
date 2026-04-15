#!/bin/bash
mysql -u root -proot linmeng linmeng -e "SELECT LEFT(config_value, 1000) FROM sys_configs WHERE config_key = 'basic_types'" 2>/dev/null
