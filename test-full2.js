const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
let results = [];
let errorCount = 0;
let warnCount = 0;

function log(msg) { results.push(msg); }
function addError(msg) { results.push('[ERROR] ' + msg); errorCount++; }
function addWarn(msg) { results.push('[WARN] ' + msg); warnCount++; }

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function test() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Collect errors/warnings
  page.on('console', msg => {
    const t = msg.type(), text = msg.text();
    if (t === 'error' && !text.includes('logo.svg') && !text.includes('runtime.lastError') && !text.includes('favicon')) {
      addError(`Console: ${text.substring(0, 200)}`);
    }
    if (t === 'warning' && text.includes('[el-')) {
      addWarn(`ElementPlus: ${text.substring(0, 200)}`);
    }
  });
  page.on('pageerror', err => addError(`PageError: ${err.message.substring(0, 200)}`));

  async function loadPage(url, waitMs = 2000) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });
      await page.waitForTimeout(waitMs);
      return true;
    } catch (e) {
      addError(`Load fail: ${url} - ${e.message.substring(0, 100)}`);
      return false;
    }
  }

  async function login(url, phone, code, role) {
    await loadPage(url, 1500);
    // Wait for Vue to mount
    await page.waitForSelector('input', { timeout: 5000 }).catch(() => {});
    await sleep(500);

    const inputs = await page.$$('input');
    const btns = await page.$$('button');
    log(`\n--- ${role} login page: ${inputs.length} inputs, ${btns.length} buttons ---`);

    if (inputs.length >= 1) {
      await inputs[0].fill(phone);
      await sleep(200);
    }
    if (inputs.length >= 2) {
      await inputs[1].fill(code);
      await sleep(200);
    }
    if (btns.length >= 1) {
      await btns[0].click();
      await sleep(2500);
      log(`  After login: ${page.url()}`);
    }
  }

  async function testNav(routes) {
    for (const r of routes) {
      const ok = await loadPage(BASE + r);
      if (ok) {
        log(`  ✅ ${r}`);
      }
    }
  }

  log('=== 邻盟平台全面测试 ' + new Date().toLocaleString('zh-CN') + ' ===\n');

  // ====== 社区端 ======
  log('===== 社区端 =====');
  await login(BASE + '/community/login', '13800138000', '123456', '社区');
  await testNav(['/community/home', '/community/demands', '/community/resources',
    '/community/messages', '/community/profile']);

  // ====== 商家端 ======
  log('\n===== 商家端 =====');
  await login(BASE + '/merchant/login', '13900139000', '123456', '商家');
  await testNav(['/merchant/home', '/merchant/demands', '/merchant/resources',
    '/merchant/messages', '/merchant/profile', '/merchant/publish']);

  // ====== 招商大使端 ======
  log('\n===== 招商大使端 =====');
  await login(BASE + '/ambassador/login', '13900001111', '888888', '招商大使');
  await testNav(['/ambassador/home', '/ambassador/demands', '/ambassador/resources',
    '/ambassador/profile']);

  // ====== 管理后台 ======
  log('\n===== 管理后台 =====');
  await login(BASE + '/admin/login', 'admin', 'admin123', '管理员');
  // Admin uses username/password
  await loadPage(BASE + '/admin/login', 1500);
  await page.waitForSelector('input', { timeout: 5000 }).catch(() => {});
  await sleep(500);
  const inputs2 = await page.$$('input');
  if (inputs2.length >= 1) await inputs2[0].fill('admin');
  if (inputs2.length >= 2) await inputs2[1].fill('admin123');
  const btns2 = await page.$$('button');
  if (btns2.length >= 1) await btns2[0].click();
  await sleep(2500);
  log(`  After admin login: ${page.url()}`);
  await testNav(['/admin/home', '/admin/users/community', '/admin/users/merchant',
    '/admin/users/ambassador', '/admin/config/basic', '/admin/config/banner',
    '/admin/config/tag', '/admin/config/member', '/admin/config/rating',
    '/admin/config/algorithm', '/admin/notification']);

  // ====== 首页 ======
  log('\n===== 首页 =====');
  await loadPage(BASE + '/');

  // Summary
  log('\n========== 测试完成 ==========');
  log(`错误: ${errorCount}, 警告: ${warnCount}`);

  // Save
  const fs = require('fs');
  fs.writeFileSync('test-results2.md', results.join('\n'));
  console.log(results.join('\n'));
  console.log('\n已保存到 test-results2.md');

  await browser.close();
}

test().catch(e => { console.error(e); process.exit(1); });
