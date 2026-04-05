const fs = require('fs');
const html = fs.readFileSync('c:/Users/12494/WorkBuddy/20260331205655/prototype/index.html', 'utf8');

// 找出所有 showPage / goto 调用的目标 id
const calls = html.match(/(?:showPage|goto)\(['"]([^'"]+)['"]\)/g) || [];
const targets = new Set(calls.map(c => c.match(/['"]([^'"]+)['"]/)[1]));

// 找出所有实际存在的 page id
const existing = new Set((html.match(/id="p-([^"]+)"/g) || []).map(m => m.replace('id="p-','').replace('"','')));

console.log('== 导航引用但不存在的页面 ==');
targets.forEach(t => {
  if (!existing.has(t)) console.log('  MISSING TARGET:', t);
});

console.log('\n== 已存在的所有页面 ==');
existing.forEach(p => console.log('  p-' + p));
