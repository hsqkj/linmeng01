#!/bin/bash
# 邻盟项目服务器部署脚本
# 在服务器上执行此脚本

set -e

echo "=========================================="
echo "  邻盟项目服务器部署脚本"
echo "=========================================="

# 配置
PROJECT_NAME="linmeng"
DOMAIN="3qall.com"
PROJECT_DIR="/opt/linmeng"

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

# 检查root权限
check_root() {
    if [[ $EUID -eq 0 ]]; then
       error "请不要使用root用户运行此脚本，建议使用普通用户如ubuntu"
       exit 1
    fi
    log "当前用户: $(whoami)"
}

# 创建项目目录
create_dirs() {
    log "创建项目目录..."
    sudo mkdir -p ${PROJECT_DIR}
    sudo chown $(whoami):$(whoami) ${PROJECT_DIR}
    mkdir -p ${PROJECT_DIR}/{server,uploads,logs,dist}
    log "目录创建完成"
}

# 配置环境变量
setup_env() {
    log "配置环境变量..."
    
    cat > ${PROJECT_DIR}/server/.env << 'EOF'
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
EOF
    
    log "环境变量配置完成"
}

# 配置Nginx
setup_nginx() {
    log "配置Nginx..."
    
    sudo tee /etc/nginx/sites-available/linmeng > /dev/null << 'EOF'
server {
    listen 80;
    server_name 3qall.com www.3qall.com;
    
    # 日志
    access_log /var/log/nginx/linmeng-access.log;
    error_log /var/log/nginx/linmeng-error.log;
    
    # 前端静态文件
    location / {
        root /opt/linmeng/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/linmeng /etc/nginx/sites-enabled/linmeng
    
    # 测试并重载配置
    sudo nginx -t && sudo systemctl reload nginx
    
    log "Nginx配置完成"
}

# 配置PM2
setup_pm2() {
    log "配置PM2进程管理..."
    
    cat > ${PROJECT_DIR}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'linmeng-server',
    cwd: '/opt/linmeng/server',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/opt/linmeng/logs/app.log',
    out_file: '/opt/linmeng/logs/out.log',
    error_file: '/opt/linmeng/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF
    
    log "PM2配置完成"
}

# 安装依赖
install_deps() {
    log "安装后端依赖..."
    cd ${PROJECT_DIR}/server
    npm install --production
    log "依赖安装完成"
}

# 初始化数据库
init_db() {
    log "初始化数据库..."
    cd ${PROJECT_DIR}/server
    node scripts/init-db.js
    log "数据库初始化完成"
}

# 启动服务
start_service() {
    log "启动服务..."
    
    # 检查是否已有实例运行
    pm2 delete linmeng-server 2>/dev/null || true
    
    cd ${PROJECT_DIR}
    pm2 start ecosystem.config.js
    pm2 save
    
    log "服务启动完成"
}

# 检查域名解析
check_domain() {
    log "检查域名解析..."
    
    DOMAIN_IP=$(dig +short 3qall.com | head -1)
    SERVER_IP=$(curl -s ifconfig.me)
    
    log "域名 3qall.com 解析到: ${DOMAIN_IP}"
    log "服务器公网IP: ${SERVER_IP}"
    
    if [ "${DOMAIN_IP}" = "${SERVER_IP}" ]; then
        log "✅ 域名解析正确"
    else
        warn "⚠️ 域名解析可能不正确"
        warn "请在DNS管理中将 3qall.com 解析到 ${SERVER_IP}"
    fi
}

# 显示状态
show_status() {
    echo ""
    echo "=========================================="
    log "部署完成!"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  - http://3qall.com"
    echo "  - http://$(curl -s ifconfig.me)"
    echo ""
    echo "项目目录: ${PROJECT_DIR}"
    echo ""
    echo "管理命令:"
    echo "  pm2 status              # 查看服务状态"
    echo "  pm2 logs linmeng-server # 查看日志"
    echo "  pm2 restart linmeng-server # 重启服务"
    echo "  sudo nginx -t           # 测试Nginx配置"
    echo "  sudo systemctl reload nginx # 重载Nginx"
    echo ""
}

# 主函数
main() {
    log "开始部署邻盟项目..."
    
    check_root
    check_domain
    create_dirs
    setup_env
    setup_nginx
    setup_pm2
    
    log "基础配置完成！"
    log "请上传项目文件到 ${PROJECT_DIR} 目录"
    log "然后运行: cd ${PROJECT_DIR}/server && npm install && pm2 start ecosystem.config.js"
    
    show_status
}

# 执行主函数
main
