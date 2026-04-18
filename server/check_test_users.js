const mysql = require('mysql2/promise');
function toMySQLVal(v, colType) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'string') {
    if (v === '') {
      // 空字符串对于 JSON 列转为 NULL
      if (colType && (colType.includes('json') || colType === 'point')) return 'NULL';
      return "''";
    }
    // JSON 列需要确保是有效 JSON
    if (colType && colType.includes('json')) {
      // 如果不是以 [ 或 { 开头，尝试转为 JSON 数组
      const trimmed = v.trim();
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
        // 逗号分隔的标签转为 JSON 数组
        if (trimmed.includes(',')) {
          const arr = trimmed.split(',').map(s => `"${s.trim()}"`).join(',');
          return `'[${arr}]'`;
        }
        return `'[${trimmed}]'`;
      }
      return `'${trimmed.replace(/'/g, "''")}'`;
    }
    return `'${v.replace(/'/g, "''")}'`;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return `'${v.toISOString().slice(0,19).replace('T',' ')}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}
async function main() {
  const c = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'root',database:'linmeng'});
  const phones = ['18800000001','18800000002','18800000003'];
  
  const [communities] = await c.query('SELECT * FROM communities WHERE phone IN (?)', [phones]);
  const [merchants] = await c.query('SELECT * FROM merchants WHERE phone IN (?)', [phones]);
  const [ambassadors] = await c.query('SELECT * FROM ambassadors WHERE phone IN (?)', [phones]);
  
  // 获取列类型
  const [colInfo] = await c.query('SHOW COLUMNS FROM communities');
  const colTypeMap = {};
  colInfo.forEach(r => colTypeMap[r.Field] = r.Type);
  
  const [mInfo] = await c.query('SHOW COLUMNS FROM merchants');
  const mTypeMap = {};
  mInfo.forEach(r => mTypeMap[r.Field] = r.Type);
  
  const [aInfo] = await c.query('SHOW COLUMNS FROM ambassadors');
  const aTypeMap = {};
  aInfo.forEach(r => aTypeMap[r.Field] = r.Type);
  
  const commonC = communities.map(row => {
    const cols = Object.keys(row).filter(k => k !== 'id');
    const vals = cols.map(k => toMySQLVal(row[k], colTypeMap[k]));
    return `INSERT INTO communities (${cols.join(',')}) VALUES (${vals.join(',')}) ON DUPLICATE KEY UPDATE phone=phone;`;
  });
  console.log(commonC.join('\n'));
  
  const commonM = merchants.map(row => {
    const cols = Object.keys(row).filter(k => k !== 'id');
    const vals = cols.map(k => toMySQLVal(row[k], mTypeMap[k]));
    return `INSERT INTO merchants (${cols.join(',')}) VALUES (${vals.join(',')}) ON DUPLICATE KEY UPDATE phone=phone;`;
  });
  console.log(commonM.join('\n'));
  
  const commonA = ambassadors.map(row => {
    const cols = Object.keys(row).filter(k => k !== 'id');
    const vals = cols.map(k => toMySQLVal(row[k], aTypeMap[k]));
    return `INSERT INTO ambassadors (${cols.join(',')}) VALUES (${vals.join(',')}) ON DUPLICATE KEY UPDATE phone=phone;`;
  });
  console.log(commonA.join('\n'));
  
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
