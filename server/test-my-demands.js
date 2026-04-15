const http = require('http')

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    if (postData) {
      req.write(postData)
    }
    req.end()
  })
}

async function main() {
  // 登录
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/community/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ phone: '13800138001', code: '123456' }))

  const token = loginRes.data?.token
  if (!token) {
    console.log('Login failed:', loginRes)
    return
  }
  console.log('Login success, token:', token.substring(0, 20) + '...')

  // 获取我的需求
  const demandsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/community/my/demands?page=1&pageSize=2',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  console.log('\n我的需求数据:')
  if (demandsRes.data?.list?.[0]) {
    const d = demandsRes.data.list[0]
    console.log('ID:', d.id)
    console.log('标题:', d.title)
    console.log('target_audience:', d.target_audience)
    console.log('tags:', d.tags)
    console.log('activity_type_name:', d.activity_type_name)
  }
}

main().catch(console.error)
