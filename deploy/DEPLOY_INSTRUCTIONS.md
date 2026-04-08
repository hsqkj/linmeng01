# 邻盟项目部署指南

## 服务器信息
- **IP**: 150.158.12.243
- **域名**: 3qall.com
- **SSH用户名**: root
- **SSH密码**: Linmeng2026@

## 快速部署步骤（5分钟完成）

### 第一步：准备部署文件

在本地创建部署目录结构：

```
D:\linmeng-deploy\
├── server\          # 复制 D:\WorkBuddy\20260331205655\server\ 的所有内容
├── dist\            # 复制 D:\WorkBuddy\20260331205655\client\dist\ 的所有内容
└── quick-deploy.sh  # 复制 D:\WorkBuddy\20260331205655\deploy\quick-deploy.sh
```

### 第二步：上传文件到服务器

使用 **WinSCP** 连接服务器：

1. 下载并安装 WinSCP: https://winscp.net/
2. 新建会话：
   - 文件协议: SFTP
   - 主机名: 150.158.12.243
   - 用户名: root
   - 密码: Linmeng2026@
3. 点击登录
4. 将本地 `D:\linmeng-deploy\` 目录上传到服务器的 `/root/linmeng-deploy/`

### 第三步：SSH登录执行部署

使用 **PuTTY** 或命令行：

```bash
# 连接服务器
ssh root@150.158.12.243
# 密码: Linmeng2026@

# 执行部署脚本
cd /root/linmeng-deploy
chmod +x quick-deploy.sh
bash quick-deploy.sh
```

### 第四步：验证部署

```bash
# 查看服务状态
pm2 status

# 测试API
curl http://localhost:3000/api/health

# 查看日志
pm2 logs linmeng-server
```

### 第五步：访问网站

打开浏览器访问：
- http://3qall.com
- 或 http://150.158.12.243

## 常见问题

### 1. 域名无法访问

检查域名解析：
```bash
dig 3qall.com
```

如果未解析，请在腾讯云DNS控制台添加A记录：
- 主机记录: @
- 记录类型: A
- 记录值: 150.158.12.243

### 2. 服务无法启动

```bash
# 查看详细日志
pm2 logs linmeng-server --lines 100

# 手动测试
cd /opt/linmeng/server
node src/app.js
```

### 3. 数据库连接失败

```bash
# 检查MySQL
systemctl status mysql

# 检查数据库
mysql -u root -p -e "SHOW DATABASES;"
```

## 管理命令

```bash
# 服务管理
pm2 status                    # 查看状态
pm2 logs linmeng-server       # 查看日志
pm2 restart linmeng-server    # 重启服务
pm2 stop linmeng-server       # 停止服务

# Nginx管理
nginx -t                      # 测试配置
systemctl reload nginx        # 重载配置
systemctl restart nginx       # 重启Nginx

# 查看端口
netstat -tulpn | grep 3000
```

## 文件位置

```
/opt/linmeng/
├── server/              # 后端代码
│   ├── src/
│   ├── scripts/
│   ├── uploads/        # 上传文件
│   └── .env           # 环境变量
├── dist/              # 前端构建文件
├── logs/              # 日志文件
└── ecosystem.config.js # PM2配置

/etc/nginx/sites-available/linmeng  # Nginx配置
```

## SSL证书配置（可选）

```bash
# 安装certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d 3qall.com -d www.3qall.com

# 自动续期
systemctl enable certbot.timer
```

## 更新部署

```bash
# 1. 本地重新构建前端
cd D:\WorkBuddy\20260331205655\client
npm run build

# 2. 使用WinSCP上传新的dist目录到 /opt/linmeng/dist/

# 3. 重启服务
pm2 restart linmeng-server
```

## 技术支持

如有问题，请检查日志：
- 应用日志: `/opt/linmeng/logs/`
- Nginx日志: `/var/log/nginx/linmeng-error.log`
