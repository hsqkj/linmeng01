@echo off
chcp 65001 >nul
echo ==========================================
echo    邻盟项目 - 腾讯云一键部署
echo ==========================================
echo.
echo 服务器: 150.158.12.243
echo 密码: @hanghang0824
echo.

echo [Step 1/2] 正在连接服务器并安装环境...
echo 请在新窗口中输入密码: @hanghang0824
echo.

start cmd /k "ssh root@150.158.12.243"

echo.
echo ==========================================
echo   SSH会话已打开，请执行以下操作：
echo ==========================================
echo.
echo 1. 在SSH窗口中输入密码: @hanghang0824
echo.
echo 2. 登录成功后，复制以下命令粘贴执行：
echo.
echo ==========================================
echo 复制下面这段命令（选中后Ctrl+C）:
echo ==========================================
echo.
echo apt update && apt upgrade -y && curl -fsSL https://deb.nodesource.com/setup_18.x ^|^ bash - && apt install -y nodejs npm && apt install -y mysql-server && systemctl start mysql && systemctl enable mysql && apt install -y nginx && systemctl start nginx && systemctl enable nginx && npm install -g pm2 && mysql -e "CREATE DATABASE IF NOT EXISTS linmeng CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" && mysql -e "CREATE USER IF NOT EXISTS 'linmeng'@'localhost' IDENTIFIED BY 'LinMeng@2026';" && mysql -e "GRANT ALL PRIVILEGES ON linmeng.* TO 'linmeng'@'localhost';" && mysql -e "FLUSH PRIVILEGES;" && mkdir -p /var/www/linmeng && echo "环境安装完成！"
echo.
echo ==========================================
echo.
pause
