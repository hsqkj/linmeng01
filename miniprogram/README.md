# 小程序开发文档

## 项目概述
邻盟微信小程序，复制现有H5功能，提供更流畅的移动端体验。

## 目录结构
```
miniprogram/
├── app.js                 # 应用入口
├── app.json               # 应用配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── sitemap.json           # SEO配置
├── pages/
│   ├── index/            # 首页
│   ├── community/        # 社区端
│   │   ├── home/         # 社区首页
│   │   ├── login/        # 登录
│   │   ├── profile/      # 个人中心
│   │   ├── resources/    # 资源广场
│   │   └── resource-detail/  # 资源详情
│   ├── merchant/         # 商家端
│   └── ambassador/       # 大使端
├── components/           # 公共组件
└── utils/                # 工具函数
```

## 已完成
- ✅ 项目基础结构
- ✅ 首页框架
- ✅ 社区端登录页面（微信一键登录 + 手机号登录）
- ✅ 社区端首页
- ✅ 社区端个人中心
- ✅ 资源广场页面
- ✅ 资源详情页
- ✅ 后端微信API支持

## 待开发
- ⬜ 商家端完整页面
- ⬜ 大使端完整页面
- ⬜ 微信支付集成
- ⬜ 发布需求/资源功能
- ⬜ 收藏/奖励等功能
- ⬜ 分享朋友圈功能

## 后端API
已在 `/server/src/controllers/wechatController.js` 添加微信API：

| 接口 | 说明 |
|------|------|
| POST /api/wechat/code2session | 微信登录 |
| POST /api/wechat/bindPhone | 绑定手机号 |
| GET /api/wechat/accessToken | 获取access_token |
| GET /api/wechat/jssdkconfig | 获取JS-SDK配置 |

## 使用方法
1. 下载微信开发者工具
2. 打开项目，选择 `miniprogram` 目录
3. 填入 AppID: `wx0d8ceb64dd56ca6c`
4. 启动开发模式
