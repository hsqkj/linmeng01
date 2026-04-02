require('dotenv').config({ path: '.env' })
const http = require('http')

function post(path, body) {
  return new Promise((resolve) => {
    const d = JSON.stringify(body)
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) }
    }, res => {
      let s = ''; res.on('data', c => s += c); res.on('end', () => resolve(JSON.parse(s)))
    })
    req.write(d); req.end()
  })
}

function getAuth(path, token) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 3000, path,
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let s = ''; res.on('data', c => s += c); res.on('end', () => resolve(JSON.parse(s)))
    })
    req.end()
  })
}

async function test() {
  // 1. 管理员登录
  const lr = await post('/api/admin/login', { username: 'admin', password: 'admin123' })
  console.log('管理员登录:', lr.code === 200 ? 'OK ✓' : 'FAIL ✗', lr.data?.admin?.username)
  const token = lr.data?.token

  // 2. 管理后台 - 资源留言
  const cr = await getAuth('/api/admin/comments?type=resource', token)
  console.log('后台资源留言:', cr.code === 200 ? 'OK ✓' : 'FAIL ✗', '共', cr.data?.pagination?.total || 0, '条')
  cr.data?.list?.forEach(c => console.log('  -', c.community_name || c.merchant_name, ':', c.content.substring(0, 25) + '...'))

  // 3. 管理后台 - 需求留言
  const dr = await getAuth('/api/admin/comments?type=demand', token)
  console.log('后台需求留言:', dr.code === 200 ? 'OK ✓' : 'FAIL ✗', '共', dr.data?.pagination?.total || 0, '条')
  dr.data?.list?.forEach(c => console.log('  -', c.community_name || c.merchant_name, ':', c.content.substring(0, 25) + '...'))

  // 4. 商家端 - 资源留言
  const mr = await getAuth('/api/merchant/comments/resource/1', token)
  console.log('商家看资源1留言:', mr.code === 200 ? 'OK ✓' : 'FAIL ✗', mr.data?.length || 0, '条')
}

test().catch(console.error)
