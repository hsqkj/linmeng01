const mysql = require('mysql2');
const c = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'linmeng'
});
c.connect();
c.query('SELECT config_value FROM sys_configs WHERE config_key = ?', ['ambassador_commission'], (e, r) => {
  if (r.length) {
    const val = r[0].config_value;
    console.log('Raw value:');
    console.log(val);
    console.log('\nLength:', val.length);
    // Check if it's valid JSON
    try {
      JSON.parse(val);
      console.log('Valid JSON');
    } catch(e) {
      console.log('Invalid JSON:', e.message);
    }
  } else {
    console.log('not found');
  }
  c.end();
});
