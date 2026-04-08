#!/bin/bash
# 邻盟项目 - 腾讯云一键部署脚本
# 服务器IP: 150.158.12.243

set -e

echo "=========================================="
echo "   邻盟项目 - 腾讯云一键部署脚本"
echo "=========================================="
echo ""

# 定义变量
SERVER_IP="150.158.12.243"
PROJECT_DIR="/var/www/linmeng"
DB_NAME="linmeng"
DB_USER="linmeng"
DB_PASS="LinMeng@2026"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. 更新系统
log_info "Step 1: 更新系统软件..."
apt update && apt upgrade -y

# 2. 安装Node.js 18
log_info "Step 2: 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v
npm -v

# 3. 安装MySQL
log_info "Step 3: 安装 MySQL..."
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 4. 安装Nginx
log_info "Step 4: 安装 Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 5. 安装PM2
log_info "Step 5: 安装 PM2..."
npm install -g pm2
pm2 install pm2-logrotate

# 6. 配置MySQL
log_info "Step 6: 配置数据库..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
log_info "数据库创建完成！"

# 7. 创建项目目录
log_info "Step 7: 创建项目目录..."
mkdir -p ${PROJECT_DIR}
cd ${PROJECT_DIR}

# 8. 创建后端配置
log_info "Step 8: 配置后端环境..."
cat > ${PROJECT_DIR}/server/.env << EOF
PORT=3000
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
JWT_SECRET=LinMeng_JWT_Secret_2026_SecureKey
UPLOAD_PATH=/var/www/linmeng/uploads
EOF

# 9. 安装后端依赖
log_info "Step 9: 安装后端依赖..."
cd ${PROJECT_DIR}/server
npm install --legacy-peer-deps

# 10. 启动后端
log_info "Step 10: 启动后端服务..."
pm2 delete linmeng-api 2>/dev/null || true
pm2 start src/app.js --name linmeng-api
pm2 startup
pm2 save

# 11. 配置Nginx
log_info "Step 11: 配置 Nginx..."
cat > /etc/nginx/sites-available/linmeng << 'EOF'
server {
    listen 80;
    server_name 150.158.12.243;
    
    client_max_body_size 50M;

    # 前端静态文件
    location / {
        root /var/www/linmeng/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源
    location /uploads {
        alias /var/www/linmeng/uploads;
        expires 7d;
    }
}
EOF

ln -sf /etc/nginx/sites-available/linmeng /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 12. 防火墙配置
log_info "Step 12: 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}服务状态：${NC}"
pm2 status
echo ""
echo -e "${GREEN}访问地址：${NC} http://150.158.12.243"
echo ""
echo -e "${YELLOW}下一步操作：${NC}"
echo "1. 将项目代码上传到 /var/www/linmeng/"
echo "2. 前端构建: cd /var/www/linmeng/client && npm install && npm run build"
echo "3. 配置域名解析指向此服务器"
echo ""
