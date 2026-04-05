const fs = require('fs');
const html = fs.readFileSync('c:/Users/12494/WorkBuddy/20260331205655/prototype/index.html', 'utf8');
const pages = html.match(/id="p-[^"]+"/g);
console.log('Total pages found:', pages && pages.length);
if (pages) pages.forEach(p => console.log(' ', p));

// Check for key pages
const required = [
  'p-index',
  'p-admin-login', 'p-admin-home',
  'p-community-login', 'p-community-register', 'p-community-home',
  'p-community-square', 'p-community-resource-detail', 'p-community-intention',
  'p-community-messages', 'p-community-profile', 'p-community-demand-publish',
  'p-community-demand-detail',
  'p-merchant-login', 'p-merchant-register', 'p-merchant-home',
  'p-merchant-demand-square', 'p-merchant-messages', 'p-merchant-profile',
  'p-merchant-publish',
  'p-ambassador-login', 'p-ambassador-home', 'p-ambassador-invite'
];
console.log('\nMissing pages:');
required.forEach(id => {
  if (!html.includes('id="' + id + '"')) console.log('  MISSING:', id);
});
console.log('\nFile size:', Math.round(html.length / 1024), 'KB');
