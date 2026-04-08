@echo off
chcp 65001 >nul
chdir /d %~dp0

echo ==========================================
echo     邻盟项目 - 腾讯云一键部署工具
echo ==========================================
echo.
echo 服务器: 150.158.12.243
echo 密码: @hanghang0824
echo.

:: 检查是否安装了SSH
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到SSH客户端！
    echo 请安装OpenSSH: 设置 -> 应用 -> 可选功能 -> 添加OpenSSH客户端
    pause
    exit /b 1
)

:: 使用SSH命令执行远程安装
echo [Step 1/5] 正在更新系统并安装Node.js...
echo.

:: 创建临时脚本
echo #!/bin/bash > deploy_temp.sh
echo 'apt update ^&^& apt upgrade -y' >> deploy_temp.sh
echo 'curl -fsSL https://deb.nodesource.com/setup_18.x ^|^ bash - ^&^& apt install -y nodejs npm' >> deploy_temp.sh
echo 'echo "Node.js安装完成"' >> deploy_temp.sh

:: 使用批处理管道方式（自动输入密码）
echo.
echo 正在连接服务器并执行命令...
echo 首次连接需要确认主机密钥，请输入: yes
echo.

:: 使用SSH执行命令（会提示输入密码）
(
echo @hanghang0824
) | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 root@150.158.12.243 "apt update && apt upgrade -y"

echo.
echo [Step 2/5] 安装Node.js...
(echo @hanghang0824) | ssh -o StrictHostKeyChecking=no root@150.158.12.243 "curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs npm"

echo.
echo [Step 3/5] 安装MySQL...
(echo @hanghang0824) | ssh -o StrictHostKeyChecking=no root@150.158.12.243 "apt install -y mysql-server && systemctl start mysql && systemctl enable mysql"

echo.
echo [Step 4/5] 安装Nginx和PM2...
(echo @hanghang0824) | ssh -o StrictHostKeyChecking=no root@150.158.12.243 "apt install -y nginx && systemctl start nginx && systemctl enable nginx && npm install -g pm2"

echo.
echo [Step 5/5] 配置数据库...
(echo @hanghang0824) | ssh -o StrictHostKeyChecking=no root@150.158.12.243 "mysql -e 'CREATE DATABASE IF NOT EXISTS linmeng CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;' && mysql -e \"CREATE USER IF NOT EXISTS 'linmeng'@'localhost' IDENTIFIED BY 'LinMeng@2026';\" && mysql -e 'GRANT ALL PRIVILEGES ON linmeng.* TO 'linmeng'@'localhost';' && mysql -e 'FLUSH PRIVILEGES;' && mkdir -p /var/www/linmeng"

echo.
echo ==========================================
echo     环境部署完成！
echo ==========================================
echo.
echo 下一步：请上传项目代码到 /var/www/linmeng/
echo.
echo 上传代码后，执行以下命令启动服务：
echo.
echo   cd /var/www/linmeng/server
echo   npm install
echo   pm2 start src/app.js --name linmeng-api
echo.
echo   cd /var/www/linmeng/client  
echo   npm install
echo   npm run build
echo.
echo   # 配置Nginx
echo   cat ^> /etc/nginx/sites-available/linmeng ^<^< 'EOF'
echo   server {
echo       listen 80;
echo       server_name 150.158.12.243;
echo       root /var/www/linmeng/client/dist;
echo       index index.html;
echo       location / {
echo           try_files $uri $uri/ /index.html;
echo       }
echo       location /api {
echo           proxy_pass http://localhost:3000;
echo       }
echo   }
echo   EOF
echo.
echo   ln -sf /etc/nginx/sites-available/linmeng /etc/nginx/sites-enabled/
echo   rm -f /etc/nginx/sites-enabled/default
echo   nginx -t ^&^& systemctl reload nginx
echo.
pause
