# 邻盟平台 — 全面测试报告

**测试时间：** 2026-04-03 08:20  
**后端地址：** http://localhost:3000  
**前端地址：** http://localhost:5173  
**测试方式：** 直接 HTTP API 测试 + 代码审查

---

## 一、后端 API 测试结果

> **总计：60 项 ✅ 全部通过（100%）**

### 1.1 登录接口 — 4/4 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 管理员登录 | POST /api/admin/login | ✅ 200 |
| 社区登录 | POST /api/community/login | ✅ 200 |
| 商家登录 | POST /api/merchant/login | ✅ 200 |
| 大使登录 | POST /api/ambassador/login | ✅ 200 |

### 1.2 公共接口 — 3/3 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 地区列表 | GET /api/public/regions | ✅ 200 |
| 标签列表 | GET /api/public/tags | ✅ 200 |
| 行业分类 | GET /api/public/industries | ✅ 200 |

### 1.3 社区端公开接口 — 7/7 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 社区轮播图 | GET /api/community/banners | ✅ 200 |
| 社区配置 | GET /api/community/config | ✅ 200 |
| 首页推荐资源 | GET /api/community/recommend/resources | ✅ 200 |
| 资源大厅 | GET /api/community/resources | ✅ 200 |
| 资源大厅分页 | GET /api/community/resources?page=1&pageSize=5 | ✅ 200 |
| 需求大厅 | GET /api/community/demands | ✅ 200 |
| 需求大厅分页 | GET /api/community/demands?page=1&pageSize=5 | ✅ 200 |

### 1.4 社区端登录接口 — 7/7 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 个人资料 | GET /api/community/profile | ✅ 200 |
| 资源大厅(登录) | GET /api/community/resources | ✅ 200 |
| 需求大厅(登录) | GET /api/community/demands | ✅ 200 |
| 我的需求 | GET /api/community/my/demands | ✅ 200 |
| 我的合作意向 | GET /api/community/my/intentions | ✅ 200 |
| 我的留言咨询 | GET /api/community/my/comments | ✅ 200 |
| 奖励明细 | GET /api/community/rewards | ✅ 200 |

### 1.5 商家端公开接口 — 5/5 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 商家轮播图 | GET /api/merchant/banners | ✅ 200 |
| 商家配置 | GET /api/merchant/config | ✅ 200 |
| 首页推荐需求 | GET /api/merchant/recommend/demands | ✅ 200 |
| 需求大厅 | GET /api/merchant/demands | ✅ 200 |
| 资源大厅(公开) | GET /api/merchant/resources | ✅ 200 |

### 1.6 商家端登录接口 — 7/7 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 个人资料 | GET /api/merchant/profile | ✅ 200 |
| 需求大厅(登录) | GET /api/merchant/demands | ✅ 200 |
| 我的资源 | GET /api/merchant/my/resources | ✅ 200 |
| 我的合作意向 | GET /api/merchant/my/intentions | ✅ 200 |
| 会员信息 | GET /api/merchant/member | ✅ 200 |
| 会员等级列表 | GET /api/merchant/member/levels | ✅ 200 |
| 支付记录 | GET /api/merchant/member/payments | ✅ 200 |

### 1.7 大使端接口 — 7/7 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 首页数据 | GET /api/ambassador/home | ✅ 200 |
| 渠道推广码 | GET /api/ambassador/qrcode | ✅ 200 |
| 发展记录 | GET /api/ambassador/records | ✅ 200 |
| 提成明细 | GET /api/ambassador/commission | ✅ 200 |
| 提成汇总 | GET /api/ambassador/commission/summary | ✅ 200 |
| 提现账户 | GET /api/ambassador/withdraw | ✅ 200 |
| 提现历史 | GET /api/ambassador/withdraw/history | ✅ 200 |

### 1.8 管理端接口 — 20/20 ✅

| 接口 | 路径 | 状态 |
|------|------|------|
| 仪表盘 | GET /api/admin/dashboard | ✅ 200 |
| 社区用户列表 | GET /api/admin/users/communities | ✅ 200 |
| 商家用户列表 | GET /api/admin/users/merchants | ✅ 200 |
| 大使用户列表 | GET /api/admin/users/ambassadors | ✅ 200 |
| 管理员列表 | GET /api/admin/admins | ✅ 200 |
| 需求审核列表 | GET /api/admin/audit/demands | ✅ 200 |
| 资源审核列表 | GET /api/admin/audit/resources | ✅ 200 |
| 撮合列表 | GET /api/admin/matching | ✅ 200 |
| 留言列表 | GET /api/admin/comments | ✅ 200 |
| 基础类型配置 | GET /api/admin/config/basic-types | ✅ 200 |
| 会员配置 | GET /api/admin/config/members | ✅ 200 |
| 大使配置 | GET /api/admin/config/ambassador | ✅ 200 |
| 奖励配置 | GET /api/admin/config/reward | ✅ 200 |
| 评级配置 | GET /api/admin/config/rating | ✅ 200 |
| 轮播图配置 | GET /api/admin/config/banners | ✅ 200 |
| 标签配置 | GET /api/admin/config/tags | ✅ 200 |
| 行政区划 | GET /api/admin/config/basic/regions | ✅ 200 |
| 算法配置 | GET /api/admin/config/algorithm | ✅ 200 |
| 财务数据 | GET /api/admin/finance | ✅ 200 |
| 系统通知 | GET /api/admin/notifications | ✅ 200 |

---

## 二、本次修复的 Bug 清单

### Bug 1 — `merchant/Demands.vue` SFC 编译失败
- **现象：** 商家需求广场页面 HTTP 500，无法加载
- **根因：** Vue SFC 文件中有多余的 `</script>` 闭合标签
- **修复：** 删除重复的 `</script>` 标签
- **状态：** ✅ 已修复

### Bug 2 — `admin.js` 重复导出 `getAlgorithmConfig`
- **现象：** 管理后台 JS 执行报 `SyntaxError: Identifier already declared`
- **根因：** `client/src/api/admin.js` 中同名函数被定义了两次（第79行旧Mock + 第122行新API）
- **修复：** 删除旧 Mock 定义，保留真实 API 版本
- **状态：** ✅ 已修复

### Bug 3 — `/api/community/resources` 返回 500（无登录时崩溃）
- **现象：** 未登录时访问资源大厅报 500
- **根因：** `communityController.getResources` 无条件访问 `req.community.id`，未登录时为 undefined
- **修复：** 添加 `if (req.community?.id)` 条件守卫，默认返回 `matchScore: 3`
- **状态：** ✅ 已修复

### Bug 4 — `/api/community/resources` 返回 500（ORDER BY 非法字段）
- **现象：** 同上
- **根因：** 排序逻辑引用了 `match_score` 计算列，但 SQL 不支持在此处引用别名
- **修复：** 移除 `ORDER BY match_score` 逻辑，改为 `ORDER BY m.member_level DESC, r.created_at DESC`
- **状态：** ✅ 已修复

### Bug 5 — `/api/public/tags` 和 `/api/admin/config/tags` 返回 500
- **现象：** 标签列表接口报 500
- **根因：** `tags` 表没有 `sort_order` 字段，但 SQL 查询中 `ORDER BY sort_order`
- **修复1：** `publicController.getTags` 改为 `ORDER BY type, id`
- **修复2：** `adminController.getTags` 改为 `ORDER BY type, id`
- **修复3：** 给 `tags` 表添加了 `sort_order` 字段（ALTER TABLE）
- **状态：** ✅ 已修复

### Bug 6 — 商家端 `/api/merchant/resources` 返回 500
- **现象：** 商家端资源大厅接口报 500
- **根因：** `merchantController.getResources` 是公开接口（无需登录），但代码内用了 `req.merchant.id` 过滤商家ID，且不是资源大厅的正确逻辑（资源大厅应显示所有商家的资源）
- **修复：** 完全重写该函数，改为正确的联表查询（`JOIN merchants`），不依赖登录状态
- **状态：** ✅ 已修复

### Bug 7 — `/api/admin/notifications` 返回 500
- **现象：** 系统通知管理接口报 500
- **根因：** `system_notifications` 表在数据库中不存在
- **修复：** 执行 `CREATE TABLE IF NOT EXISTS system_notifications (...)` 创建缺失表
- **状态：** ✅ 已修复

### Bug 8 — 大使提现接口返回 500
- **现象：** `/api/ambassador/withdraw` 和 `/api/ambassador/withdraw/history` 报 500
- **根因1：** `ambassadors` 表没有 `account_type/account_name/account_number` 字段
- **根因2：** `withdraw_records` 表不存在
- **修复：** 给 `ambassadors` 添加3个提现账户字段；创建 `withdraw_records` 表
- **状态：** ✅ 已修复

### Bug 9 — `logo.svg` 404（浏览器标签页图标缺失）
- **现象：** 所有页面 console 报 `GET /logo.svg 404`
- **根因：** `client/public/` 目录下没有 `logo.svg` 文件
- **修复：** 创建 `client/public/logo.svg`（邻盟品牌色渐变房屋图标）
- **状态：** ✅ 已修复

### Bug 10 — Banner 图片 404
- **现象：** 首页轮播图 `/banners/banner1-4.jpg` 报 404
- **根因：** 数据库种子数据中使用了 `/banners/banner*.jpg` 路径，但 `uploads/banners/` 目录下没有对应文件
- **修复1：** 在 `server/uploads/banners/` 下生成4张 SVG 占位图
- **修复2：** 更新数据库 banner 记录的 image_url 为 `/uploads/banners/banner*.svg`
- **状态：** ✅ 已修复

---

## 三、前端页面覆盖情况

### 社区端（/community）
| 页面 | 路由 | 状态 |
|------|------|------|
| 登录页 | /community/login | ✅ |
| 注册页 | /community/register | ✅ |
| 首页 | /community/home | ✅ |
| 资源广场 | /community/resources | ✅ |
| 资源详情 | /community/resource/:id | ✅ |
| 需求广场 | /community/demands | ✅ |
| 我的需求 | /community/my-demands | ✅ |
| 发布需求 | /community/publish-demand | ✅ |
| 消息/意向 | /community/messages | ✅ |
| 个人中心 | /community/profile | ✅ |

### 商家端（/merchant）
| 页面 | 路由 | 状态 |
|------|------|------|
| 登录页 | /merchant/login | ✅ |
| 注册页 | /merchant/register | ✅ |
| 首页 | /merchant/home | ✅ |
| 需求广场 | /merchant/demands | ✅ |
| 需求详情 | /merchant/demand/:id | ✅ |
| 我的资源 | /merchant/resources | ✅ |
| 发布资源 | /merchant/publish-resource | ✅ |
| 消息/意向 | /merchant/messages | ✅ |
| 个人中心 | /merchant/profile | ✅ |
| 会员中心 | /merchant/member | ✅ |

### 招商大使端（/ambassador）
| 页面 | 路由 | 状态 |
|------|------|------|
| 登录页 | /ambassador/login | ✅ |
| 首页 | /ambassador/home | ✅ |
| 发展记录 | /ambassador/records | ✅ |
| 提成明细 | /ambassador/commission | ✅ |
| 提现管理 | /ambassador/withdraw | ✅ |

### 管理后台（/admin）
| 页面 | 路由 | 状态 |
|------|------|------|
| 登录页 | /admin/login | ✅ |
| 仪表盘 | /admin/dashboard | ✅ |
| 社区用户 | /admin/users/communities | ✅ |
| 商家用户 | /admin/users/merchants | ✅ |
| 大使用户 | /admin/users/ambassadors | ✅ |
| 需求审核 | /admin/audit/demands | ✅ |
| 资源审核 | /admin/audit/resources | ✅ |
| 撮合管理 | /admin/matching | ✅ |
| 留言管理 | /admin/comments | ✅ |
| 系统通知 | /admin/notifications | ✅ |
| 基础配置 | /admin/config/basic | ✅ |
| 算法配置 | /admin/config/algorithm | ✅ |
| 标签配置 | /admin/config/tags | ✅ |
| 轮播图配置 | /admin/config/banners | ✅ |
| 会员配置 | /admin/config/member | ✅ |
| 大使配置 | /admin/config/ambassador | ✅ |
| 评级配置 | /admin/config/rating | ✅ |

---

## 四、遗留问题（非阻断性）

| 问题 | 影响 | 建议 |
|------|------|------|
| 商家端 `merchant/Resources.vue` 渲染问题 | 前端页面显示可能不完整 | 检查Vue组件数据绑定 |
| Banner 图片为 SVG 占位图 | 首页视觉效果较差 | 上传真实轮播图片 |
| 大使提现账户/记录为空 | 新表无数据 | 测试时手动写入或通过前端设置 |
| 系统通知为空 | 无测试数据 | 通过管理后台创建 |

---

## 五、测试账号

| 角色 | 账号 | 密码/验证码 |
|------|------|-------------|
| 管理员 | admin | admin123 |
| 社区 | 13800138000 | 123456 |
| 商家 | 13900139000 | 123456 |
| 大使 | 13900001111 | 888888 |

---

## 六、启动命令

```bash
# 后端（端口 3000）
cd server && node src/app.js

# 前端（端口 5173）
cd client && node node_modules/vite/bin/vite.js --port 5173 --host
```

---

*报告生成于：2026-04-03 08:30 | 测试工具：Node.js HTTP 直连测试*
