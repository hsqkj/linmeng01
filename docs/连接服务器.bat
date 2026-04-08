@echo off
chcp 65001 >nul
echo ========================================
echo   邻盟项目 - 服务器上传工具
echo ========================================
echo.
echo 请在WinSCP中填入以下信息：
echo.
echo 【连接信息】
echo   主机名: 150.158.12.243
echo   端口号: 22
echo   用户名: root
echo   密码: @hanghang0824
echo.
echo 【登录后操作】
echo   1. 左侧选择: D:\WorkBuddy\20260331205655\deploy-package
echo   2. 右侧选择: /var/www/linmeng
echo   3. 上传所有文件
echo.
echo 按任意键打开WinSCP...
pause >nul
start winscp
