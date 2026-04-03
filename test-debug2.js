const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const errors = [];
  const failed404 = [];
  const failed500 = [];

  page.on('console', msg => {
    const t = msg.type(), text = msg.text();
    if (t === 'error' && !text.includes('logo.svg') && !text.includes('runtime.lastError') && !text.includes('favicon')) {
      errors.push(`[ERROR] ${text.substring(0, 300)}`);
    }
  });
  page.on('response', resp => {
    if (resp.status() === 404 && !resp.url().includes('logo.svg') && !resp.url().includes('favicon')) {
      failed404.push(`404: ${resp.url()}`);
    }
    if (resp.status() === 500) {
      failed500.push(`500: ${resp.url()}`);
    }
  });

  // Login admin
  console.log('=== Admin Login ===');
  await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const inputs = await page.$$('input');
  console.log(`Inputs: ${inputs.length}`);
  if (inputs.length >= 2) {
    await inputs[0].fill('admin');
    await inputs[1].fill('admin123');
    const btns = await page.$$('button');
    if (btns.length >= 1) {
      await btns[0].click();
      await page.waitForTimeout(4000);
      console.log(`URL after login: ${page.url()}`);
    }
  }

  // Config/basic
  errors.length = 0; failed404.length = 0; failed500.length = 0;
  console.log('\n=== /admin/config/basic ===');
  await page.goto(BASE + '/admin/config/basic', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log(`Errors: ${errors.length}`);
  console.log(`404s: ${failed404}`);
  console.log(`500s: ${failed500}`);

  // Community demands (need to login first)
  errors.length = 0; failed404.length = 0; failed500.length = 0;
  console.log('\n=== /community/demands ===');
  await page.goto(BASE + '/community/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const inputs2 = await page.$$('input');
  if (inputs2.length >= 2) {
    await inputs2[0].fill('13800138000');
    await inputs2[1].fill('123456');
    const btns2 = await page.$$('button');
    if (btns2.length >= 1) {
      await btns2[0].click();
      await page.waitForTimeout(4000);
      console.log(`After community login: ${page.url()}`);
    }
  }
  await page.goto(BASE + '/community/demands', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log(`Errors: ${errors.length}`);
  console.log(`500s: ${failed500}`);
  console.log(`Errors:`, errors.slice(0, 3));

  await browser.close();
}

test().catch(console.error);
