const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function login(page, loginUrl) {
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const btn = await page.$('button:has-text("登录")');
  if (btn) {
    await btn.click();
    await page.waitForTimeout(4000);
  }
  return page.url();
}

async function testPage(page, url) {
  const failed = [];
  const handler = resp => {
    const u = resp.url().replace(BASE, '');
    if (resp.status() >= 400 && !u.includes('logo.svg') && !u.includes('favicon') && !u.includes('ui-avatars')) {
      failed.push(`${resp.status()} ${u}`);
    }
  };
  page.on('response', handler);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    page.off('response', handler);
    return { ok: true, errors: failed };
  } catch (e) {
    page.off('response', handler);
    return { ok: false, err: e.message.substring(0, 100) };
  }
}

async function run(role, loginUrl, pages) {
  const browser = await chromium.launch({ headless: true });
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

  const afterLogin = await login(page, loginUrl);
  const results = [`\n===== ${role} 端 =====`, `  登录后: ${afterLogin}`];

  for (const p of pages) {
    consoleErrors.length = 0;
    const r = await testPage(page, BASE + p);
    if (r.ok) {
      if (r.errors.length === 0 && consoleErrors.length === 0) {
        results.push(`  ✅ ${p}`);
      } else {
        results.push(`  ⚠️  ${p} (${r.errors.length} API + ${consoleErrors.length} console)`);
        r.errors.forEach(e => results.push(`      API: ${e}`));
        consoleErrors.slice(0, 2).forEach(e => results.push(`      Console: ${e.substring(0, 120)}`));
      }
    } else {
      results.push(`  ❌ ${p}: ${r.err}`);
    }
  }

  await browser.close();
  return results;
}

async function main() {
  const allResults = ['=== 邻盟全面测试 ' + new Date().toLocaleString('zh-CN') + ' ==='];

  allResults.push(...(await run('社区', BASE + '/community/login', [
    '/community', '/community/demands', '/community/resources', '/community/messages', '/community/profile'
  ])));

  allResults.push(...(await run('商家', BASE + '/merchant/login', [
    '/merchant', '/merchant/demands', '/merchant/resources', '/merchant/messages', '/merchant/profile', '/merchant/publish'
  ])));

  allResults.push(...(await run('招商大使', BASE + '/ambassador/login', [
    '/ambassador/home', '/ambassador/demands', '/ambassador/resources', '/ambassador/profile'
  ])));

  allResults.push(...(await run('管理后台', BASE + '/admin/login', [
    '/admin/home', '/admin/users/community', '/admin/users/merchant', '/admin/users/ambassador',
    '/admin/config/basic', '/admin/config/banner', '/admin/config/tag', '/admin/config/member',
    '/admin/config/rating', '/admin/config/algorithm', '/admin/notification'
  ])));

  // 首页
  const homeBrowser = await chromium.launch({ headless: true });
  const homePage = await homeBrowser.newPage();
  const homeErrors = [];
  homePage.on('console', msg => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!t.includes('logo.svg') && !t.includes('runtime.lastError') && !t.includes('favicon')) {
        homeErrors.push(t.substring(0, 200));
      }
    }
  });
  await homePage.goto(BASE + '/', { waitUntil: 'networkidle' });
  await homePage.waitForTimeout(2000);
  allResults.push('\n===== 首页 =====');
  allResults.push(homeErrors.length === 0 ? '  ✅ 首页正常' : `  ⚠️  首页 ${homeErrors.length} 错误`);
  homeErrors.forEach(e => allResults.push(`      ${e.substring(0, 150)}`));
  await homeBrowser.close();

  allResults.push('\n========== 测试完成 ==========');
  const fs = require('fs');
  fs.writeFileSync('test-final-results.md', allResults.join('\n'));
  console.log(allResults.join('\n'));
}

main().catch(console.error);
