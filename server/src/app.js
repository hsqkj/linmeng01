/**
 * 邻盟后端服务入口
 * 社区资源智能匹配助手
 */

// 加载环境变量配置（.env.local 覆盖 .env）
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

// 初始化统一类型映射服务
const typeMapper = require('./services/typeMapper')
typeMapper.initialize().catch(err => {
  console.error('[App] 类型映射服务初始化失败:', err.message)
})

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 前端构建文件（cpolar部署时只暴露3000端口）
app.use(express.static(path.join(__dirname, '../../client/dist')))

// 路由
const adminRoutes = require('./routes/admin')
const communityRoutes = require('./routes/community')
const merchantRoutes = require('./routes/merchant')
const ambassadorRoutes = require('./routes/ambassador')
const publicRoutes = require('./routes/public')
const uploadRoutes = require('./routes/upload')
const wechatRoutes = require('./controllers/wechatController')
const wechatPayRoutes = require('./routes/wechatPay')

app.use('/api/admin', adminRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/merchant', merchantRoutes)
app.use('/api/ambassador', ambassadorRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/wechat', wechatRoutes)
app.use('/api/wechat/pay', wechatPayRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 404处理（非API路径返回前端index.html，支持SPA路由）
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  } else {
    res.status(404).json({ code: 404, message: '接口不存在' })
  }
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('=== Error ===')
  console.error('Message:', err.message)
  console.error('Code:', err.code)
  console.error('Type:', err.type)
  console.error('Stack:', err.stack)
  console.error('============')
  res.status(500).json({ code: 500, message: err.message || '服务器错误' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║        邻盟后端服务启动成功                  ║
║        端口: ${PORT}                           ║
║        环境: ${process.env.NODE_ENV || 'development'}            ║
╚══════════════════════════════════════════════╝
  `)
})

module.exports = app
