const mysql = require('mysql2/promise');
async function f() {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'linmeng', charset: 'utf8mb4'
  });
  const [r] = await c.query("SELECT config_value FROM system_configs WHERE config_key='membership'");
  const data = JSON.parse(r[0].config_value);
  console.log('Lv1 name:', data.member_levels[0].name);
  console.log('Lv2 name:', data.member_levels[1].name);
  console.log('Lv1 fee:', data.member_levels[0].fee);
  console.log('Lv1 intent_limit:', data.member_levels[0].intent_limit);
  await c.end();
}
f();
