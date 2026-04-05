/**
 * 用 cpolar API 为 8080 端口创建一个临时 HTTP 隧道，并打印出公开 URL。
 * cpolar 守护进程需事先运行（已确认 4040 端口在监听）。
 */
const http = require('http');
const https = require('https');

// ---- 登录 cpolar 网站，获取 API token ----
function login(email, password) {
  return new Promise((resolve, reject) => {
    const body = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const opts = {
      hostname: 'dashboard.cpolar.com',
      path: '/api/auth/local',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 15000,
    };
    const req = https.request(opts, r => {
      let d = '';
      r.on('data', c => (d += c));
      r.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve({ raw: d.substring(0, 500), status: r.statusCode }); }
      });
    });
    req.on('error', e => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('login timeout')); });
    req.write(body);
    req.end();
  });
}

// ---- 向本地 cpolar 守护进程创建临时隧道 ----
function createTunnel(localPort) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      addr: String(localPort),
      proto: 'http',
      name: 'prototype',
      inspect: false,
    });
    const opts = {
      hostname: '127.0.0.1',
      port: 4040,
      path: '/api/tunnels',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    };
    const req = http.request(opts, r => {
      let d = '';
      r.on('data', c => (d += c));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: r.statusCode, raw: d.substring(0, 500) }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

// ---- 列出已有隧道 ----
function listTunnels() {
  return new Promise((resolve) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET',
      timeout: 10000,
    };
    const req = http.request(opts, r => {
      let d = '';
      r.on('data', c => (d += c));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: r.statusCode, raw: d.substring(0, 1000) }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

(async () => {
  console.log('--- 1. 列出现有隧道 ---');
  const existing = await listTunnels();
  console.log(JSON.stringify(existing, null, 2));

  console.log('\n--- 2. 尝试创建 prototype 隧道 (8080) ---');
  const res = await createTunnel(8080);
  console.log(JSON.stringify(res, null, 2));

  if (res.data && res.data.public_url) {
    console.log('\n✅ 原型公开链接:', res.data.public_url);
  } else if (res.data && res.data.tunnel && res.data.tunnel.public_url) {
    console.log('\n✅ 原型公开链接:', res.data.tunnel.public_url);
  } else {
    console.log('\n⚠ 未直接获取到 public_url，请查看上面的完整响应');
  }
})();
