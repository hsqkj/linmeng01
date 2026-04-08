# 邻盟项目 - 腾讯云一键部署脚本 (PowerShell版)
# 服务器IP: 150.158.12.243

$Server = "150.158.12.243"
$User = "root"
$Pass = "@hanghang0824"

# 颜色
function Write-Step($msg) {
    Write-Host "[*] $msg" -ForegroundColor Cyan
}
function Write-Success($msg) {
    Write-Host "[✓] $msg" -ForegroundColor Green
}
function Write-Err($msg) {
    Write-Host "[✗] $msg" -ForegroundColor Red
}

Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "   邻盟项目 - 腾讯云一键部署" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

Write-Step "Step 1: 连接服务器..."

# 使用SSH命令执行远程命令
$cmd = @"
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs npm
apt install -y mysql-server && systemctl start mysql && systemctl enable mysql
apt install -y nginx && systemctl start nginx && systemctl enable nginx
npm install -g pm2
mysql -e "CREATE DATABASE IF NOT EXISTS linmeng CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'linmeng'@'localhost' IDENTIFIED BY 'LinMeng@2026';"
mysql -e "GRANT ALL PRIVILEGES ON linmeng.* TO 'linmeng'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
mkdir -p /var/www/linmeng
echo 'DONE'
"@

# 尝试使用SSH执行命令
Write-Step "正在安装环境 (这可能需要几分钟)..."

# 检查SSH客户端
$sshCmd = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshCmd) {
    Write-Err "未找到SSH客户端，请确保已安装OpenSSH"
    Write-Host "提示: 设置 -> 应用 -> 可选功能 -> 添加OpenSSH客户端"
    pause
    exit 1
}

# 使用SSH执行命令（需要手动输入密码）
Write-Host ""
Write-Host "请在打开的SSH会话中输入密码: @hanghang0824" -ForegroundColor Yellow
Write-Host ""

# 启动SSH会话
Start-Process "ssh" -ArgumentList "$User@$Server"
Write-Host "已在新的终端窗口打开SSH会话"
Write-Host ""
Write-Host "请在SSH窗口中复制粘贴以下命令：" -ForegroundColor Green
Write-Host ""
Write-Host "===== 复制以下内容 =====" -ForegroundColor Cyan
Write-Host @"
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs npm
apt install -y mysql-server && systemctl start mysql && systemctl enable mysql
apt install -y nginx && systemctl start nginx && systemctl enable nginx
npm install -g pm2
mysql -e "CREATE DATABASE IF NOT EXISTS linmeng CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'linmeng'@'localhost' IDENTIFIED BY 'LinMeng@2026';"
mysql -e "GRANT ALL PRIVILEGES ON linmeng.* TO 'linmeng'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
mkdir -p /var/www/linmeng
echo '环境安装完成！'
"@
Write-Host "===== 以上内容 =====" -ForegroundColor Cyan
Write-Host ""
pause
