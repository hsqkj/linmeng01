const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(BASE + '/community/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Get Vue component state
  const state = await page.evaluate(() => {
    // Check if Vue app is mounted
    const app = document.querySelector('#app');
    return {
      appChildren: app ? app.children.length : 0,
      bodyText: document.body.textContent.substring(0, 300),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()),
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder })),
      loginBtnExists: !!document.querySelector('button:has-text("登录")'),
    };
  });

  console.log('State:', JSON.stringify(state, null, 2));

  // Check for the login button
  const btn = await page.$('button:has-text("登录")');
  console.log('Login button found:', !!btn);

  if (btn) {
    await btn.click();
    await page.waitForTimeout(4000);
    console.log('After click URL:', page.url());
  }

  const token = await page.evaluate(() => localStorage.getItem('community_token'));
  console.log('community_token:', token ? 'SET ✓' : 'NOT SET ✗');

  // Merchant
  console.log('\n--- Merchant ---');
  await page.goto(BASE + '/merchant/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const btn2 = await page.$('button:has-text("登录")');
  if (btn2) {
    await btn2.click();
    await page.waitForTimeout(4000);
    console.log('After click URL:', page.url());
  }
  const token2 = await page.evaluate(() => localStorage.getItem('merchant_token'));
  console.log('merchant_token:', token2 ? 'SET ✓' : 'NOT SET ✗');

  // Ambassador
  console.log('\n--- Ambassador ---');
  await page.goto(BASE + '/ambassador/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const btn3 = await page.$('button:has-text("登录")');
  if (btn3) {
    await btn3.click();
    await page.waitForTimeout(4000);
    console.log('After click URL:', page.url());
  }
  const token3 = await page.evaluate(() => localStorage.getItem('ambassador_token'));
  console.log('ambassador_token:', token3 ? 'SET ✓' : 'NOT SET ✗');

  await browser.close();
}

test().catch(console.error);
