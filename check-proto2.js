const fs = require('fs');
const html = fs.readFileSync('c:/Users/12494/WorkBuddy/20260331205655/prototype/index.html', 'utf8');

// 检查各页面内容长度
const pageIds = [
  'p-merchant-publish',
  'p-community-demand-detail',
  'p-community-profile',
  'p-merchant-profile',
  'p-ambassador-home'
];

pageIds.forEach(id => {
  const start = html.indexOf('id="' + id + '"');
  if (start === -1) { console.log(id, ': NOT FOUND'); return; }
  // 找到下一个 class="page" 或结束
  const nextPage = html.indexOf('class="page"', start + 100);
  const snippet = html.substring(start, Math.min(start + 800, nextPage > 0 ? nextPage : start + 800));
  console.log('\n=== ' + id + ' (' + snippet.length + ' chars preview) ===');
  // 检查是否有实际内容（有 <form 或 <table 或 <div class 说明内容存在）
  const hasForm = snippet.includes('<form') || snippet.includes('<table') || snippet.includes('<div class=');
  console.log('Has content tags:', hasForm);
  console.log(snippet.substring(0, 300) + '...');
});
