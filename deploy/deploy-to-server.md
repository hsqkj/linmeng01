# 邻盟项目部署到腾讯云服务器

## 服务器信息
- **IP**: 150.158.12.243
- **域名**: 3qall.com
- **用户名**: ubuntu
- **密码**: Hanghang0824。

## 快速部署步骤

### 第一步：打包项目文件

我已经为您准备好了部署包，请按以下步骤操作：

1. **在本地创建部署包**：

```bash
# 在 D:\WorkBuddy\20260331205655 目录下执行
# 创建一个包含所有必要文件的压缩包
```

### 第二步：上传到服务器

使用 WinSCP 或 FileZilla 连接服务器：

- **主机**: 150.158.12.243
- **用户名**: ubuntu
- **密码**: Hanghang0824。
- **端口**: 22

上传以下文件到服务器 `/home/ubuntu/` 目录：
1. `deploy/install.sh` → 部署脚本
2. `server/` 目录 → 后端代码
3. `client/dist/` 目录 → 前端构建文件

### 第三步：在服务器上执行部署

使用 PuTTY 或终端连接服务器：

```bash
# 1. SSH登录
ssh ubuntu@150.158.12.243
密码: Hanghang0824。

# 2. 执行部署脚本
chmod +x /home/ubuntu/install.sh
./install.sh

# 3. 复制项目文件到部署目录
sudo cp -r /home/ubuntu/server/* /opt/linmeng/server/
sudo cp -r /home/ubuntu/dist/* /opt/linmeng/dist/
sudo chown -R ubuntu:ubuntu /opt/linmeng

# 4. 安装依赖并启动
cd /opt/linmeng/server
npm install --production

# 5. 初始化数据库
node scripts/init-db.js

# 6. 启动服务
cd /opt/linmeng
pm2 start ecosystem.config.js
pm2 save
```

### 第四步：检查部署状态

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs linmeng-server

# 测试API
curl http://localhost:3000/api/health

# 测试Nginx
curl http://localhost/api/health
```

## 详细文件清单

### 需要上传的文件

```
/home/ubuntu/
├── install.sh              # 部署脚本
├── server/                 # 后端代码
│   ├── src/
│   ├── scripts/
│   ├── package.json
│   └── ...
└── dist/                   # 前端构建文件
    ├── index.html
    └── assets/
```

### 部署后的目录结构

```
/opt/linmeng/
├── server/                 # 后端代码
│   ├── src/
│   ├── scripts/
│   ├── uploads/           # 上传文件
│   ├── .env               # 环境变量
│   └── package.json
├── dist/                  # 前端构建文件
├── logs/                  # 日志文件
└── ecosystem.config.js    # PM2配置
```

## 配置说明

### 环境变量 (/opt/linmeng/server/.env)

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

### Nginx配置 (/etc/nginx/sites-available/linmeng)

已配置：
- 前端静态文件服务
- API代理到 localhost:3000
- 上传文件代理
- Gzip压缩

### 数据库配置

数据库: linmeng
用户名: linmeng
密码: linmeng_password_2026

## 域名配置

### 检查域名解析

```bash
dig 3qall.com
# 或
nslookup 3qall.com
```

### 如果域名未解析

登录腾讯云DNS控制台，添加A记录：
- 主机记录: @
- 记录类型: A
- 记录值: 150.158.12.243

## 故障排查

### 1. 服务无法启动

```bash
# 查看详细日志
pm2 logs linmeng-server --lines 100

# 检查端口占用
sudo netstat -tulpn | grep 3000

# 手动启动测试
cd /opt/linmeng/server
node src/app.js
```

### 2. 数据库连接失败

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 检查数据库用户
mysql -u root -p -e "SELECT User, Host FROM mysql.user;"

# 检查数据库
mysql -u root -p -e "SHOW DATABASES;"
```

### 3. Nginx 502错误

```bash
# 检查后端服务
pm2 status

# 检查Nginx错误日志
sudo tail -f /var/log/nginx/linmeng-error.log

# 测试Nginx配置
sudo nginx -t
```

### 4. 前端页面空白

```bash
# 检查dist目录
ls -la /opt/linmeng/dist/

# 检查index.html
head /opt/linmeng/dist/index.html
```

## SSL证书配置（可选）

```bash
# 安装certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d 3qall.com -d www.3qall.com

# 自动续期
sudo systemctl enable certbot.timer
```

## 更新部署

```bash
# 1. 本地构建前端
cd D:\WorkBuddy\20260331205655\client
npm run build

# 2. 上传新的dist目录到服务器
# 使用WinSCP覆盖 /opt/linmeng/dist/

# 3. 重启服务（如果需要）
pm2 restart linmeng-server
```

## 联系方式

如有问题，请检查日志或联系技术支持。
