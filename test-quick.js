/**
 * 邻盟后端 API 全面测试（修正版）
 * 使用实际的后端路由路径
 */
const http = require('http')

function request(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const bodyStr = body ? JSON.stringify(body) : null
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method,
      headers: {}
    }
    if (token) opts.headers['Authorization'] = 'Bearer ' + token
    if (bodyStr) {
      opts.headers['Content-Type'] = 'application/json'
      opts.headers['Content-Length'] = Buffer.byteLength(bodyStr)
    }
    const req = http.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
        catch(e) { resolve({ status: res.statusCode, body: d.slice(0, 150) }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

const get = (url, token) => request('GET', url, token)
const post = (url, data) => request('POST', url, null, data)

const results = []
let passed = 0
let failed = 0

function check(name, ok, detail) {
  if (ok) {
    console.log(`  ✅ ${name}`)
    passed++
  } else {
    console.log(`  ❌ ${name}${detail ? ' | ' + detail : ''}`)
    failed++
  }
  results.push({ name, ok })
}

async function main() {
  const BASE = 'http://localhost:3000'
  console.log('=== 邻盟后端 API 全面测试 ===\n')

  // ========== 1. 登录测试 ==========
  console.log('[1] 登录接口')
  
  let adminToken, communityToken, merchantToken, ambassadorToken

  try {
    const r = await post(BASE + '/api/admin/login', { username: 'admin', password: 'admin123' })
    adminToken = r.body?.data?.token
    check('管理员登录', r.status === 200 && adminToken)
  } catch(e) { check('管理员登录', false, e.message) }

  try {
    const r = await post(BASE + '/api/community/login', { phone: '13800138000', code: '123456' })
    communityToken = r.body?.data?.token
    check('社区登录', r.status === 200 && communityToken)
  } catch(e) { check('社区登录', false, e.message) }

  try {
    const r = await post(BASE + '/api/merchant/login', { phone: '13900139000', code: '123456' })
    merchantToken = r.body?.data?.token
    check('商家登录', r.status === 200 && merchantToken)
  } catch(e) { check('商家登录', false, e.message) }

  try {
    const r = await post(BASE + '/api/ambassador/login', { phone: '13900001111', code: '888888' })
    ambassadorToken = r.body?.data?.token
    check('大使登录', r.status === 200 && ambassadorToken)
  } catch(e) { check('大使登录', false, e.message) }

  // ========== 2. 公共接口 ==========
  console.log('\n[2] 公共接口（/api/public）')
  
  for (const [path, name] of [
    ['/api/public/regions', '地区列表'],
    ['/api/public/tags', '标签列表'],
    ['/api/public/industries', '行业分类'],
  ]) {
    try {
      const r = await get(BASE + path)
      check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,80) : '')
    } catch(e) { check(name, false, e.message) }
  }

  // ========== 3. 社区端 - 公开接口 ==========
  console.log('\n[3] 社区端公开接口')

  for (const [path, name] of [
    ['/api/community/banners', '社区轮播图'],
    ['/api/community/config', '社区配置'],
    ['/api/community/recommend/resources', '首页推荐资源'],
    ['/api/community/resources', '资源大厅'],
    ['/api/community/resources?page=1&pageSize=5', '资源大厅分页'],
    ['/api/community/demands', '需求大厅'],
    ['/api/community/demands?page=1&pageSize=5', '需求大厅分页'],
  ]) {
    try {
      const r = await get(BASE + path)
      check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,80) : '')
    } catch(e) { check(name, false, e.message) }
  }

  // ========== 4. 社区端 - 需登录 ==========
  console.log('\n[4] 社区端登录接口')

  if (communityToken) {
    for (const [path, name] of [
      ['/api/community/profile', '个人资料'],
      ['/api/community/resources', '资源大厅(登录)'],
      ['/api/community/demands', '需求大厅(登录)'],
      ['/api/community/my/demands', '我的需求'],
      ['/api/community/my/intentions', '我的合作意向'],
      ['/api/community/my/comments', '我的留言咨询'],
      ['/api/community/rewards', '奖励明细'],
    ]) {
      try {
        const r = await get(BASE + path, communityToken)
        check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,80) : '')
      } catch(e) { check(name, false, e.message) }
    }
  } else {
    console.log('  ⚠️ 无社区token，跳过')
  }

  // ========== 5. 商家端 - 公开接口 ==========
  console.log('\n[5] 商家端公开接口')

  for (const [path, name] of [
    ['/api/merchant/banners', '商家轮播图'],
    ['/api/merchant/config', '商家配置'],
    ['/api/merchant/recommend/demands', '首页推荐需求'],
    ['/api/merchant/demands', '需求大厅'],
    ['/api/merchant/resources', '资源大厅(公开)'],
  ]) {
    try {
      const r = await get(BASE + path)
      check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,80) : '')
    } catch(e) { check(name, false, e.message) }
  }

  // ========== 6. 商家端 - 需登录 ==========
  console.log('\n[6] 商家端登录接口')

  if (merchantToken) {
    for (const [path, name] of [
      ['/api/merchant/profile', '个人资料'],
      ['/api/merchant/demands', '需求大厅(登录)'],
      ['/api/merchant/my/resources', '我的资源'],
      ['/api/merchant/my/intentions', '我的合作意向'],
      ['/api/merchant/member', '会员信息'],
      ['/api/merchant/member/levels', '会员等级列表'],
      ['/api/merchant/member/payments', '支付记录'],
    ]) {
      try {
        const r = await get(BASE + path, merchantToken)
        check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,80) : '')
      } catch(e) { check(name, false, e.message) }
    }
  } else {
    console.log('  ⚠️ 无商家token，跳过')
  }

  // ========== 7. 大使端 ==========
  console.log('\n[7] 大使端接口')

  if (ambassadorToken) {
    for (const [path, name] of [
      ['/api/ambassador/home', '首页数据'],
      ['/api/ambassador/qrcode', '渠道推广码'],
      ['/api/ambassador/records', '发展记录'],
      ['/api/ambassador/commission', '提成明细'],
      ['/api/ambassador/commission/summary', '提成汇总'],
      ['/api/ambassador/withdraw', '提现账户'],
      ['/api/ambassador/withdraw/history', '提现历史'],
    ]) {
      try {
        const r = await get(BASE + path, ambassadorToken)
        check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,80) : '')
      } catch(e) { check(name, false, e.message) }
    }
  } else {
    console.log('  ⚠️ 无大使token，跳过')
  }

  // ========== 8. 管理端 ==========
  console.log('\n[8] 管理端接口')

  if (adminToken) {
    for (const [path, name] of [
      ['/api/admin/dashboard', '仪表盘'],
      ['/api/admin/users/communities', '社区用户列表'],
      ['/api/admin/users/merchants', '商家用户列表'],
      ['/api/admin/users/ambassadors', '大使用户列表'],
      ['/api/admin/admins', '管理员列表'],
      ['/api/admin/audit/demands', '需求审核列表'],
      ['/api/admin/audit/resources', '资源审核列表'],
      ['/api/admin/matching', '撮合列表'],
      ['/api/admin/comments', '留言列表'],
      ['/api/admin/config/basic-types', '基础类型配置'],
      ['/api/admin/config/members', '会员配置'],
      ['/api/admin/config/ambassador', '大使配置'],
      ['/api/admin/config/reward', '奖励配置'],
      ['/api/admin/config/rating', '评级配置'],
      ['/api/admin/config/banners', '轮播图配置'],
      ['/api/admin/config/tags', '标签配置'],
      ['/api/admin/config/basic/regions', '行政区划'],
      ['/api/admin/config/algorithm', '算法配置'],
      ['/api/admin/finance', '财务数据'],
      ['/api/admin/notifications', '系统通知'],
    ]) {
      try {
        const r = await get(BASE + path, adminToken)
        check(name, r.status === 200, r.status !== 200 ? JSON.stringify(r.body).slice(0,100) : '')
      } catch(e) { check(name, false, e.message) }
    }
  } else {
    console.log('  ⚠️ 无管理员token，跳过')
  }

  // ========== 汇总 ==========
  console.log('\n' + '='.repeat(50))
  console.log(`总计: ${results.length} 项  ✅ 通过: ${passed}  ❌ 失败: ${failed}`)
  
  const failedItems = results.filter(r => !r.ok)
  if (failedItems.length > 0) {
    console.log('\n失败项目:')
    failedItems.forEach(f => console.log(`  ❌ ${f.name}`))
  } else {
    console.log('\n🎉 所有接口测试通过！')
  }
}

main().catch(e => { console.error('脚本执行失败:', e.message); process.exit(1) })
