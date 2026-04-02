/**
 * 邻盟后端服务入口
 * 社区资源智能匹配助手
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 路由
const adminRoutes = require('./routes/admin')
const communityRoutes = require('./routes/community')
const merchantRoutes = require('./routes/merchant')
const ambassadorRoutes = require('./routes/ambassador')
const publicRoutes = require('./routes/public')

app.use('/api/admin', adminRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/merchant', merchantRoutes)
app.use('/api/ambassador', ambassadorRoutes)
app.use('/api/public', publicRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err)
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
