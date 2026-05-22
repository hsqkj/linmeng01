const fs = require('fs');
const file = '/opt/linmeng/server/src/app.js';
let content = fs.readFileSync(file, 'utf8');

// 在 wechatRoutes require 后面加 authRoutes require
if (!content.includes("require('./routes/auth')")) {
  content = content.replace(
    "const wechatRoutes = require('./routes/wechat')",
    "const wechatRoutes = require('./routes/wechat')\nconst authRoutes = require('./routes/auth')"
  );
  console.log('✅ 已添加 authRoutes require');
} else {
  console.log('ℹ️ authRoutes require 已存在');
}

// 在 wechat 路由挂载后面加 auth 路由挂载
if (!content.includes("app.use('/api/auth'")) {
  content = content.replace(
    "app.use('/api/wechat', wechatRoutes)",
    "app.use('/api/wechat', wechatRoutes)\napp.use('/api/auth', authRoutes)"
  );
  console.log('✅ 已添加 /api/auth 路由挂载');
} else {
  console.log('ℹ️ /api/auth 路由已存在');
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ app.js 写入完成');

// 验证
const lines = content.split('\n').filter(l => l.includes('auth'));
console.log('auth相关行:');
lines.forEach(l => console.log(' ', l.trim()));
