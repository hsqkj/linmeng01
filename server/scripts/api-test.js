const http = require('http')

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = 'Bearer ' + token
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET', headers }, (res) => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }))
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  // 1. 管理员登录
  console.log('\n=== 1. 管理员登录 ===')
  const loginResult = await post('/api/admin/login', { username: 'admin', password: 'admin123' })
  console.log('状态码:', loginResult.status)
  console.log('响应:', JSON.stringify(loginResult.body, null, 2))

  if (loginResult.status !== 200) {
    console.error('登录失败，停止测试')
    process.exit(1)
  }

  const adminToken = loginResult.body.data.token
  console.log('Token获取成功，长度:', adminToken.length)

  // 2. 获取仪表盘数据
  console.log('\n=== 2. 仪表盘数据 ===')
  const dashboard = await get('/api/admin/dashboard', adminToken)
  console.log('状态码:', dashboard.status)
  console.log('响应:', JSON.stringify(dashboard.body, null, 2))

  // 3. 公共API - 获取轮播图
  console.log('\n=== 3. 公共轮播图 ===')
  const banners = await get('/api/public/banners?position=community')
  console.log('状态码:', banners.status)
  console.log('轮播图数量:', banners.body.data ? banners.body.data.length : 0)

  console.log('\n=== 所有测试通过！===')
  process.exit(0)
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
