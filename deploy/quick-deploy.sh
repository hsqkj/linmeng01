#!/bin/bash
# 邻盟项目快速部署脚本
# 在服务器上执行: bash quick-deploy.sh

set -e

echo "=========================================="
echo "  邻盟项目快速部署"
echo "=========================================="

PROJECT_DIR="/opt/linmeng"

# 创建目录
mkdir -p ${PROJECT_DIR}/{server,uploads,logs,dist}

# 复制文件（假设文件已在/root/linmeng-deploy/）
if [ -d "/root/linmeng-deploy/server" ]; then
    cp -r /root/linmeng-deploy/server/* ${PROJECT_DIR}/server/
fi

if [ -d "/root/linmeng-deploy/dist" ]; then
    cp -r /root/linmeng-deploy/dist/* ${PROJECT_DIR}/dist/
fi

# 创建环境变量文件
cat > ${PROJECT_DIR}/server/.env << 'EOF'
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=linmeng
JWT_SECRET=linmeng_jwt_secret_2026_secure_key
JWT_EXPIRES_IN=7d
UPLOAD_PATH=../uploads
MAX_FILE_SIZE=10485760
EOF

# 创建PM2配置
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
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF

# 创建Nginx配置
cat > /etc/nginx/sites-available/linmeng << 'EOF'
server {
    listen 80;
    server_name 3qall.com www.3qall.com;
    
    access_log /var/log/nginx/linmeng-access.log;
    error_log /var/log/nginx/linmeng-error.log;
    
    location / {
        root /opt/linmeng/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /uploads/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# 启用Nginx站点
ln -sf /etc/nginx/sites-available/linmeng /etc/nginx/sites-enabled/linmeng
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 安装依赖并启动
cd ${PROJECT_DIR}/server
npm install --production

# 初始化数据库
node scripts/init-db.js || echo "数据库初始化可能已存在"

# 启动服务
pm2 delete linmeng-server 2>/dev/null || true
pm2 start ${PROJECT_DIR}/ecosystem.config.js
pm2 save

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "访问地址: http://3qall.com 或 http://150.158.12.243"
echo ""
echo "管理命令:"
echo "  pm2 status              # 查看服务状态"
echo "  pm2 logs linmeng-server # 查看日志"
echo "  pm2 restart linmeng-server # 重启服务"
echo ""
