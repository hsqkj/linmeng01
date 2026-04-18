const mysql = require('mysql2')
const c = mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:'root',database:'linmeng'})

c.query("SELECT id, real_name, community, street FROM communities WHERE street='关山街道'", (e,r) => {
  console.log("关山街道的社区:", JSON.stringify(r, null, 2))
  c.end()
})