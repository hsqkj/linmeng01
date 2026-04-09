const { Client } = require('ssh2');
const mysql = require('mysql2/promise');

// 配置
const LOCAL_DB = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'linmeng'
};

const SERVER_DB = {
  host: '150.158.12.243',
  user: 'root',
  password: 'root',
  database: 'linmeng'
};

const SSH_CONFIG = {
  host: '150.158.12.243',
  port: 22,
  username: 'root',
  privateKey: require('fs').readFileSync('D:/WorkBuddy/linmeng2026key.pem')
};

// 关键配置项
const CONFIG_KEYS = [
  'member_levels',
  'region_tree',
  'business_types',
  'demand_types',
  'resource_types',
  'tag_types'
];

async function queryLocal(sql) {
  const conn = await mysql.createConnection(LOCAL_DB);
  const [rows] = await conn.query(sql);
  await conn.end();
  return rows;
}

async function queryServer(sql) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(`mysql -u root -proot linmeng -e "${sql.replace(/"/g, '\\"')}" 2>/dev/null`, (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        let data = '';
        stream.on('data', (chunk) => data += chunk);
        stream.on('close', () => {
          conn.end();
          resolve(data);
        });
      });
    });
    conn.connect(SSH_CONFIG);
  });
}

async function main() {
  console.log('=' .repeat(60));
  console.log('本地 vs 服务器 数据库全面对比');
  console.log('=' .repeat(60));
  console.log();

  // 1. 对比 sys_configs
  console.log('【1. sys_configs 配置对比】');
  console.log('-'.repeat(60));

  const localConfigs = await queryLocal('SELECT config_key, config_value FROM sys_configs');
  const serverConfigsStr = await queryServer('SELECT config_key, config_value FROM sys_configs');
  const serverConfigs = [];

  // 解析服务器返回的数据
  const lines = serverConfigsStr.trim().split('\n');
  if (lines.length > 1) {
    const headers = lines[0].split('\t');
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length >= 2) {
        serverConfigs.push({ config_key: values[0], config_value: values[1] });
      }
    }
  }

  for (const key of CONFIG_KEYS) {
    const local = localConfigs.find(c => c.config_key === key);
    const server = serverConfigs.find(c => c.config_key === key);

    console.log(`\n[${key}]`);
    if (!local) {
      console.log('  ❌ 本地: 不存在');
    }
    if (!server) {
      console.log('  ❌ 服务器: 不存在');
    }
    if (local && server) {
      if (local.config_value === server.config_value) {
        console.log('  ✅ 一致');
      } else {
        console.log('  ❌ 不一致');
        console.log('  本地值:', local.config_value.substring(0, 200) + '...');
        console.log('  服务器值:', server.config_value.substring(0, 200) + '...');
      }
    } else if (local && !server) {
      console.log('  ⚠️ 服务器缺少此配置');
      console.log('  本地值:', local.config_value.substring(0, 200) + '...');
    } else if (!local && server) {
      console.log('  ⚠️ 本地缺少此配置');
      console.log('  服务器值:', server.config_value.substring(0, 200) + '...');
    }
  }

  // 2. 对比各表数据量
  console.log('\n\n【2. 各表数据量对比】');
  console.log('-'.repeat(60));

  const tables = ['regions', 'tags', 'communities', 'ambassadors', 'merchants', 'demands', 'resources', 'banners', 'intentions', 'comments', 'system_notifications'];

  for (const table of tables) {
    try {
      const localCount = await queryLocal(`SELECT COUNT(*) as cnt FROM ${table}`);
      const serverCountStr = await queryServer(`SELECT COUNT(*) as cnt FROM ${table}`);
      const serverCount = parseInt(serverCountStr.trim().split('\n')[1]) || 0;

      const localNum = localCount[0]?.cnt || 0;
      const match = localNum === serverCount ? '✅' : '❌';

      console.log(`${match} ${table}: 本地 ${localNum} | 服务器 ${serverCount}`);
    } catch (e) {
      console.log(`❌ ${table}: 查询失败 - ${e.message}`);
    }
  }

  // 3. 找出服务器数据库中缺少的配置
  console.log('\n\n【3. 服务器缺少的配置项】');
  console.log('-'.repeat(60));

  const localKeys = localConfigs.map(c => c.config_key);
  const serverKeys = serverConfigs.map(c => c.config_key);

  const missingOnServer = localKeys.filter(k => !serverKeys.includes(k));
  if (missingOnServer.length > 0) {
    console.log('服务器缺少以下配置:');
    missingOnServer.forEach(k => {
      const config = localConfigs.find(c => c.config_key === k);
      console.log(`  - ${k}: ${config?.config_value?.substring(0, 100)}...`);
    });
  } else {
    console.log('服务器配置项完整');
  }

  console.log('\n' + '='.repeat(60));
  console.log('对比完成');
  console.log('=' .repeat(60));
}

main().catch(console.error);
