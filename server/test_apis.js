const http = require('http');
function post(path, body, cb) {
  const b = JSON.stringify(body);
  const req = http.request({hostname:'150.158.12.243',port:80,path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}}, res => {
    let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{cb(JSON.parse(d))}catch(e){cb({raw:d})}});
  });
  req.write(b);req.end();
}
function get(path, token, cb) {
  const req = http.request({hostname:'150.158.12.243',port:80,path,method:'GET',headers:{'Authorization':'Bearer '+token}}, res => {
    let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{cb(JSON.parse(d))}catch(e){cb({raw:d})}});
  });
  req.end();
}

// 1. 公共 API
console.log('\n=== 公共 API ===');
get('/api/public/regions', null, d => {
  const data = d.data || d;
  const regionCount = Array.isArray(data) ? data.length : 0;
  console.log('行政区划:', d.code===200?'OK':'FAIL', regionCount+'条');
});

// 2. 管理后台登录
post('/api/admin/login',{username:'admin',password:'admin123'}, r => {
  const adminToken = r.data && r.data.token;
  console.log('\n=== 管理后台 ===');
  console.log('登录:', r.code===200?'OK':'FAIL', r.data && r.data.admin && r.data.admin.realName);
  if (!adminToken) return;
  const tests = [
    ['社区列表(/users/communities)', '/api/admin/users/communities?page=1&pageSize=5'],
    ['商家列表(/users/merchants)', '/api/admin/users/merchants?page=1&pageSize=5'],
    ['大使列表(/users/ambassadors)', '/api/admin/users/ambassadors?page=1&pageSize=5'],
    ['需求审核(/audit/demands)', '/api/admin/audit/demands?page=1&pageSize=5'],
    ['资源审核(/audit/resources)', '/api/admin/audit/resources?page=1&pageSize=5'],
    ['需求列表(/demands)', '/api/admin/demands?page=1&pageSize=5'],
    ['资源列表(/resources)', '/api/admin/resources?page=1&pageSize=5'],
    ['基础类型配置', '/api/admin/config/basic-types'],
    ['标签配置', '/api/admin/config/tags'],
    ['社区画像(1)', '/api/admin/community/profile/1'],
  ];
  let done = 0;
  tests.forEach(([name, path]) => {
    get(path, adminToken, d => {
      console.log(name+':', d.code===200?'OK':'FAIL('+d.code+')');
      if (++done >= tests.length) testMerchant();
    });
  });
});

// 3. 商家端
function testMerchant() {
  post('/api/merchant/login',{phone:'18800000002',code:'123456'}, r => {
    const mToken = r.data && r.data.token;
    console.log('\n=== 商家端 ===');
    console.log('登录:', r.code===200?'OK':'FAIL');
    if (!mToken) return;
    const tests = [
      ['需求大厅', '/api/merchant/demands?page=1&pageSize=5'],
      ['资源大厅', '/api/merchant/resources?page=1&pageSize=5'],
      ['商家资料', '/api/merchant/profile'],
    ];
    let done = 0;
    tests.forEach(([name, path]) => {
      get(path, mToken, d => {
        console.log(name+':', d.code===200?'OK':'FAIL('+d.code+')');
        if (++done >= tests.length) testCommunity();
      });
    });
  });
}

// 4. 社区端
function testCommunity() {
  post('/api/community/login',{phone:'18800000001',code:'123456'}, r => {
    const cToken = r.data && r.data.token;
    console.log('\n=== 社区端 ===');
    console.log('登录:', r.code===200?'OK':'FAIL');
    if (!cToken) return;
    const tests = [
      ['需求大厅', '/api/community/demands?page=1&pageSize=5'],
      ['资源大厅', '/api/community/resources?page=1&pageSize=5'],
      ['社区资料', '/api/community/profile'],
    ];
    let done = 0;
    tests.forEach(([name, path]) => {
      get(path, cToken, d => {
        console.log(name+':', d.code===200?'OK':'FAIL('+d.code+')');
        if (++done >= tests.length) testEnd();
      });
    });
  });
}

function testEnd() {
  console.log('\n=== 测试完成 ===');
}
