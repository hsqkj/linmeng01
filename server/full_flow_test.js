/**
 * 邻盟系统 - 全角色业务流程测试（修正版）
 */

const http = require('http');
const API_BASE = 'http://150.158.12.243/api';
const results = {};

// HTTP请求函数
function httpReq(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? require('https') : require('http');
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    };
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, ok: res.statusCode < 400, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, ok: false, error: 'JSON解析失败' }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, ok: false, error: '超时' }); });
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

function section(title) {
  console.log(`\n${'='.repeat(56)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(56));
}

function test(name, result) {
  const icon = result.ok ? '✅' : '❌';
  const extra = result.data?.message && !result.ok ? ` [${result.data.message}]` : '';
  console.log(`  ${icon} ${name}: ${result.status}${extra}`);
  return result.ok;
}

function auth(token) { return { 'Authorization': `Bearer ${token}` }; }

// ============================================================
// 1. 公共接口
// ============================================================
async function testPublic() {
  section('🌐 公共接口');

  const regions = await httpReq(`${API_BASE}/public/regions`);
  const regionsOk = test('行政区划', regions);
  if (regionsOk) {
    const data = regions.data?.data || [];
    console.log(`     省:${data.filter(r=>r.level===0).length} 市:${data.filter(r=>r.level===1).length} 区:${data.filter(r=>r.level===2).length} 街道:${data.filter(r=>r.level===3).length} 社区:${data.filter(r=>r.level===4).length}`);
  }

  const tags = await httpReq(`${API_BASE}/public/tags`);
  test('标签列表', tags);

  const industries = await httpReq(`${API_BASE}/public/industries`);
  test('行业分类', industries);

  const publishTypes = await httpReq(`${API_BASE}/public/publish-types`);
  test('发布类型', publishTypes);

  const expertTypes = await httpReq(`${API_BASE}/public/expert-types`);
  test('专家类型', expertTypes);

  const banners = await httpReq(`${API_BASE}/public/banners`);
  test('轮播图', banners);

  const stats = await httpReq(`${API_BASE}/public/stats`);
  test('统计数据', stats);

  const sms = await httpReq(`${API_BASE}/public/sms/send`, {
    method: 'POST', body: { phone: '18800001111', type: 'community' }
  });
  test('发送验证码', sms);

  results.public = [regionsOk, tags, industries, publishTypes, expertTypes, banners, stats, sms].every(r => r?.ok !== false);
}

// ============================================================
// 2. 管理后台
// ============================================================
async function testAdmin() {
  section('🔧 管理后台（admin/admin123）');

  const login = await httpReq(`${API_BASE}/admin/login`, {
    method: 'POST', body: { username: 'admin', password: 'admin123' }
  });
  const loginOk = test('登录', login);
  if (!loginOk) { results.admin = false; return; }

  const token = login.data?.data?.token;
  const h = auth(token);

  const dashboard = await httpReq(`${API_BASE}/admin/dashboard`, { headers: h });
  test('仪表盘', dashboard);

  const communities = await httpReq(`${API_BASE}/admin/users/communities?page=1&pageSize=10`, { headers: h });
  const commOk = test('社区列表', communities);
  if (commOk) console.log(`     共 ${communities.data?.data?.total || 0} 个社区`);

  const merchants = await httpReq(`${API_BASE}/admin/users/merchants?page=1&pageSize=10`, { headers: h });
  const merchOk = test('商家列表', merchants);
  if (merchOk) console.log(`     共 ${merchants.data?.data?.total || 0} 个商家`);

  const ambassadors = await httpReq(`${API_BASE}/admin/users/ambassadors?page=1&pageSize=10`, { headers: h });
  test('大使列表', ambassadors);

  const demandAudit = await httpReq(`${API_BASE}/admin/audit/demands?page=1&pageSize=10`, { headers: h });
  test('需求审核', demandAudit);

  const resourceAudit = await httpReq(`${API_BASE}/admin/audit/resources?page=1&pageSize=10`, { headers: h });
  test('资源审核', resourceAudit);

  const demands = await httpReq(`${API_BASE}/admin/demands?page=1&pageSize=10`, { headers: h });
  test('需求列表', demands);

  const resources = await httpReq(`${API_BASE}/admin/resources?page=1&pageSize=10`, { headers: h });
  test('资源列表', resources);

  const profile = await httpReq(`${API_BASE}/admin/community/profile/20`, { headers: h });
  const profOk = test('社区画像(id=20)', profile);
  if (profOk) {
    const p = profile.data?.data;
    console.log(`     名称:${p?.name || 'N/A'} 小区:${p?.compounds?.length||0} 场地:${p?.spaces?.length||0}`);
  }

  const basicTypes = await httpReq(`${API_BASE}/admin/config/basic-types`, { headers: h });
  test('基础数据类型', basicTypes);

  const tags = await httpReq(`${API_BASE}/admin/config/tags`, { headers: h });
  test('标签配置', tags);

  results.admin = [dashboard, commOk, merchOk, ambassadors, demandAudit, resourceAudit, demands, resources, profOk, basicTypes, tags].every(r => r?.ok !== false);
}

// ============================================================
// 3. 商家端
// ============================================================
async function testMerchant() {
  section('🏪 商家端（18800000002/123456）');

  const login = await httpReq(`${API_BASE}/merchant/login`, {
    method: 'POST', body: { phone: '18800000002', code: '123456' }
  });
  const loginOk = test('登录', login);
  if (!loginOk) { results.merchant = false; return; }

  const token = login.data?.data?.token;
  const h = auth(token);

  const demands = await httpReq(`${API_BASE}/merchant/demands?page=1&pageSize=10`, { headers: h });
  const demOk = test('需求大厅', demands);
  if (demOk) console.log(`     共 ${demands.data?.data?.total || 0} 条需求`);

  const demandsByRegion = await httpReq(`${API_BASE}/merchant/demands?region_id=2&page=1&pageSize=10`, { headers: h });
  test('需求大厅(按区)', demandsByRegion);

  const resources = await httpReq(`${API_BASE}/merchant/resources?page=1&pageSize=10`, { headers: h });
  const resOk = test('资源大厅', resources);
  if (resOk) console.log(`     共 ${resources.data?.data?.total || 0} 条资源`);

  const profile = await httpReq(`${API_BASE}/merchant/profile`, { headers: h });
  const profOk = test('商家资料', profile);
  if (profOk) console.log(`     公司:${profile.data?.data?.company_name || 'N/A'}`);

  const myResources = await httpReq(`${API_BASE}/merchant/my/resources`, { headers: h });
  test('我的资源', myResources);

  // 发布资源（带所有必要字段）
  const createResource = await httpReq(`${API_BASE}/merchant/resources`, {
    method: 'POST', headers: h,
    body: {
      title: '【测试】商家咨询资源',
      content: '自动化测试创建的资源',
      resource_type: 0,
      professional_type: '咨询服务',
      price_range: '面议',
      images: [],
      tags: [],
      status: 1
    }
  });
  const createResOk = test('发布资源', createResource);
  const resourceId = createResource.data?.data?.id;

  // 删除测试资源
  if (resourceId) {
    const delR = await httpReq(`${API_BASE}/merchant/resources/${resourceId}`, { method: 'DELETE', headers: h });
    test('删除测试资源', delR);
  }

  const intentions = await httpReq(`${API_BASE}/merchant/my/intentions`, { headers: h });
  test('我的意向', intentions);

  const favorites = await httpReq(`${API_BASE}/merchant/favorites`, { headers: h });
  test('我的收藏', favorites);

  const notifications = await httpReq(`${API_BASE}/merchant/notifications`, { headers: h });
  test('消息通知', notifications);

  const member = await httpReq(`${API_BASE}/merchant/member`, { headers: h });
  test('会员信息', member);

  const memberLevels = await httpReq(`${API_BASE}/merchant/member/levels`, { headers: h });
  test('会员等级', memberLevels);

  results.merchant = [demOk, resOk, profOk, myResources, createResOk, intentions, favorites, notifications, member, memberLevels].every(r => r?.ok !== false);
}

// ============================================================
// 4. 社区端
// ============================================================
async function testCommunity() {
  section('🏠 社区端（18800000001/123456）');

  const login = await httpReq(`${API_BASE}/community/login`, {
    method: 'POST', body: { phone: '18800000001', code: '123456' }
  });
  const loginOk = test('登录', login);
  if (!loginOk) { results.community = false; return; }

  const token = login.data?.data?.token;
  const h = auth(token);

  const demands = await httpReq(`${API_BASE}/community/demands?page=1&pageSize=10`, { headers: h });
  const demOk = test('需求大厅', demands);
  if (demOk) console.log(`     共 ${demands.data?.data?.total || 0} 条需求`);

  const resources = await httpReq(`${API_BASE}/community/resources?page=1&pageSize=10`, { headers: h });
  const resOk = test('资源大厅', resources);
  if (resOk) console.log(`     共 ${resources.data?.data?.total || 0} 条资源`);

  const demandDetail = await httpReq(`${API_BASE}/community/demands/1`, { headers: h });
  test('需求详情(id=1)', demandDetail);

  const resourceDetail = await httpReq(`${API_BASE}/community/resources/1`, { headers: h });
  test('资源详情(id=1)', resourceDetail);

  const profile = await httpReq(`${API_BASE}/community/profile`, { headers: h });
  const profOk = test('社区资料', profile);
  if (profOk) console.log(`     社区:${profile.data?.data?.name || 'N/A'}`);

  // 发布需求
  const createDemand = await httpReq(`${API_BASE}/community/demands`, {
    method: 'POST', headers: h,
    body: {
      title: '【测试】社区活动需求',
      content: '自动化测试创建的需求',
      demand_type: 0,
      budget_min: 1000,
      budget_max: 3000,
      images: [],
      tags: [],
      status: 1
    }
  });
  const createOk = test('发布需求', createDemand);
  const demandId = createDemand.data?.data?.id;

  // 我的需求
  const myDemands = await httpReq(`${API_BASE}/community/my/demands`, { headers: h });
  test('我的需求', myDemands);

  const myPosts = await httpReq(`${API_BASE}/community/favorites`, { headers: h });
  test('我的收藏', myPosts);

  const notifications = await httpReq(`${API_BASE}/community/notifications`, { headers: h });
  test('消息通知', notifications);

  // 删除测试需求
  if (demandId) {
    const delD = await httpReq(`${API_BASE}/community/demands/${demandId}`, { method: 'DELETE', headers: h });
    test('删除测试需求', delD);
  }

  results.community = [demOk, resOk, profOk, createOk, myDemands, myPosts, notifications].every(r => r?.ok !== false);
}

// ============================================================
// 5. 大使端
// ============================================================
async function testAmbassador() {
  section('🤝 大使端（18800000003/123456）');

  const login = await httpReq(`${API_BASE}/ambassador/login`, {
    method: 'POST', body: { phone: '18800000003', code: '123456' }
  });
  const loginOk = test('登录', login);
  if (!loginOk) { results.ambassador = false; return; }

  const token = login.data?.data?.token;
  const h = auth(token);

  const home = await httpReq(`${API_BASE}/ambassador/home`, { headers: h });
  test('大使首页', home);

  const profile = await httpReq(`${API_BASE}/ambassador/profile`, { headers: h });
  const profOk = test('大使资料', profile);
  if (profOk) {
    const p = profile.data?.data;
    console.log(`     大使:${p?.name || p?.real_name || 'N/A'}`);
  }

  const qrcode = await httpReq(`${API_BASE}/ambassador/qrcode`, { headers: h });
  const qrOk = test('推广二维码', qrcode);
  if (qrOk) console.log(`     ${qrcode.data?.data?.qrcode_url ? '已生成' : '未生成'}`);

  const records = await httpReq(`${API_BASE}/ambassador/records`, { headers: h });
  test('邀请记录', records);

  const commission = await httpReq(`${API_BASE}/ambassador/commission`, { headers: h });
  test('收益明细', commission);

  const commissionSummary = await httpReq(`${API_BASE}/ambassador/commission/summary`, { headers: h });
  test('收益汇总', commissionSummary);

  const commissionConfig = await httpReq(`${API_BASE}/ambassador/commission/config`, { headers: h });
  test('佣金配置', commissionConfig);

  const withdraw = await httpReq(`${API_BASE}/ambassador/withdraw`, { headers: h });
  test('提现账户', withdraw);

  const withdrawHistory = await httpReq(`${API_BASE}/ambassador/withdraw/history`, { headers: h });
  test('提现记录', withdrawHistory);

  const notifications = await httpReq(`${API_BASE}/ambassador/notifications`, { headers: h });
  test('消息通知', notifications);

  results.ambassador = [home, profOk, qrOk, records, commission, commissionSummary, commissionConfig, withdraw, withdrawHistory, notifications].every(r => r?.ok !== false);
}

// ============================================================
// 运行
// ============================================================
async function main() {
  console.log('\n🚀 邻盟系统 - 全角色业务流程测试');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🌐 服务器: http://150.158.12.243`);

  await testPublic();
  await testAdmin();
  await testMerchant();
  await testCommunity();
  await testAmbassador();

  section('📊 测试汇总');
  const total = Object.values(results).filter(Boolean).length;
  const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => k);
  const labels = { public: '🌐公共', admin: '🔧管理后台', merchant: '🏪商家端', community: '🏠社区端', ambassador: '🤝大使端' };

  console.log(`\n  通过: ${total}/5  失败: ${failed.length}/5`);
  Object.entries(results).forEach(([k, v]) => console.log(`  ${labels[k]}: ${v ? '✅通过' : '❌失败'}`));
  if (failed.length) console.log(`  失败模块: ${failed.map(k => labels[k]).join('、')}`);

  console.log('\n✅ 测试完成！\n');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
