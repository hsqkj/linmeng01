const mysql = require('mysql2');
const c = mysql.createConnection({host:'localhost',user:'root',password:'root',database:'linmeng'});

c.query("SELECT id, name, level, parent_id FROM regions WHERE name LIKE '%关东%'", (e, r) => {
  console.log('regions表关东街道:', JSON.stringify(r, null, 2));
  c.query("SELECT street, community FROM communities WHERE community='长山社区'", (e2, r2) => {
    console.log('长山社区的street字段:', JSON.stringify(r2, null, 2));
    c.end();
  });
});
