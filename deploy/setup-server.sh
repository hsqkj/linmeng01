#!/bin/bash
# 服务器初始化脚本
# 在腾讯云服务器上执行此脚本进行环境配置

set -e

echo "=========================================="
echo "  邻盟项目服务器初始化脚本"
echo "=========================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 更新系统
update_system() {
    log "更新系统软件包..."
    apt-get update
    apt-get upgrade -y
    log "系统更新完成"
}

# 安装Node.js
install_nodejs() {
    log "安装Node.js..."
    
    # 安装NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    log "Node.js版本: ${node_version}"
    log "npm版本: ${npm_version}"
}

# 安装MySQL
install_mysql() {
    log "安装MySQL..."
    
    apt-get install -y mysql-server
    
    # 启动MySQL
    systemctl start mysql
    systemctl enable mysql
    
    # 安全配置
    log "配置MySQL..."
    mysql -e "CREATE DATABASE IF NOT EXISTS linmeng CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -e "CREATE USER IF NOT EXISTS 'linmeng'@'localhost' IDENTIFIED BY 'linmeng_password_2026';"
    mysql -e "GRANT ALL PRIVILEGES ON linmeng.* TO 'linmeng'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
    
    log "MySQL安装完成"
    log "数据库: linmeng"
    log "用户名: linmeng"
    log "密码: linmeng_password_2026"
}

# 安装Nginx
install_nginx() {
    log "安装Nginx..."
    
    apt-get install -y nginx
    
    # 启动Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
    
    log "Nginx安装完成"
}

# 安装PM2
install_pm2() {
    log "安装PM2..."
    
    npm install -g pm2
    
    # 配置PM2开机自启
    pm2 startup systemd -u root --hp /root
    
    log "PM2安装完成"
}

# 安装其他工具
install_tools() {
    log "安装其他必要工具..."
    
    apt-get install -y \
        git \
        curl \
        wget \
        vim \
        unzip \
        rsync \
        certbot \
        python3-certbot-nginx
    
    log "工具安装完成"
}

# 配置防火墙
setup_firewall() {
    log "配置防火墙..."
    
    # 安装UFW
    apt-get install -y ufw
    
    # 允许SSH
    ufw allow OpenSSH
    
    # 允许HTTP和HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # 允许Node.js服务端口（内部使用）
    ufw allow 3000/tcp
    
    # 启用防火墙
    ufw --force enable
    
    log "防火墙配置完成"
}

# 配置SSL证书
setup_ssl() {
    log "配置SSL证书..."
    
    read -p "是否申请SSL证书? (y/n): " confirm
    if [[ $confirm == [yY] ]]; then
        certbot --nginx -d 3qall.com -d www.3qall.com --non-interactive --agree-tos --email admin@3qall.com
        
        # 配置自动续期
        systemctl enable certbot.timer
        systemctl start certbot.timer
        
        log "SSL证书配置完成"
    else
        warn "跳过SSL证书配置"
    fi
}

# 主函数
main() {
    log "开始初始化服务器..."
    
    # 检查root权限
    if [[ $EUID -ne 0 ]]; then
       error "请使用root权限运行此脚本"
       exit 1
    fi
    
    update_system
    install_nodejs
    install_mysql
    install_nginx
    install_pm2
    install_tools
    setup_firewall
    setup_ssl
    
    echo ""
    echo "=========================================="
    log "服务器初始化完成!"
    echo "=========================================="
    echo ""
    echo "已安装的软件:"
    echo "  - Node.js $(node --version)"
    echo "  - MySQL $(mysql --version | head -1 | awk '{print $5}')"
    echo "  - Nginx $(nginx -v 2>&1 | head -1 | awk -F/ '{print $2}')"
    echo "  - PM2 $(pm2 --version)"
    echo ""
    echo "下一步:"
    echo "  1. 在本地运行 ./deploy.sh 进行项目部署"
    echo "  2. 访问 http://3qall.com 查看网站"
    echo ""
}

# 执行主函数
main
