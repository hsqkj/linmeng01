# 邻盟项目部署指南

## 服务器信息
- **IP**: 150.158.12.243
- **域名**: 3qall.com
- **操作系统**: Ubuntu 20.04/22.04 LTS

## 部署步骤

### 第一步：服务器初始化（在服务器上执行）

1. 使用SSH登录服务器：
```bash
ssh root@150.158.12.243
```

2. 上传并执行初始化脚本：
```bash
# 在本地执行，上传脚本
scp setup-server.sh root@150.158.12.243:/root/

# 在服务器上执行
ssh root@150.158.12.243
chmod +x setup-server.sh
./setup-server.sh
```

这将安装：
- Node.js 20.x
- MySQL 8.0
- Nginx
- PM2
- Certbot (SSL证书)

### 第二步：项目部署（在本地执行）

1. 确保已配置SSH密钥登录：
```bash
ssh-copy-id root@150.158.12.243
```

2. 执行部署脚本：
```bash
cd deploy
chmod +x deploy.sh
./deploy.sh
```

### 第三步：数据库初始化

在服务器上执行：
```bash
ssh root@150.158.12.243
cd /opt/linmeng/server
node scripts/init-db.js
```

### 第四步：配置SSL证书（可选但推荐）

```bash
ssh root@150.158.12.243
certbot --nginx -d 3qall.com -d www.3qall.com
```

## 目录结构

```
/opt/linmeng/
├── server/           # 后端代码
│   ├── src/         # 源代码
│   ├── scripts/     # 脚本
│   ├── uploads/     # 上传文件
│   └── .env         # 环境变量
├── dist/            # 前端构建文件
├── logs/            # 日志文件
└── ecosystem.config.js  # PM2配置
```

## 常用命令

### 服务管理
```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs linmeng-server

# 重启服务
pm2 restart linmeng-server

# 停止服务
pm2 stop linmeng-server
```

### Nginx管理
```bash
# 测试配置
nginx -t

# 重载配置
systemctl reload nginx

# 查看状态
systemctl status nginx
```

### MySQL管理
```bash
# 登录MySQL
mysql -u linmeng -p

# 备份数据库
mysqldump -u linmeng -p linmeng > backup.sql

# 恢复数据库
mysql -u linmeng -p linmeng < backup.sql
```

## 环境变量

生产环境配置文件位于：`/opt/linmeng/server/.env`

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=linmeng
DB_PASSWORD=linmeng_password_2026
DB_NAME=linmeng
JWT_SECRET=linmeng_jwt_secret_2026_secure_key
JWT_EXPIRES_IN=7d
UPLOAD_PATH=../uploads
MAX_FILE_SIZE=10485760
```

## 故障排查

### 服务无法启动
```bash
# 查看详细日志
pm2 logs linmeng-server --lines 100

# 检查端口占用
netstat -tulpn | grep 3000
```

### 数据库连接失败
```bash
# 检查MySQL状态
systemctl status mysql

# 检查数据库用户
mysql -e "SELECT User, Host FROM mysql.user;"

# 检查数据库
mysql -e "SHOW DATABASES;"
```

### Nginx 502错误
```bash
# 检查后端服务是否运行
pm2 status

# 检查Nginx错误日志
tail -f /var/log/nginx/error.log
```

## 更新部署

1. 本地构建前端：
```bash
cd client
npm run build
```

2. 重新部署：
```bash
cd deploy
./deploy.sh
```

## 安全建议

1. **修改默认密码**：
   - MySQL root密码
   - 应用数据库密码
   - JWT密钥

2. **配置防火墙**：
   - 仅开放必要端口（22, 80, 443）
   - 禁用root密码登录，使用SSH密钥

3. **定期备份**：
   - 数据库每日备份
   - 文件定期备份到云存储

4. **监控日志**：
   - 配置日志轮转
   - 设置异常告警

## 联系方式

如有问题，请联系开发团队。
