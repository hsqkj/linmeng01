const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const results = [];
let browser, page;
let errorCount = 0;
let warnCount = 0;

function log(msg) {
  console.log(msg);
  results.push(msg);
}

function logError(msg) {
  console.error(msg);
  results.push('[ERROR] ' + msg);
  errorCount++;
}

function logWarn(msg) {
  console.warn(msg);
  results.push('[WARN] ' + msg);
  warnCount++;
}

async function initBrowser() {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();

  // Listen to all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('logo.svg') && !text.includes('runtime.lastError')) {
        logError(`Console Error: ${text}`);
      }
    } else if (msg.type() === 'warning') {
      const text = msg.text();
      if (!text.includes('[Vue Router warn]')) {
        logWarn(`Console Warning: ${text}`);
      }
    }
  });

  // Listen to page errors
  page.on('pageerror', err => {
    logError(`Page Error: ${err.message}`);
  });

  // Listen to failed requests
  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.includes('logo.svg') && !url.includes('favicon')) {
      logWarn(`Failed request: ${req.failure()?.errorText} - ${url}`);
    }
  });
}

async function goto(url, wait = 2000) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(wait);
    log(`  ✅ Loaded: ${url}`);
    return true;
  } catch (e) {
    logError(`  ❌ Failed to load: ${url} - ${e.message}`);
    return false;
  }
}

async function consoleErrors() {
  const logs = [];
  // Return current console errors from the page
  return logs;
}

async function testLoginPage(role, url) {
  log(`\n=== ${role} 登录页 ===`);
  await goto(url);

  // Check page title
  const title = await page.title();
  log(`  页面标题: ${title}`);

  // Count form elements
  const inputs = await page.$$('input');
  const buttons = await page.$$('button');
  log(`  输入框: ${inputs.length} 个, 按钮: ${buttons.length} 个`);

  // Check for visible text
  const bodyText = await page.textContent('body');
  const hasLogin = bodyText.includes('登录');
  const hasTitle = bodyText.includes('邻盟');
  log(`  包含"登录": ${hasLogin}, 包含"邻盟": ${hasTitle}`);

  return { inputs, buttons };
}

async function testLogin(role, url, phone, code = '123456') {
  log(`\n=== ${role} 登录测试 ===`);
  await goto(url);
  await page.waitForTimeout(1000);

  try {
    // Fill phone
    const phoneInput = await page.$('input[type="text"], input[placeholder*="手机"]');
    if (phoneInput) {
      await phoneInput.fill(phone);
      log(`  ✅ 填写手机号: ${phone}`);
    }

    // Fill code
    const codeInput = await page.$('input[placeholder*="验证码"], input[type="tel"]');
    if (codeInput) {
      await codeInput.fill(code);
      log(`  ✅ 填写验证码: ${code}`);
    }

    // Click login button
    const loginBtn = await page.$('button:has-text("登录"), button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
      log(`  ✅ 点击登录按钮`);
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      log(`  当前URL: ${currentUrl}`);
    }
  } catch (e) {
    logError(`  登录操作失败: ${e.message}`);
  }
}

async function testPageLinks(role, basePath) {
  log(`\n=== ${role} 端页面链接测试 ===`);

  const routes = [
    '/community/home',
    '/community/demands',
    '/community/resources',
    '/community/messages',
    '/community/profile',
    '/merchant/home',
    '/merchant/demands',
    '/merchant/resources',
    '/merchant/messages',
    '/merchant/profile',
    '/merchant/publish',
    '/ambassador/home',
    '/ambassador/demands',
    '/ambassador/resources',
    '/ambassador/profile',
    '/admin/home',
    '/admin/users/community',
    '/admin/users/merchant',
    '/admin/users/ambassador',
    '/admin/config/basic',
    '/admin/config/banner',
    '/admin/config/tag',
    '/admin/config/member',
    '/admin/config/rating',
    '/admin/config/algorithm',
    '/admin/notification',
  ];

  for (const route of routes) {
    if (route.startsWith(basePath) || basePath === '/') {
      await goto(BASE + route);
    }
  }
}

// ============ MAIN ============
(async () => {
  try {
    await initBrowser();
    log('=== 邻盟平台全面测试开始 ===');
    log(`时间: ${new Date().toLocaleString('zh-CN')}`);

    // 1. 首页
    log('\n========== 首页测试 ==========');
    await goto(BASE + '/');

    // 2. 所有登录页
    await testLoginPage('社区', BASE + '/community/login');
    await testLoginPage('商家', BASE + '/merchant/login');
    await testLoginPage('招商大使', BASE + '/ambassador/login');
    await testLoginPage('管理后台', BASE + '/admin/login');

    // 3. 社区端测试
    log('\n========== 社区端测试 ==========');
    await testLogin('社区', BASE + '/community/login', '13800138000', '123456');
    if (page.url().includes('/community/home') || page.url().includes('/community')) {
      const communityRoutes = ['/community/home', '/community/demands', '/community/resources',
        '/community/messages', '/community/profile'];
      for (const r of communityRoutes) {
        await goto(BASE + r);
      }
    }

    // 4. 商家端测试
    log('\n========== 商家端测试 ==========');
    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());
    await testLogin('商家', BASE + '/merchant/login', '13900139000', '123456');
    if (page.url().includes('/merchant/home') || page.url().includes('/merchant')) {
      const merchantRoutes = ['/merchant/home', '/merchant/demands', '/merchant/resources',
        '/merchant/messages', '/merchant/profile', '/merchant/publish'];
      for (const r of merchantRoutes) {
        await goto(BASE + r);
      }
    }

    // 5. 招商大使端测试
    log('\n========== 招商大使端测试 ==========');
    await page.evaluate(() => localStorage.clear());
    await testLogin('招商大使', BASE + '/ambassador/login', '13900001111', '888888');
    if (page.url().includes('/ambassador/home') || page.url().includes('/ambassador')) {
      const ambassadorRoutes = ['/ambassador/home', '/ambassador/demands',
        '/ambassador/resources', '/ambassador/profile'];
      for (const r of ambassadorRoutes) {
        await goto(BASE + r);
      }
    }

    // 6. 管理后台测试
    log('\n========== 管理后台测试 ==========');
    await page.evaluate(() => localStorage.clear());
    await goto(BASE + '/admin/login');
    await page.waitForTimeout(1000);
    // Admin uses username + password
    const usernameInput = await page.$('input[placeholder*="用户"]');
    const passwordInput = await page.$('input[type="password"]');
    if (usernameInput && passwordInput) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) {
        await loginBtn.click();
        await page.waitForTimeout(3000);
        log(`  登录后URL: ${page.url()}`);
      }
    }

    if (page.url().includes('/admin')) {
      const adminRoutes = [
        '/admin/home',
        '/admin/users/community', '/admin/users/merchant', '/admin/users/ambassador',
        '/admin/config/basic', '/admin/config/banner', '/admin/config/tag',
        '/admin/config/member', '/admin/config/rating', '/admin/config/algorithm',
        '/admin/notification'
      ];
      for (const r of adminRoutes) {
        await goto(BASE + r);
      }
    }

    // Summary
    log('\n========== 测试完成 ==========');
    log(`总错误数: ${errorCount}`);
    log(`总警告数: ${warnCount}`);

    // Write results to file
    const fs = require('fs');
    fs.writeFileSync('test-results.md', results.join('\n'));
    console.log('\n结果已保存到 test-results.md');

  } catch (e) {
    console.error('测试脚本错误:', e);
  } finally {
    if (browser) await browser.close();
  }
})();
