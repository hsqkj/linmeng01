const pymysql = require('pymysql');

async function main() {
  const conn = pymysql.connect({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'linmeng'
  });

  const cursor = conn.cursor();

  // 查看 resources 表结构
  console.log('=== resources 表结构 ===');
  cursor.execute('DESCRIBE resources');
  const fields = cursor.fetchall();
  fields.forEach(f => console.log(f[0]));

  // 查看 demands 表结构
  console.log('\n=== demands 表结构 ===');
  cursor.execute('DESCRIBE demands');
  const demandFields = cursor.fetchall();
  demandFields.forEach(f => console.log(f[0]));

  conn.close();
}

main().catch(console.error);
