const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function waitAndFill(page, selector, text) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.fill(selector, text);
    return true;
  } catch { return false; }
}

async function login(page, loginUrl, creds) {
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Try multiple selector strategies
  let ok = false;
  for (const sel of ['input[type="text"]', 'input[placeholder*="手机"]', 'input[placeholder*="账号"]', 'input']) {
    if (await page.$(sel)) { await page.fill(sel, creds.phone || creds.username); ok = true; break; }
  }
  await page.waitForTimeout(300);

  for (const sel of ['input[type="password"]', 'input[placeholder*="密码"]', 'input[placeholder*="验证码"]']) {
    if (await page.$(sel)) { await page.fill(sel, creds.password || creds.code); break; }
  }
  await page.waitForTimeout(300);

  const btn = await page.$('button[type="submit"], button:has-text("登录")');
  if (btn) { await btn.click(); await page.waitForTimeout(3500); }
  return page.url();
}

async function testPage(page, url) {
  try {
    const responses = [];
    page.on('response', r => { if (r.status() >= 400) responses.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 50;
    const errors = responses.filter(r => !r.includes('logo.svg') && !r.includes('favicon') && !r.includes('ui-avatars'));
    return { url, ok: true, hasContent, errors };
  } catch (e) {
    return { url, ok: false, err: e.message.substring(0, 100) };
  }
}

async function test() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let totalErrors = 0;

  async function run(role, loginUrl, creds, pages) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!t.includes('logo.svg') && !t.includes('runtime.lastError') && !t.includes('favicon') && !t.includes('ui-avatars')) {
          consoleErrors.push(t.substring(0, 200));
        }
      }
    });

    const afterLogin = await login(page, loginUrl, creds);
    results.push(`\n===== ${role} 端 =====`);
    results.push(`  登录后URL: ${afterLogin}`);

    for (const p of pages) {
      const r = await testPage(page, BASE + p);
      if (r.ok) {
        const status = r.errors.length === 0 && r.hasContent ? '✅' : '⚠️';
        results.push(`  ${status} ${p} (${r.errors.length} errors)`);
        if (r.errors.length > 0) {
          r.errors.forEach(e => results.push(`      → ${e}`));
          totalErrors += r.errors.length;
        }
      } else {
        results.push(`  ❌ ${p}: ${r.err}`);
      }
    }
    await ctx.close();
  }

  results.push('=== 邻盟平台全面测试 ' + new Date().toLocaleString('zh-CN') + ' ===');

  // 社区
  await run('社区', BASE + '/community/login', { phone: '13800138000', password: '123456' }, [
    '/community/home', '/community/demands', '/community/resources', '/community/messages', '/community/profile'
  ]);

  // 商家
  await run('商家', BASE + '/merchant/login', { phone: '13900139000', password: '123456' }, [
    '/merchant/home', '/merchant/demands', '/merchant/resources', '/merchant/messages', '/merchant/profile', '/merchant/publish'
  ]);

  // 招商大使
  await run('招商大使', BASE + '/ambassador/login', { phone: '13900001111', password: '888888' }, [
    '/ambassador/home', '/ambassador/demands', '/ambassador/resources', '/ambassador/profile'
  ]);

  // 管理后台
  await run('管理后台', BASE + '/admin/login', { username: 'admin', password: 'admin123' }, [
    '/admin/home', '/admin/users/community', '/admin/users/merchant', '/admin/users/ambassador',
    '/admin/config/basic', '/admin/config/banner', '/admin/config/tag', '/admin/config/member',
    '/admin/config/rating', '/admin/config/algorithm', '/admin/notification'
  ]);

  results.push('\n========== 测试完成 ==========');
  results.push(`总 HTTP 错误数: ${totalErrors}`);

  const fs = require('fs');
  fs.writeFileSync('test-results3.md', results.join('\n'));
  console.log(results.join('\n'));
  await browser.close();
}

test().catch(console.error);
