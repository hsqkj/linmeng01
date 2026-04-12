# MEMORY.md - 长期记忆

## ⚠️ 项目路径（重要）
- **项目根目录**：`D:\WorkBuddy\20260331205655`（不是C盘！）
- **前端代码**：`D:\WorkBuddy\20260331205655\client\src\`
- **后端代码**：`D:\WorkBuddy\20260331205655\server\src\`（注意是server\src，不是server\server）
- **所有文件操作必须使用 D:\ 开头**

## 用户信息
- **项目**：邻盟（LinMeng）- 社区互助平台
- **域名**：3qall.com
- **联系邮箱**：12494789@qq.com

## 项目部署状态（2026-04-09）

### 服务器信息
- **腾讯云服务器**：150.158.12.243
- **系统**：Ubuntu 24.04.4 LTS
- **SSH连接**：用户名 **ubuntu**，密钥位于 `D:\WorkBuddy\linmeng2026key.pem`
- **MySQL连接**：`mysql -u root -proot linmeng`
- **已安装**：Node.js, MySQL, Nginx, PM2
- **防火墙**：ufw 已启用，端口 22/80/443/3000 已开放

### 数据库同步问题（2026-04-09）
- **问题**：服务器 sys_configs 表缺少配置项，导致网站显示异常
- **同步内容**：anti_flying, expert_types, level_bonus, reward_base
- **解决方案**：使用 SSH 连接 ubuntu@150.158.12.243 执行 SQL 插入

### 网站状态
- **IP访问**：http://150.158.12.243 ✅ 正常工作
- **域名访问**：http://www.3qall.com ✅ 正常工作
- **项目目录**：`/var/www/linmeng/`（前端：`frontend`，后端：`server`）
- **API运行**：`pm2 start server/src/app.js --name linmeng-server`

### 本地开发配置（2026-04-10更新）
- **本地MySQL**：安装在 `C:\Program Files\MySQL\MySQL Server 8.4`，root密码 `root`
- **本地数据库**：`linmeng`（已从服务器同步）
  - 183条行政区数据（包含新增的3个开发区）
  - 37条需求数据
  - 31条资源数据
  - 54条标签数据
  - 30种专家类型
- **后端连接本地**：`server/.env.local` 已配置 `DB_HOST=localhost`
- **开发预览**：前端 `localhost:5173` → 后端 `localhost:3000` → 本地 MySQL

### 开发流程（安全验证）
1. 本地修改代码
2. 本地 `npm run build` 构建
3. 本地 `npm run dev` 预览（连接服务器数据库，数据完整）
4. 确认无误后上传到服务器

### 🔴 修改代码后必做（2026-04-12）
**每次修改完代码后，必须立即：**
1. 检查服务状态：`Get-NetTCPConnection -LocalPort 3000,5173`
2. 如有服务未启动，启动：
   - 后端：`Start-Process powershell -ArgumentList "-NoExit","-Command","cd 'D:\WorkBuddy\20260331205655\server'; node src/app.js" -WindowStyle Normal`
   - 前端：`Start-Process powershell -ArgumentList "-NoExit","-Command","cd 'D:\WorkBuddy\20260331205655\client'; npm run dev" -WindowStyle Normal`
3. 用 `preview_url` 打开预览让用户验证

### 数据库配置（sys_configs）
| 配置键 | 说明 |
|--------|------|
| member_levels | 会员等级配置 |
| member_benefits | 会员权益配置 |
| ambassador_commission | 大使提成配置 |
| match_algorithm | 匹配算法权重 |
| match_reward | 撮合奖励配置 |
| anti_flying | 防飞单规则 |
| expert_types | 专家类型 |
| level_bonus | 等级奖励 |
| reward_base | 奖励基础配置 |
| basic_types | 基础数据类型 |
| rating_config | 评分配置 |
| anti_flying_level | 防飞单等级门槛 |

## 测试账号（密码均为 123456）
- 管理员：admin
- 社区账号：liuyong, zhanghua, wangli, lisimin, chenjie
- 大使账号：dashi1-dashi5
- 商家账号：shangjia1-shangjia10, whsp1-whsp20

## 工作习惯与注意事项

### 🔴 页面验证规则（2026-04-10）
- **用 preview_url 打开页面验证前，必须先用 `Get-NetTCPConnection -LocalPort 3000,5173` 确认服务在运行（状态=Listen）**
- 确认服务正常后再用 preview_url 打开页面

### PowerShell 命令规范
- ❌ **不要用 `curl`** - Windows PowerShell 中 `curl` 是 `Invoke-WebRequest` 的别名，处理响应流时会卡住
- ✅ **用 `Invoke-WebRequest` 或 `curl.exe`** - 建议加 `-TimeoutSec 10` 设置超时
  ```powershell
  # 正确方式1: PowerShell原生命令
  Invoke-WebRequest -Uri "http://localhost:3000/api/xxx" -UseBasicParsing -TimeoutSec 10
  
  # 正确方式2: 真正的curl
  curl.exe -s http://localhost:3000/api/xxx
  ```

### 服务状态检查
- 端口检查用 `Get-NetTCPConnection -LocalPort xxx`
- TCP连通性用 `Test-NetConnection -ComputerName localhost -Port xxx`

### 前端调试
- 本地开发前端：**http://localhost:5173**
- 本地开发后端：**http://localhost:3000**
- 记得按 `Ctrl+F5` 强制刷新清除缓存

### 后端重启
- 如果后端无响应，先 `Stop-Process -Name node -Force` 再重启
- 启动命令：`cd D:\WorkBuddy\20260331205655\server; node src/app.js`
- 用 `Start-Process powershell -ArgumentList "-NoExit","-Command","..."` 启动可看到日志

### 前端部署（2026-04-09更新）
- **前端目录**：`/var/www/linmeng/client`
- **部署步骤**：
  1. `npm run build` 构建前端
  2. SSH到服务器：`ssh -i "D:\WorkBuddy\linmeng2026key.pem" ubuntu@150.158.12.243`
  3. 清空目录：`sudo rm -rf /var/www/linmeng/client/* && sudo chown -R ubuntu:ubuntu /var/www/linmeng/client`
  4. 本地SCP上传：`scp -i "D:\WorkBuddy\linmeng2026key.pem" -r "D:\WorkBuddy\20260331205655\client\dist\*" ubuntu@150.158.12.243:/var/www/linmeng/client/`

### 功能更新记录（2026-04-09）
1. **社区端登录提示优化**：手机号不存在时提示"该手机号尚未注册，请先注册"
2. **未登录访问**：社区端和商家端首页允许未登录访问，但详情页需登录
3. **管理后台菜单**：需求列表和资源列表已移至"内容审核"下级菜单

### 功能更新记录（2026-04-10）
1. **行政区更新**：服务器regions表新增3个开发区（东湖新技术开发区、武汉经济技术开发区、东湖风景区）及其街道数据
2. **数据库同步**：本地数据库已同步服务器数据（demands 37条，resources 31条）
3. **社区注册页优化**：区、街、社区选择框改为一行显示
4. **资源类型统一**：管理后台 basic_types.resourceTypes 扩展为12种（专业服务、教育培训、场地资源、物资捐赠、志愿服务、资金赞助、技术支持、健康医疗、活动赞助、媒体宣传、技能培训、养老服务），商家端和社区端前端代码已同步更新
5. **资源卡片布局**：收藏/关注/分享三等分居中布局
6. **社区编辑页优化**：区街社区名不可修改，小区名称移至社区画像区域
7. **测试数据中文化**：demands和resources表的英文标题、内容已更新为中文
8. **商家会员有效期修复**：
   - 问题：金牌会员显示"长期有效"而不是"12个月"
   - 修复：Member.vue 和 Profile.vue 中添加默认值处理
   - 会员等级有效期映射：免费试用3个月、普通3个月、银牌12个月、金牌12个月、铂金12个月、钻石12个月
9. **备份与部署（2026-04-10 02:18）**：
   - 本地备份：linmeng_backup_2026-04-10_02-18-34.zip (19.91 MB)
   - 前端已部署到服务器
   - 数据库配置已同步到服务器

### 数字→中文映射统一规范（2026-04-11）

### 需求类型（demand_type）数字→中文
| 数字 | 中文 |
|------|------|
| 0 | 活动赞助 |
| 1 | 专家服务 |
| 2 | 空间运营 |
| 3 | 物资赞助 |
| 4 | 健康服务 |
| 5 | 教育培训 |

### 资源类型（resourceTypes）配置（9种，2026-04-12更新）
| 类型 | 图标 | 说明 |
|------|------|------|
| 资金赞助 | 💵 | 活动经费、奖金等资金支持 |
| 物资支持 | 📦 | 图书、设备、食品、活动与宣传物料、奖品等物资 |
| 人力服务 | 👥 | 人力支持、活动协助等 |
| 专业服务 | 🎓 | 法律、心理、咨询、设计、活动策划、健康医疗等 |
| 媒体宣传 | 📰 | 公众号、媒体推广等服务 |
| 就业岗位 | 💼 | 提供就业岗位 |
| 志愿服务 | ❤️ | 奉献爱心志愿服务 |
| 场地支持 | 🏠 | 会议室、活动室、运动场等场地空间资源支持 |
| 其他 | 📋 | 其他类型的资源支持 |

### 物资类型（goodsTypes）配置（12种，2026-04-12更新）
| 类型 | 说明 |
|------|------|
| 图书绘本 | 儿童绘本、文学书籍等 |
| 食品饮料 | 矿泉水、饮料、水果、零食等 |
| 文体用品 | 笔、本子、文具等 |
| 生活用品 | 日用品、家居用品等 |
| 电子设备 | 电脑、投影仪、音响等 |
| 活动物料 | 横幅、气球、彩旗等 |
| 防疫物资 | 口罩、消毒液等 |
| 服装鞋帽 | 服装、鞋子、帽子等 |
| 玩具礼品 | 玩具、奖品、礼品等 |
| 交通工具 | 车辆、电动车等 |
| 优惠券券 | 优惠券、兑换券等 |
| 其他物资 | 其他物资 |

### 目标对象（target_audience）数字→中文
| 数字 | 中文 |
|------|------|
| 0 | 老年人 |
| 1 | 儿童 |
| 2 | 青少年 |
| 3 | 家庭 |
| 4 | 退役军人 |
| 5 | 残障人士 |
| 6 | 新业态从业者 |
| 7 | 社区居民 |
| 8 | 其他 |

### 会员等级（member_level）数字→中文
| 数字 | 中文 |
|------|------|
| 0 | 普通会员 |
| 1 | 银牌会员 |
| 2 | 金牌会员 |
| 3 | 铂金会员 |
| 4 | 钻石会员 |
| 5 | 钻石会员 |

## 功能更新记录（2026-04-11）
1. **管理后台基础数据配置增强**：
   - 新增"社区类型"标签页：用于描述社区特征（老旧小区、新建社区、亲子社区等）
   - 新增"居民类型"标签页：用于描述居民群体特征（青少年、儿童、青年、退役军人等）
   - 所有类型列表（活动类型、专家类型、企业类型、行业分类、资源类型、社区类型、居民类型）添加排序功能（上下移动按钮）
   - 新增、编辑、删除、启用/禁用均可自动保存

2. **API同步更新**：
   - 后端 `getPublishTypes` API 更新：返回 community_types、resident_types、industry_types 等新类型
   - 商家端发布资源页面：从管理后台加载社区类型配置
   - 前端各页面：社区端、商家的发布页面均通过API获取类型配置

3. **基础数据类型结构**（sys_configs.basic_types）：
   - activityTypes: 活动类型
   - expertTypes: 专家类型
   - enterpriseTypes: 企业类型
   - industryTypes: 行业分类
   - resourceTypes: 资源类型
   - communityTypes: 社区类型（新增）
   - residentTypes: 居民类型（新增）

4. **社区端资源详情页修复（2026-04-11）**：
   - 问题：资源类型显示数字、可提供内容/期望回报字段显示不正确、缺少地址/logo/图片等字段
   - 修复：资源类型显示中文映射、移除不存在的字段、按类型显示相关字段、新增商家信息展示
   - 修改文件：
     - `client/src/views/community/ResourceDetail.vue`（前端页面，完全重写）
     - `server/src/controllers/communityController.js`（后端接口增加 expert_intro 字段）

5. **社区端资源详情页增强（2026-04-11 03:55）**：
   - 资源类型显示中文（0-11映射：专业服务、教育培训、场地资源、物资捐赠、志愿服务、资金赞助、技术支持、健康医疗、活动赞助、媒体宣传、技能培训、养老服务）
   - 按资源类型显示相关字段（金额范围、物资数量、领取方式、派遣人数、服务时长、服务范围、资质证明、收费标准、媒体类型、覆盖范围）
   - 新增商家信息展示：地址(merchant_address)、Logo(merchant_logo)、资源图片(images)、商家图文(merchant_images)
   - 新增商家介绍字段：社会身份(social_identity)、资质荣誉(honors)、专家介绍(expert_intro)
   - 移除不存在的字段：provide_content、expected_return（数据库中不存在）

6. **商家资源期望回报功能（2026-04-11 04:00）**：
   - 数据库：resources 表新增 expected_rewards（期望回报类型）、expected_reward_desc（期望回报说明）字段
   - 后端：merchantController.js 的 createResource/updateResource 接口添加这两个字段
   - 后端：communityController.js 的 getResourceDetail 接口返回 expected_rewards、expected_reward_desc
   - 前端：商家发布资源页 PublishResource.vue 提交时带上 expectedRewards、expectedRewardDesc
   - 前端：社区端 ResourceDetail.vue 重点展示"可提供内容"和"期望回报"区块

7. **商家发布资源字段完整提交（2026-04-11 04:25）**：
   - 问题：前端填写的很多字段没有提交到后端，导致详情页显示不正确
   - 数据库：resources 表新增 professional_type、tech_types、tech_service_type、goods_expiry、fund_scenes、media_channels、valid_until 字段
   - 数据库：demands 表新增 expert_count、frequency、need_visit、fee、expert_qualification、space_name、space_area、space_types、facilities、open_hours、cooperation_types、brand_display_types、space_usage_desc、volunteer_points 等字段
   - 后端：merchantController.js 的 createResource/updateResource 接口添加所有新字段
   - 前端：PublishResource.vue 提交时带上所有字段（professional_type、pricingType、mediaChannels 等）
   - 前端：ResourceDetail.vue 添加专业服务类型、技术类型、媒体渠道等显示，以及标签中文映射

8. **数字→中文映射全面修复（2026-04-11 22:30）**：
   - community/DemandSquare.vue：demand_type 显示数字→中文映射，parseAudience() 数字→中文，typeColors 改为数字键，筛选框 value 改为数字
   - community/DemandDetail.vue：demandTypeName 增加数字键支持，target_audience 通过 getAudienceName() 显示中文
   - community/MerchantDetail.vue：resourceTypeMap 从旧映射（0=便民服务）改为标准12类型
   - community/ResourceDetail.vue：memberLevelMap 增加 5: '钻石会员'
   - admin/AuditDemands.vue：typeLabels/typeColors 改为数字0-5，筛选框 value 改为数字，filterStatus 默认值改为数字
   - admin/Demands.vue：typeLabels/typeColors 从中文键改为数字键
   - admin/Resources.vue：资源类型从数字显示改为映射中文
   - server/communityController.js：getDemands 的 type 参数加 parseInt() 强制转整数
   - 新增映射函数：getServiceScopeLabel、getPricingTypeLabel、getTechTypeLabel、getTechServiceTypeLabel、getMediaChannelLabel

### 社区画像与雷达图（2026-04-12）

**后端新增 API**：
- `GET /admin/community/profile/:id` - 获取单个社区八维评分详情
- `GET /admin/community/scores` - 获取所有社区评分概览（列表用）

**八维评价体系**：
| 维度 | 指标 | 计算方式 |
|------|------|---------|
| 社区规模 | households（户数） | min(100, 户数/2000×100) |
| 家庭结构 | family_ratio + elderly_ratio | min(100, 占比/100×100) |
| 配套设施 | 广场/商业/学校/公园 | min(100, 设施数/4×100) |
| 公共空间 | public_space_area（m²） | min(100, 面积/10000×100) |
| 活跃程度 | 发布需求数+预算规模 | 发布数×15×60% + 预算/500×40% |
| 撮合能力 | intentions表 success_matches | min(100, 成功撮合数/20×100) |
| 商业资源 | merchant_count（商户数） | min(100, 商户数/50×100) |
| 平台曝光 | 总浏览量 | min(100, 浏览量/2000×100) |

**前端页面**：`client/src/views/admin/CommunityProfile.vue`
- SVG 雷达图（6轴），无外部依赖
- 雷达图颜色：绿(≥80)/黄(≥50)/红(<50)
- 维度详情卡片展示原始数据
- 综合评分 = 六维平均分

**访问入口**：
- 侧边栏：用户管理 → 社区画像（独立菜单）
- 社区列表：操作列 → 「画像」按钮

### 云存储接入（2026-04-12）
- **存储桶**：hsqkj-1304867442（上海 ap-shanghai）
- **密钥**：已配置在 `server/.env.local`（已加入 .gitignore 保护）
- **SDK**：`cos-nodejs-sdk-v5` 已安装
- **配置开关**：`USE_COS=true` 启用云存储，`false` 回退本地存储
- **已修改文件**：
  - `server/src/config/cos.js` - COS 配置
  - `server/src/services/cosUploadService.js` - 上传服务
  - `server/src/routes/upload.js` - 上传路由
  - `server/src/controllers/publicController.js` - 图片上传接口
  - `server/src/app.js` - 注册 upload 路由

### 商家端需求广场/首页修复（2026-04-12 22:30）
**问题**：1) 搜索框没有绑定回车搜索；2) 需求类型/标签显示为数字或占位符

**修复内容**：
1. **搜索框回车事件**：`client/src/views/merchant/Demands.vue` 添加 `@keyup.enter="doSearch"`
2. **需求类型映射**：`server/src/controllers/merchantController.js` 的 `loadDemandTypes()` 函数添加默认值（活动赞助、专家服务、空间运营、物资赞助、健康服务、教育培训）
3. **居民类型映射**：`loadResidentTypes()` 函数修复兼容字符串/对象两种数组格式
4. **社区标签映射**：`loadCommunityTags()` 函数从 `tags` 表加载（type='community'），表为空时使用默认标签（传统文化、体育健身、教育培训、健康养生、亲子活动、志愿服务、节庆活动、便民服务、社区治理、环境保护）
5. **publish-types API**：`publicController.js` 添加 `communityTags` 提取

**API 返回示例**：
- `demand_type_name`: "专家服务" ✅
- `target_audience_names`: ["中老年"] ✅
- `tags_names`: ["传统文化","教育培训"] ✅

### 统一类型映射系统（2026-04-12 23:00）

**问题根因**：
- 映射数据分散在多个地方（sys_configs表、tags表、hardcode函数）
- 映射时机不确定，导致有时显示数字有时显示中文
- 返回格式不一致（数字、字符串、对象数组）

**解决方案**：
1. **统一映射服务** `server/src/services/typeMapper.js`：
   - 启动时一次性加载所有映射数据到内存
   - 提供 `mapDemand()` / `mapResource()` 自动映射函数
   - 兼容多种数据格式（字符串数组、对象数组、无id字段格式）
   - 包含默认值保障

2. **新 API 接口**：
   - `GET /api/public/type-maps` - 获取所有类型映射数据

3. **已修改文件**：
   - `server/src/services/typeMapper.js` - 新建统一映射服务
   - `server/src/app.js` - 启动时初始化映射服务
   - `server/src/controllers/merchantController.js` - 使用统一映射
   - `server/src/controllers/publicController.js` - 使用统一映射
   - `server/src/routes/public.js` - 添加 type-maps 路由

**映射类型支持**：
- demandTypes, resourceTypes, activityTypes, expertTypes
- residentTypes, communityTypes, enterpriseTypes, industryTypes
- communityTags, resourceTags, mediaTypes, spaceTypes
- cooperationTypes, brandDisplayTypes, professionalTypes, techTypes

### 功能更新（2026-04-12 23:00）

#### 1. 智能客服增强
- **快捷问题分类**：平台服务、会员相关、合作问题、常见问题 四个分类
- **常见FAQ列表**：5条折叠显示的FAQ，可点击查看详情
- **关键词匹配**：支持多种问法匹配（如"密码"→"忘记密码怎么办？"）
- **修改文件**：`client/src/components/ServiceChat.vue`

#### 2. 管理后台留言管理增强
- **关联信息显示**：留言列表显示关联的需求/资源标题
- **多轮留言合并**：同一需求/资源的对话合并显示
- **留言详情增强**：显示关联信息、头像、对话记录
- **后端API**：`adminController.js` getComments 接口新增 merge 参数
- **修改文件**：
  - `server/src/controllers/adminController.js`
  - `client/src/views/admin/Comments.vue`

#### 3. 商家需求广场按距离排序
- **新增排序选项**：筛选栏添加"距离最近"选项
- **定位获取**：选择距离排序时自动获取用户位置
- **距离显示**：需求卡片显示距离（米/km）
- **后端距离计算**：使用 Haversine 公式计算地球表面距离
- **修改文件**：
  - `client/src/views/merchant/Demands.vue`
  - `server/src/controllers/merchantController.js`

### 功能更新记录（2026-04-12 21:30）
1. **资源广场页优化**（client/src/views/community/Resources.vue）：
   - 资源类型从下拉菜单改为标签形式展示
   - 点击标签可直接筛选对应类型
   - 灰色标签背景，蓝色为选中状态

2. **社区首页增强**（client/src/views/community/Home.vue）：
   - 新增"平台总浏览"统计卡片
   - 新增 `getPlatformStats` API 调用
   - 推荐资源卡片"立即联系"改为"留言咨询"

3. **商家端首页增强**（client/src/views/merchant/Home.vue）：
   - 新增"平台总需求"和"平台总资源"统计卡片

4. **管理后台浏览量保护**（server/src/controllers/adminController.js）：
   - dashboard API 添加浏览量安全检查
   - 单表浏览量上限 100 万，防止异常值显示
   - 新增 `/api/public/stats` 公开接口获取平台浏览量
