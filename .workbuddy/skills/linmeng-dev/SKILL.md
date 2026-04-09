# 邻盟项目开发规范 Skill

## 项目信息

- **项目名称：** 邻盟 - 社区资源智能匹配助手
- **项目路径：** `c:\Users\12494\WorkBuddy\20260331205655\`
- **当前版本：** v3.3
- **技术栈：** Node.js + Express + Vue3 + MySQL

---

## ⚠️ 核心规范

### 恢复备份文件前必须经过用户同意

**错误示例：** 自行恢复备份文件，导致当前功能丢失

**正确流程：**
1. 向用户说明需要恢复的文件名和原因
2. 等待用户明确确认
3. 执行恢复操作
4. 验证功能正常

---

## 一、项目结构

```
c:\Users\12494\WorkBuddy\20260331205655\
├── client/                    # Vue3前端项目
│   ├── src/
│   │   ├── api/              # API接口封装
│   │   │   ├── admin.js       # 管理后台API
│   │   │   ├── community.js   # 社区端API
│   │   │   ├── merchant.js    # 商家端API
│   │   │   ├── ambassador.js # 招商大使API
│   │   │   └── public.js      # 公共API
│   │   ├── components/        # 公共组件
│   │   ├── layouts/           # 四端布局组件
│   │   ├── views/             # 页面组件
│   │   │   ├── admin/         # 管理后台（18个）
│   │   │   ├── community/     # 社区端（10个）
│   │   │   ├── merchant/      # 商家端（9个）
│   │   │   └── ambassador/    # 招商大使（5个）
│   │   ├── router/
│   │   ├── utils/
│   │   └── App.vue
│   └── package.json
├── server/                    # Express后端项目
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── routes/           # 路由
│   │   ├── middleware/        # 中间件
│   │   ├── utils/            # 工具
│   │   └── app.js            # 入口
│   ├── uploads/               # 上传文件目录
│   └── package.json
└── .env                      # 环境变量
```

---

## 二、服务管理

### 启动服务

**后端（端口3000）：**
```bash
cd c:\Users\12494\WorkBuddy\20260331205655\server
node src/app.js
```

**前端（端口5173）：**
```bash
cd c:\Users\12494\WorkBuddy\20260331205655\client
node node_modules/vite/bin/vite.js --port 5173 --host
```

### 重启服务

```bash
taskkill /F /IM node.exe
# 然后重新启动后端和前端
```

### 验证服务状态

```bash
netstat -ano | findstr ":3000 :5173"
```

---

## 三、数据库

### 连接信息
- **主机：** localhost
- **用户：** root
- **密码：** root
- **数据库：** linmeng
- **端口：** 3306

### 关键表结构

**ambassadors（招商大使表）：**
- `qr_code` - 渠道码（唯一，如 AMBMNLFQX5QD9N2）
- `register_url` - 专属注册链接

**message（消息表）：**
- `user_type` - 用户类型（1社区/2商家/3大使）
- `content` - JSON格式消息内容

**system_notifications（系统通知表）：**
- `target_type` - 发送对象（0全部/1社区/2商家/3大使）
- `status` - 状态（0草稿/1已发布/2下架/3删除）

---

## 四、常见问题处理

### 1. PowerShell写入Vue文件编码问题

**症状：** replace_in_file修改文件后内容没变化

**原因：** PowerShell的WriteAllText处理非ASCII字符有问题

**解决方案：** 使用Python脚本写入
```python
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
```

### 2. 路由注册顺序问题

**症状：** 未登录时500错误

**原因：** 路由在认证中间件之前注册

**解决方案：** 确保认证中间件先注册
```javascript
// 正确顺序
router.use(authMerchant)           // 先认证
router.get('/:id', getDemandDetail) // 再路由
```

### 3. JSON字段自动反序列化

**说明：** mysql2会自动将JSON类型字段反序列化为数组

**处理：** 直接使用，不需要JSON.parse()

### 4. 删除通知时同步清理

**场景：** 管理后台删除通知，大使端仍显示

**原因：** message表和system_notifications表独立

**解决方案：** 删除时同时清理两个表
```javascript
// 匹配数字和字符串两种格式
const likeNum = `%notificationId\":${id}%`
const likeStr = `%notificationId\":\"${id}\"%`
await pool.query(
  "DELETE FROM message WHERE (content LIKE ? OR content LIKE ?) AND msg_type = 1",
  [likeNum, likeStr]
)
```

---

## 五、响应式适配规范

### 标准断点

```css
@media (max-width: 768px) {
  /* 移动端适配 */
}
```

### 适配检查清单

- [ ] 表格字体缩小至10-11px
- [ ] padding缩小至4-6px
- [ ] 按钮宽度100%或调整宽度
- [ ] 单列布局
- [ ] 抽屉导航（汉堡菜单）
- [ ] 底部预留空间（80px）

---

## 六、测试账号

| 角色 | 账号 | 密码 | 验证码 |
|------|------|------|--------|
| 管理员 | admin | admin123 | - |
| 社区 | 13800138000 | 123456 | 123456 |
| 商家 | 13900139000 | 123456 | 123456 |
| 大使 | 13900001111 | 888888 | 888888 |

---

## 七、文档位置

| 文档 | 位置 |
|------|------|
| 需求说明书 | brain/需求说明书.md |
| 技术说明书 | brain/技术说明书.md |
| 产品说明书 | brain/产品使用说明书.md |
| 开发总结 | brain/开发总结.md |

---

## 八、Git提交规范

```
[模块] 简短描述

详细说明（可选）
```

示例：
```
[大使端] 添加真实二维码生成功能

- 使用qrcode库替换CSS模拟
- 支持下载和复制链接
```

---

## 九、重要提醒

1. **恢复备份前必须确认：** 任何恢复备份文件的行为，都必须先向用户说明并获得同意

2. **重启服务后验证：** 修改后端代码后，必须重启服务并验证功能正常

3. **数据库操作需谨慎：** 直接操作数据库前，建议先备份

4. **保持文档更新：** 重大功能变更后，及时更新相关文档
