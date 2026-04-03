const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', msg => {
    const t = msg.type(), text = msg.text();
    if (t === 'error' && !text.includes('logo.svg') && !text.includes('runtime.lastError')) {
      errors.push(`[ERROR] ${text.substring(0, 300)}`);
    }
  });

  // Test admin login
  console.log('Testing admin login...');
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Login
  const inputs = await page.$$('input');
  console.log(`Inputs: ${inputs.length}`);
  if (inputs.length >= 1) await inputs[0].fill('admin');
  if (inputs.length >= 2) await inputs[1].fill('admin123');
  const btns = await page.$$('button');
  if (btns.length >= 1) {
    await btns[0].click();
    await page.waitForTimeout(3000);
    console.log(`After login: ${page.url()}`);
  }

  // Go to config/basic
  console.log('\nNavigating to /admin/config/basic...');
  await page.goto(BASE + '/admin/config/basic', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log(`Current URL: ${page.url()}`);
  console.log(`Errors (${errors.length}):`, errors.slice(-10));

  // Go to community demands
  errors.length = 0;
  console.log('\nNavigating to /community/demands...');
  await page.goto(BASE + '/community/demands', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log(`Current URL: ${page.url()}`);
  console.log(`Errors (${errors.length}):`, errors.slice(-5));

  // Merchant demands
  errors.length = 0;
  console.log('\nNavigating to /merchant/demands...');
  await page.goto(BASE + '/merchant/demands', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log(`Current URL: ${page.url()}`);
  console.log(`Errors (${errors.length}):`, errors.slice(-5));

  await browser.close();
}

test().catch(console.error);
