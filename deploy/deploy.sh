#!/bin/bash
# 邻盟项目部署脚本
# 服务器: 150.158.12.243
# 域名: 3qall.com

set -e

echo "=========================================="
echo "  邻盟项目部署脚本"
echo "=========================================="

# 配置
PROJECT_NAME="linmeng"
SERVER_IP="150.158.12.243"
DOMAIN="3qall.com"
REMOTE_USER="root"
REMOTE_DIR="/opt/linmeng"
NGINX_CONF="/etc/nginx/sites-available/linmeng"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查SSH连接
check_ssh() {
    log "检查SSH连接..."
    if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} "echo 'SSH OK'" > /dev/null 2>&1; then
        error "无法连接到服务器 ${SERVER_IP}"
        error "请确保:"
        error "1. 服务器IP正确"
        error "2. 已配置SSH密钥登录"
        error "3. 服务器已开启SSH服务"
        exit 1
    fi
    log "SSH连接正常"
}

# 创建远程目录结构
create_remote_dirs() {
    log "创建远程目录结构..."
    ssh ${REMOTE_USER}@${SERVER_IP} "
        mkdir -p ${REMOTE_DIR}/{server,uploads}
        mkdir -p ${REMOTE_DIR}/server/src
        mkdir -p ${REMOTE_DIR}/server/scripts
    "
}

# 上传文件
upload_files() {
    log "上传项目文件..."
    
    # 上传后端代码
    rsync -avz --progress \
        --exclude='node_modules' \
        --exclude='.env' \
        --exclude='*.log' \
        ../server/src/ ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/server/src/
    
    rsync -avz --progress \
        ../server/scripts/ ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/server/scripts/
    
    rsync -avz --progress \
        ../server/package*.json ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/server/
    
    # 上传前端构建文件
    rsync -avz --progress \
        ../client/dist/ ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/dist/
    
    # 上传上传目录
    rsync -avz --progress \
        ../server/uploads/ ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/uploads/
    
    log "文件上传完成"
}

# 配置环境变量
setup_env() {
    log "配置环境变量..."
    
    ssh ${REMOTE_USER}@${SERVER_IP} "cat > ${REMOTE_DIR}/server/.env << 'EOF'
# 邻盟后端环境配置

# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=linmeng
DB_PASSWORD=linmeng_password_2026
DB_NAME=linmeng

# JWT配置
JWT_SECRET=linmeng_jwt_secret_2026_secure_key
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_PATH=../uploads
MAX_FILE_SIZE=10485760
EOF"
    
    log "环境变量配置完成"
}

# 安装依赖
install_deps() {
    log "安装后端依赖..."
    ssh ${REMOTE_USER}@${SERVER_IP} "
        cd ${REMOTE_DIR}/server && npm install --production
    "
}

# 配置Nginx
setup_nginx() {
    log "配置Nginx..."
    
    ssh ${REMOTE_USER}@${SERVER_IP} "cat > ${NGINX_CONF} << 'EOF'
server {
    listen 80;
    server_name 3qall.com www.3qall.com;
    
    # 前端静态文件
    location / {
        root ${REMOTE_DIR}/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF"
    
    # 启用站点
    ssh ${REMOTE_USER}@${SERVER_IP} "
        ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/linmeng
        nginx -t && systemctl reload nginx
    "
    
    log "Nginx配置完成"
}

# 配置PM2
setup_pm2() {
    log "配置PM2进程管理..."
    
    ssh ${REMOTE_USER}@${SERVER_IP} "cat > ${REMOTE_DIR}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'linmeng-server',
    cwd: '${REMOTE_DIR}/server',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '${REMOTE_DIR}/logs/app.log',
    out_file: '${REMOTE_DIR}/logs/out.log',
    error_file: '${REMOTE_DIR}/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF"
    
    # 创建日志目录
    ssh ${REMOTE_USER}@${SERVER_IP} "mkdir -p ${REMOTE_DIR}/logs"
    
    log "PM2配置完成"
}

# 启动服务
start_service() {
    log "启动服务..."
    
    ssh ${REMOTE_USER}@${SERVER_IP} "
        cd ${REMOTE_DIR}
        pm2 start ecosystem.config.js
        pm2 save
    "
    
    log "服务启动完成"
}

# 主函数
main() {
    log "开始部署邻盟项目..."
    log "目标服务器: ${SERVER_IP}"
    log "域名: ${DOMAIN}"
    
    check_ssh
    create_remote_dirs
    upload_files
    setup_env
    install_deps
    setup_nginx
    setup_pm2
    start_service
    
    echo ""
    echo "=========================================="
    log "部署完成!"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  - http://${DOMAIN}"
    echo "  - http://${SERVER_IP}"
    echo ""
    echo "管理命令:"
    echo "  pm2 status          # 查看服务状态"
    echo "  pm2 logs linmeng    # 查看日志"
    echo "  pm2 restart linmeng # 重启服务"
    echo ""
}

# 执行主函数
main
