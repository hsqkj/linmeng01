#!/bin/bash
sudo mysql -u root -proot linmeng -e "SELECT config_value FROM sys_configs WHERE config_key = 'member_levels';"
