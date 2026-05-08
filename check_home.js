var fs = require('fs');
var dir = 'D:/WorkBuddy/20260331205655/client/dist/assets';
var files = fs.readdirSync(dir).filter(function(f){return f.startsWith('Home-')&&f.endsWith('.js')});
files.forEach(function(f){
  var c = fs.readFileSync(dir+'/'+f,'utf8');
  var type = c.includes('邻盟商家') ? 'MERCHANT' : (c.includes('邻盟平台') || c.includes('real_name') ? 'COMMUNITY' : 'unknown');
  console.log(f, type);
});
