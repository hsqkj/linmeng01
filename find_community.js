var fs = require('fs');
var dir = 'D:/WorkBuddy/20260331205655/client/dist/assets';
var files = fs.readdirSync(dir).filter(function(f){return f.endsWith('.js')});
var found = null;
files.forEach(function(f){
  var c = fs.readFileSync(dir+'/'+f,'utf8');
  if (c.includes('邻盟平台') || (c.includes('邻盟') && c.includes('社区用户'))) {
    found = f;
    console.log('Found community content in:', f, c.length);
  }
});
if (!found) console.log('No community Home found in any JS file');
