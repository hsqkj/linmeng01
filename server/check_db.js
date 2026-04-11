const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'linmeng'
});

pool.query("SELECT config_value FROM sys_configs WHERE config_key = 'basic_types'", (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    pool.end();
    return;
  }
  if (rows.length > 0) {
    const data = JSON.parse(rows[0].config_value);
    console.log('communityTypes:', JSON.stringify(data.communityTypes, null, 2));
    console.log('residentTypes:', JSON.stringify(data.residentTypes, null, 2));
    console.log('Keys:', Object.keys(data));
  } else {
    console.log('No data found');
  }
  pool.end();
});
